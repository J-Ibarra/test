import { DepositRequest, DepositRequestStatus, DepositAddress } from '@abx-types/deposit'
import { isAccountSuspended, findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { createPendingDeposit, createPendingWithdrawal } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import { TransactionResponse, OnChainCurrencyGateway, getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { decryptValue } from '@abx-utils/encryption'
import { updateDepositRequest, updateAllDepositRequests, findDepositRequestByDepositTransactionHash, findDepositRequestsWithInsufficientAmount, findDepositRequestsForStatus } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode, Environment } from '@abx-types/reference-data'
import { getDepositTransactionFeeCurrencyId } from '../utils'
import Decimal from 'decimal.js'
import { DepositCompleter } from '../deposit-completion/DepositCompleter'

export class HoldingsTransactionDispatcher {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'HoldingsTransactionDispatcher')

  public async dispatchHoldingsTransactionForConfirmedDepositRequest(txid: string, currency: CurrencyCode) {
    this.logger.info(`Received a deposit transaction confirmation for currency ${currency} and transaction hash ${txid}`)
    const depositRequest = await findDepositRequestByDepositTransactionHash(txid)

    if (!depositRequest) {
      this.logger.warn(`Deposit request not found for transaction ${txid}, not processing any further`)
      return
    }

    if (await this.checkIfPendingHoldingsTransactionIsAvailable(depositRequest)) {
      await updateDepositRequest(depositRequest.id!, {
        status: DepositRequestStatus.blockedForHoldingsTransactionConfirmation,
      })
      return
    }
    this.dispatchHoldingsTransactionForDepositRequests([depositRequest], currency)
  }

  public async dispatchHoldingsTransactionForDepositRequests(depositRequests: DepositRequest[], currency: CurrencyCode) {
    if(!depositRequests || depositRequests.length === 0) {
      return
    }

    const { totalAmount: totalAmountToTransfer, depositsRequestsWithInsufficientStatus } = await this.computeTotalAmountToTransfer(depositRequests)

    const currencyManager = getOnChainCurrencyManagerForEnvironment(process.env.NODE_ENV as Environment, [currency])

    const holdingsTransactionHash = await this.transferTransactionAmountToHoldingsWallet(
      {
        ...depositRequests[0],
        amount: totalAmountToTransfer,
      },
      depositRequests.map(depositRequest => depositRequest.id!),
      depositsRequestsWithInsufficientStatus,
      currencyManager.getCurrencyFromTicker(currency),
    )

    if (holdingsTransactionHash) {
      this.logger.info(`Starting completion for deposit request with holdings transaction hash ${holdingsTransactionHash} for completion`)
      const depositCompleter = new DepositCompleter()
      await depositCompleter.processDepositRequestsForPendingHoldingsTransaction(
        holdingsTransactionHash,
        depositRequests.map(deposit => deposit.amount)
      )
    }
  }

  private async checkIfPendingHoldingsTransactionIsAvailable(depositRequest: DepositRequest): Promise<boolean> {
    const depositRequests = await findDepositRequestsForStatus(depositRequest.depositAddressId!, DepositRequestStatus.pendingHoldingsTransaction)
    return depositRequests.length > 0
  }

  /**
   * We want to add up the amount of all the deposit requests which are recorded in `insufficientBalance` status.
   * The result amount can then be added to the amount fo the current deposit request.
   */
  private async computeTotalAmountToTransfer(depositRequests: DepositRequest[]): Promise<{ totalAmount: number; depositsRequestsWithInsufficientStatus: number[] }> {
    const firstDepositAddressId = depositRequests[0].depositAddressId
    const preExistingDepositRequestsWithInsufficientBalance = await findDepositRequestsWithInsufficientAmount(firstDepositAddressId!)

    const totalAmounOfDepositsWithInsufficientBalance = preExistingDepositRequestsWithInsufficientBalance.reduce(
      (acc, { amount }) => new Decimal(acc).plus(amount),
      new Decimal(0),
    )

    this.logger.info(
      `Found ${preExistingDepositRequestsWithInsufficientBalance} pre existing deposits for deposit address ${firstDepositAddressId}, total amount of pre existing deposit requests ${totalAmounOfDepositsWithInsufficientBalance}`,
    )

    const totalRequestsAmount = depositRequests.reduce(
      (acc, { amount }) => new Decimal(acc).plus(amount),
      new Decimal(0),
    )

    return {
      totalAmount: new Decimal(totalRequestsAmount).plus(totalAmounOfDepositsWithInsufficientBalance).toNumber(),
      depositsRequestsWithInsufficientStatus: preExistingDepositRequestsWithInsufficientBalance.map(({ id }) => id!),
    }
  }

  /**
   * Creates a holdings transaction, transferring the deposited funds to the Kinesis
   * holdings wallet. A pending deposit balance is also allocated (confirmed after the transaction gets confirmed).
   * The logic is only executed for active accounts.
   *
   * @param currency the deposited coin
   * @param depositRequest the deposit request
   * @param param the deposit request
   */
  private async transferTransactionAmountToHoldingsWallet(
    { amount, depositAddress }: DepositRequest,
    depositRequestIds: number[],
    joinedDepositRequestsWithInsufficientBalance: number[],
    onChainCurrencyGateway: OnChainCurrencyGateway,
  ): Promise<string | undefined> {
    const accountIsSuspended = await isAccountSuspended(depositAddress.accountId)
    const firstDepositRequestId = depositRequestIds[0] 

    if (!accountIsSuspended) {
      const { txHash: holdingsTransactionHash, transactionFee: holdingsTransactionFee } = await this.createHoldingsTransaction(
        depositAddress,
        onChainCurrencyGateway,
        amount,
      )
      this.logger.debug(`Created holdings transaction for requests ${depositRequestIds}`)
      
      await createPendingDeposit({
        accountId: depositAddress.accountId,
        amount,
        currencyId: depositAddress.currencyId,
        sourceEventId: firstDepositRequestId!,
        sourceEventType: SourceEventType.currencyDepositRequest,
      })

      await this.coverFeeByKinesisRevenueAccount(Number(holdingsTransactionFee), firstDepositRequestId, depositAddress.currencyId, onChainCurrencyGateway.ticker!)
      this.logger.debug(`Created pending deposit balance for deposit requests ${depositRequestIds}`)

      await Promise.all([
        updateAllDepositRequests(depositRequestIds, {
          holdingsTxHash: holdingsTransactionHash,
          holdingsTxFee: Number(holdingsTransactionFee),
          status: DepositRequestStatus.pendingCompletion,
        }),
        joinedDepositRequestsWithInsufficientBalance.length > 0
          ? updateAllDepositRequests(joinedDepositRequestsWithInsufficientBalance, {
              holdingsTxHash: holdingsTransactionHash,
              status: DepositRequestStatus.pendingCompletion,
            })
          : (Promise.resolve() as any),
      ])

      return holdingsTransactionHash
    }

    return
  }

  private async createHoldingsTransaction(
    depositAddress: DepositAddress,
    onChainCurrencyManager: OnChainCurrencyGateway,
    amount: number,
  ): Promise<TransactionResponse> {
    const [decryptedPrivateKey, decryptedWif] = await Promise.all([
      decryptValue(depositAddress.encryptedPrivateKey),
      decryptValue(depositAddress.encryptedWif!),
    ])

    return onChainCurrencyManager.transferToExchangeHoldingsFrom(
      {
        privateKey: decryptedPrivateKey!,
        wif: decryptedWif!,
        address: depositAddress.address!,
      },
      amount,
    )
  }

  /** Covers the on-chain transaction fee, deducting it from the kinesis revenue account. */
  private async coverFeeByKinesisRevenueAccount(transactionFee: number, depositRequestId: number, currencyId: number, currencyCode: CurrencyCode) {
    const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount()
    const transactionFeeCurrencyId = await getDepositTransactionFeeCurrencyId(currencyId, currencyCode)

    await createPendingWithdrawal({
      pendingWithdrawalParams: {
        accountId: kinesisRevenueAccount.id,
        amount: transactionFee,
        currencyId: transactionFeeCurrencyId,
        sourceEventId: depositRequestId!,
        sourceEventType: SourceEventType.currencyDeposit,
      },
    })

    this.logger.info(
      `A ${transactionFee} on chain fee has been paid for deposit request ${depositRequestId} and deducted from revenue balance for currency ${currencyId}`,
    )
  }
}
