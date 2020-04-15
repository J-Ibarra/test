import { DepositRequest, DepositRequestStatus, DepositAddress } from '@abx-types/deposit'
import { isAccountSuspended, findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { createPendingDeposit, createPendingWithdrawal } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import { TransactionResponse, OnChainCurrencyGateway, getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { decryptValue } from '@abx-utils/encryption'
import { updateDepositRequest, updateAllDepositRequests, findDepositRequestByDepositTransactionHash, findDepositRequestsWithInsufficientAmount, findDepositRequestsByHoldingsTransactionHash, findDepositRequestsForStatus } from '../../../../core'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode, Environment } from '@abx-types/reference-data'
import { getDepositTransactionFeeCurrencyId } from '../utils'
import Decimal from 'decimal.js'
import { DepositCompleter } from '../deposit-completion/DepositCompleter'

export class HoldingsTransactionDispatcher {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'HoldingsTransactionDispatcher')

  public async processDepositAddressTransaction(txid: string, currency: CurrencyCode) {
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

    const { totalAmount: totalAmountToTransfer, depositsRequestsWithInsufficientStatus } = await this.computeTotalAmountToTransfer(depositRequest)

    const currencyManager = getOnChainCurrencyManagerForEnvironment(process.env.NODE_ENV as Environment, [currency])

    const holdingsTransactionHash = await this.transferTransactionAmountToHoldingsWallet(
      {
        ...depositRequest,
        amount: totalAmountToTransfer,
      },
      depositsRequestsWithInsufficientStatus,
      currencyManager.getCurrencyFromTicker(currency),
    )

    if (holdingsTransactionHash) {
      this.logger.info(`Starting completion for deposit request with holdings transaction hash ${txid} for completion`)
      this.processDepositRequest(holdingsTransactionHash)
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
  private async computeTotalAmountToTransfer({
    amount: currentRequestAmount,
    depositAddressId,
    id: depositRequestId,
  }: DepositRequest): Promise<{ totalAmount: number; depositsRequestsWithInsufficientStatus: number[] }> {
    const preExistingDepositRequestsWithInsufficientBalance = await findDepositRequestsWithInsufficientAmount(depositAddressId!)

    const totalAmounOfDepositsWithInsufficientBalance = preExistingDepositRequestsWithInsufficientBalance.reduce(
      (acc, { amount }) => new Decimal(acc).plus(amount),
      new Decimal(0),
    )

    this.logger.info(
      `Found ${preExistingDepositRequestsWithInsufficientBalance} pre existing deposits for deposit address ${depositAddressId} while processing deposit request ${depositRequestId}, total amount of pre existing deposit requests ${totalAmounOfDepositsWithInsufficientBalance}`,
    )

    return {
      totalAmount: new Decimal(currentRequestAmount).plus(totalAmounOfDepositsWithInsufficientBalance).toNumber(),
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
    { amount, id, depositAddress }: DepositRequest,
    joinedDepositRequestsWithInsufficientBalance: number[],
    onChainCurrencyGateway: OnChainCurrencyGateway,
  ): Promise<string | undefined> {
    const accountIsSuspended = await isAccountSuspended(depositAddress.accountId)

    if (!accountIsSuspended) {
      const { txHash: holdingsTransactionHash, transactionFee: holdingsTransactionFee } = await this.createHoldingsTransaction(
        depositAddress,
        onChainCurrencyGateway,
        amount,
      )
      this.logger.debug(`Created holdings transaction for request ${id}`)
      await createPendingDeposit({
        accountId: depositAddress.accountId,
        amount,
        currencyId: depositAddress.currencyId,
        sourceEventId: id!,
        sourceEventType: SourceEventType.currencyDepositRequest,
      })

      await this.coverFeeByKinesisRevenueAccount(Number(holdingsTransactionFee), id!, depositAddress.currencyId, onChainCurrencyGateway.ticker!)
      this.logger.debug(`Created pending deposit balance for deposit request${id}`)

      await Promise.all([
        updateDepositRequest(id!, {
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

  private async processDepositRequest(txid: string) {
    const depositCompleter = new DepositCompleter()
    await depositCompleter.processPendingHoldingsForDepositRequest(txid)
  }
}
