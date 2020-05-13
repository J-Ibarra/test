import { DepositRequest, DepositRequestStatus, DepositAddress } from '@abx-types/deposit'
import { updateAllDepositRequests, sendDepositConfirmEmail } from '.'
import { Logger } from '@abx-utils/logging'
import { triggerMultipleBalanceChanges, BalanceAsyncRequestType } from '@abx-service-clients/balance'
import { createCurrencyTransactions } from '@abx-service-clients/order'
import { SourceEventType } from '@abx-types/balance'
import { findCurrencyForId } from '@abx-service-clients/reference-data'
import { findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import Decimal from 'decimal.js'
import { getDepositTransactionFeeCurrencyId } from './utils'
import { CurrencyCode, SymbolPairStateFilter } from '@abx-types/reference-data'
import { TransactionDirection } from '@abx-types/order'

export class DepositCompleter {
  private readonly logger = Logger.getInstance('third-party-coin-deposit-processor', 'DepositCompleter')

  /**
   * Carries out the final step of the deposit process where:
   * - the balance is updated
   * - currency transactions are created
   * - confirmation email is sent
   * - all deposit requests are updated with 'completed | pendingHoldingsTransactionConfirmation' status
   * - all blocked deposit requests for the same deposit address are batched
   * -     and sent in a new holgings transaction
   *
   * @param txid the confirmed holdings transaction id
   */
  public async completeDepositRequests(
    depositRequests: DepositRequest[], 
    currencyCode: CurrencyCode,
    status: DepositRequestStatus
  ) : Promise<DepositRequest[]> {
    this.logger.info(
      `Completing ${currencyCode} deposit requests ${depositRequests.map(({ id }) => id).join(',')} for address ${depositRequests[0].depositAddress
        .id!}`,
    )
    const depositAddress = depositRequests[0].depositAddress
    const depositRequestWhereHoldingsFeeWasRecorded = depositRequests.find(({ holdingsTxFee }) => !!holdingsTxFee)!
    const depositCurrency = await findCurrencyForId(depositAddress.currencyId, SymbolPairStateFilter.all)

    await this.triggerBalanceUpdates(
      depositRequests,
      depositRequestWhereHoldingsFeeWasRecorded.id!,
      { ...depositAddress, currency: depositCurrency },
      depositRequestWhereHoldingsFeeWasRecorded.holdingsTxFee!,
    )
    await createCurrencyTransactions(
      depositRequests.map((depositRequest) => ({
        accountId: depositRequest.depositAddress.accountId,
        amount: depositRequest.amount,
        currencyId: depositRequest.depositAddress.currencyId,
        direction: TransactionDirection.deposit,
        requestId: depositRequest.id!,
      })),
    )

    await Promise.all(depositRequests.map(({ amount }) => sendDepositConfirmEmail(depositAddress.accountId, amount, depositCurrency.code)))

    const resultDepositRequests = await updateAllDepositRequests(
      depositRequests.map(({ id }) => id!),
      { status },
    )
    this.logger.info(`Completed ${currencyCode} deposit requests: ${depositRequests.map(({ id }) => id).join(',')}`)

    return resultDepositRequests
  }

  private async triggerBalanceUpdates(
    depositRequests: DepositRequest[],
    depositRequestId: number,
    { accountId, currency }: DepositAddress,
    holdingsTxFee: number,
  ) {
    const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount()
    const transactionFeeCurrencyId = await getDepositTransactionFeeCurrencyId(currency!.id, currency!.code)
    const totalAmount = depositRequests.reduce((acc, { amount }) => new Decimal(acc).plus(amount), new Decimal(0)).toNumber()

    return triggerMultipleBalanceChanges([
      {
        type: BalanceAsyncRequestType.confirmPendingDeposit,
        payload: {
          accountId,
          amount: totalAmount,
          currencyId: currency!.id,
          sourceEventId: depositRequestId!,
          sourceEventType: SourceEventType.currencyDeposit,
        },
      },
      {
        type: BalanceAsyncRequestType.confirmPendingWithdrawal,
        payload: {
          accountId: kinesisRevenueAccount.id,
          amount: holdingsTxFee,
          currencyId: transactionFeeCurrencyId,
          sourceEventId: depositRequestId,
          sourceEventType: SourceEventType.currencyDeposit,
        },
      },
    ])
  }
}
