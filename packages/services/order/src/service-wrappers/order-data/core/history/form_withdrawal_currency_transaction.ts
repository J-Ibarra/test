import Decimal from 'decimal.js'
import { CurrencyCode } from '@abx-types/reference-data'
import { CurrencyTransaction, TransactionType } from '@abx-types/order'
import { WithdrawalRequest, WithdrawalRequestType } from '@abx-types/withdrawal'
import { TransactionHistory, TransactionHistoryDirection } from './model'
import { findWithdrawalRequestsByIds, getWithdrawalFees } from '@abx-service-clients/withdrawal'
import { groupBy, head } from 'lodash'

export async function buildWithdrawalTransactionHistory(
  currencyTransactions: CurrencyTransaction[],
  selectedCurrencyCode: CurrencyCode,
): Promise<TransactionHistory[]> {
  const withdrawalRequests = await findWithdrawalRequestsByIds(currencyTransactions.map(({ requestId }) => requestId!))
  const withdrawalFees = await getWithdrawalFees(
    selectedCurrencyCode,
    withdrawalRequests.map(({ id, amount, adminRequestId }) => ({ withdrawalRequestId: id!, withdrawalAmount: amount, adminRequestId })),
  )
  const withdrawalRequestIdToFees = groupBy(withdrawalFees, 'withdrawalRequestId')

  return Promise.all(
    withdrawalRequests.map(withdrawalRequest => {
      const withdrawalRequestFeeDetails = head(withdrawalRequestIdToFees[withdrawalRequest.id!])!

      return formWithdrawalCurrencyTransactionToHistory(
        withdrawalRequest,
        selectedCurrencyCode,
        withdrawalRequestFeeDetails.feeCurrencyCode,
        withdrawalRequestFeeDetails.withdrawalFee,
      )
    }),
  )
}

/**
 * Form withdrawal request to transaction history type
 * @param currencyTransaction
 * @param selectedCurrencyCode
 */
export async function formWithdrawalCurrencyTransactionToHistory(
  withdrawalRequest: WithdrawalRequest,
  selectedCurrencyCode: CurrencyCode,
  feeCurrencyCode: CurrencyCode,
  withdrawalFee: number,
): Promise<TransactionHistory> {
  const { title, transactionType } = !!withdrawalRequest.address
    ? resultOfReceiverExist(withdrawalRequest.address)
    : resultOfReceiverNotExist(selectedCurrencyCode)

  const primaryCurrencyEqualsFeeCurrency = feeCurrencyCode === selectedCurrencyCode
  const primaryAmountBeforeFee = new Decimal(withdrawalRequest.amount)
  const preferredCurrencyAmountIncludeFee = new Decimal(withdrawalRequest.fiatConversion)

  return {
    transactionType,
    primaryCurrencyCode: selectedCurrencyCode,
    primaryAmount: primaryCurrencyEqualsFeeCurrency
      ? primaryAmountBeforeFee
          .plus(withdrawalFee)
          .mul(-1)
          .toNumber()
      : primaryAmountBeforeFee.mul(-1).toNumber(),
    isFee: withdrawalRequest.type === WithdrawalRequestType.fee,
    preferredCurrencyCode: withdrawalRequest.fiatCurrencyCode.toString() as CurrencyCode,
    preferredCurrencyAmount: preferredCurrencyAmountIncludeFee.mul(-1).toNumber(),
    title,
    memo: withdrawalRequest.memo!,
    direction: TransactionHistoryDirection.outgoing,
    createdAt: withdrawalRequest.createdAt!,
    transactionId: withdrawalRequest.txHash,
    targetAddress: withdrawalRequest.address,
    fee: withdrawalFee,
    feeCurrency: feeCurrencyCode,
  }
}

interface Result {
  title: string
  transactionType: TransactionType
}

const resultOfReceiverExist = (address: string): Result => {
  return {
    title: `${address.substring(0, 7)}...${address.substring(address.length - 4)}`,
    transactionType: TransactionType.transfer,
  }
}

const resultOfReceiverNotExist = (currency: CurrencyCode): Result => ({
  title: `${currency} Withdrawal`,
  transactionType: TransactionType.currency,
})
