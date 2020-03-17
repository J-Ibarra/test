import { denyPendingDeposit } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import { findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { CurrencyCode } from '@abx-types/reference-data'
import { OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'
import { Logger } from '@abx-utils/logging'

const logger = Logger.getInstance('withdrawal-processor', 'kinesis_revenue_transaction_fee_reconciler')
const currencyToCoverOnChainFeeFor = [CurrencyCode.ethereum, CurrencyCode.kvt, CurrencyCode.tether, CurrencyCode.bitcoin]

/**
 * Prior to transferring the funds we reserve the total withdrawal amount
 * from the user balance and increase the pending deposit currency balance for the kinesis revenue account
 * by the withdrawal fee (based on the currency). This step here is to make sure we deduct the on-chain transaction fee
 * from the fee amount we have already allocated in the kinesis revenue account.
 */
export async function deductOnChainTransactionFeeFromRevenueBalance(
  withdrawalRequestId: number,
  transactionFee: number,
  currencyGateway: OnChainCurrencyGateway,
  feeCurrencyId: number,
) {
  if (currencyToCoverOnChainFeeFor.includes(currencyGateway.ticker!)) {
    const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount()

    await denyPendingDeposit({
      accountId: kinesisRevenueAccount.id,
      amount: transactionFee,
      currencyId: feeCurrencyId,
      sourceEventId: withdrawalRequestId!,
      sourceEventType: SourceEventType.currencyWithdrawal,
    })

    logger.info(
      `A ${transactionFee} on chain fee has been paid for withdrawal request ${withdrawalRequestId} and deducted from revenue balance for currency ${feeCurrencyId}`,
    )
  }
}
