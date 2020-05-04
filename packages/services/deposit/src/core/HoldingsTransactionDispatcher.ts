import { DepositRequest, DepositAddress } from '@abx-types/deposit'
import { isAccountSuspended, findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { createPendingDeposit, createPendingWithdrawal } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import { TransactionResponse, OnChainCurrencyGateway, getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { decryptValue } from '@abx-utils/encryption'
import { updateAllDepositRequests, findDepositRequestsForIds } from '.'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode, Environment } from '@abx-types/reference-data'
import { getDepositTransactionFeeCurrencyId } from './utils'
import { DepositAmountCalculator } from './DepositAmountCalculator'
import Decimal from '@abx-service-clients/reference-data/node_modules/decimal.js'

export class HoldingsTransactionDispatcher {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'HoldingsTransactionDispatcher')
  private readonly depositAmountCalculator = new DepositAmountCalculator()

  public async dispatchHoldingsTransactionForDepositRequests(depositRequests: DepositRequest[], currency: CurrencyCode) : Promise<DepositRequest[]> {
    const {
      totalAmount: totalAmountToTransfer,
      depositsRequestsWithInsufficientStatus,
    } = await this.depositAmountCalculator.computeTotalAmountToTransfer(depositRequests)

    const currencyManager = getOnChainCurrencyManagerForEnvironment(process.env.NODE_ENV as Environment)

    await this.transferTransactionAmountToHoldingsWallet(
      {
        ...depositRequests[0],
        amount: totalAmountToTransfer,
      },
      depositRequests.map((depositRequest) => depositRequest.id!),
      depositsRequestsWithInsufficientStatus.map(({ id }) => id!),
      currencyManager.getCurrencyFromTicker(currency),
    )

    return findDepositRequestsForIds(
      depositRequests.concat(depositsRequestsWithInsufficientStatus).map(({ id }) => id!),
    )
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

      await this.coverFeeByKinesisRevenueAccount(
        Number(holdingsTransactionFee),
        firstDepositRequestId,
        depositAddress.currencyId,
        onChainCurrencyGateway.ticker!,
      )
      this.logger.debug(`Created pending deposit balance for deposit requests ${depositRequestIds}`)

      await Promise.all([
        updateAllDepositRequests(depositRequestIds, {
          holdingsTxHash: holdingsTransactionHash,
          holdingsTxFee: new Decimal(holdingsTransactionFee!).dividedBy(depositRequestIds.length).toNumber(),
        }),
        joinedDepositRequestsWithInsufficientBalance.length > 0
          ? updateAllDepositRequests(joinedDepositRequestsWithInsufficientBalance, {
              holdingsTxHash: holdingsTransactionHash,
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
        wif: decryptedWif,
        address: depositAddress.address,
        publicKey: depositAddress.publicKey,
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
