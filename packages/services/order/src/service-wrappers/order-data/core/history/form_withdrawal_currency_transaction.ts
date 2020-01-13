import Decimal from 'decimal.js'
import { User } from '@abx-types/account'
import { CurrencyCode } from '@abx-types/reference-data'
import { CurrencyTransaction, TransactionType } from '@abx-types/order'
import { WithdrawalRequest, WithdrawalRequestType } from '@abx-types/withdrawal'
import { TransactionHistory, TransactionHistoryDirection } from './model'
import { findWithdrawalRequestsByIds } from '@abx-service-clients/withdrawal'


export async function buildWithdrawalTransactionHistory(
  currencyTransactions: CurrencyTransaction[],
  selectedCurrencyCode: CurrencyCode,
) {
  const withdrawalRequests = await findWithdrawalRequestsByIds(currencyTransactions.map(({ requestId }) => requestId!))
  const registeredDepositAddressesForWithdrawalRequests = 
  }

/**
 * Form withdrawal request to transaction history type
 * @param currencyTransaction
 * @param selectedCurrencyCode
 */
export async function formWithdrawalCurrencyTransactionToHistory(
  withdrawalRequest: WithdrawalRequest,
  selectedCurrencyCode: CurrencyCode,
): Promise<TransactionHistory> {
  const { withdrawalFee, feeCurrencyCode } = await getWithdrawalFee(
    withdrawalRequest.currency.code,
    withdrawalRequest.amount,
    withdrawalRequest.adminRequestId,
  )
  const receiver = await getWithdrawRequestReceiver(withdrawalRequest)

  const { title, transactionType } = !!receiver
    ? resultOfReceiverExist(withdrawalRequest.address)
    : resultOfReceiverNotExist(withdrawalRequest.currency.code)

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
    memo: withdrawalRequest.memo,
    direction: TransactionHistoryDirection.outgoing,
    createdAt: withdrawalRequest.createdAt,
    transactionId: withdrawalRequest.txHash,
    targetAddress: withdrawalRequest.address,
    fee: withdrawalFee,
    feeCurrency: feeCurrencyCode,
  }
}

/**
 * Get receiver if the withdraw request is transfer request
 * @param withdrawalRequest
 */
export async function getWithdrawRequestReceiver(withdrawalRequest: WithdrawalRequest): Promise<User> {
  const targetAddress = withdrawalRequest.address
  if (!targetAddress) {
    return
  }
  const depositAddresses = await findDepositAddresses({
    publicKey: targetAddress,
  })

  if (depositAddresses.length === 0) {
    return
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
