import { User } from '@abx-types/account'
import { findUserByAccountId } from '@abx-service-clients/account'
import { findAdminRequest } from '@abx-service-clients/admin-fund-management'
import { DepositRequest } from '@abx-types/deposit'
import { findDepositAddressesForAccount, findDepositRequestById } from '@abx-service-clients/deposit'
import { CurrencyCode, Currency } from '@abx-types/reference-data'
import { CurrencyTransaction, TransactionType } from '@abx-types/order'
import { WithdrawalRequest } from '@abx-types/withdrawal'
import { findWithdrawalRequestForTransactionHash } from '@abx-service-clients/withdrawal'
import { TransactionHistory, TransactionHistoryDirection } from './model'
import { verifyIsFromKBE } from './util'
import { isFiatCurrency } from '@abx-service-clients/reference-data'

export async function buildDepositTransactionHistory() {}
/**
 * Form currency transaction to transaction history type
 * @param currencyTransaction
 * @param selectedCurrencyCode
 */
export async function formDepositCurrencyTransactionToHistory(
  currencyTransaction: CurrencyTransaction,
  selectedCurrencyCode: CurrencyCode,
  allCurrencies: Currency[],
): Promise<TransactionHistory> {
  if (isFiatCurrency(selectedCurrencyCode)) {
    return formFiatDepositHistoryItem(currencyTransaction, selectedCurrencyCode)
  }

  return formCryptoDepositHistoryItem(currencyTransaction, selectedCurrencyCode, allCurrencies)
}

async function formFiatDepositHistoryItem(currencyTransaction: CurrencyTransaction, selectedCurrencyCode: CurrencyCode) {
  const depositAdminRequest = await findAdminRequest({ id: currencyTransaction.requestId })

  return {
    transactionType: TransactionType.currency,
    primaryCurrencyCode: selectedCurrencyCode,
    primaryAmount: currencyTransaction.amount,
    preferredCurrencyCode: selectedCurrencyCode,
    preferredCurrencyAmount: currencyTransaction.amount,
    title: 'Kinesis Operations',
    memo: !!depositAdminRequest ? depositAdminRequest.description! : currencyTransaction.memo!,
    direction: TransactionHistoryDirection.incoming,
    createdAt: currencyTransaction.createdAt!,
  }
}

async function formCryptoDepositHistoryItem(currencyTransaction: CurrencyTransaction, selectedCurrencyCode: CurrencyCode, allCurrencies: Currency[]) {
  const [depositRequest, depositCurrency] = await Promise.all([
    findDepositRequestById(currencyTransaction.requestId!),
    allCurrencies.find(({ code }) => code === selectedCurrencyCode)!,
  ])

  if (!depositRequest) {
    throw new Error(`Deposit ${currencyTransaction.requestId} not found`)
  }

  const depositRequestSender = await getDepositRequestSender(depositRequest)
  const sender = !!depositRequestSender ? depositRequestSender.sender : undefined
  const senderRequest = !!depositRequestSender ? depositRequestSender.senderRequest : undefined

  const { title, memo, senderAddress, transactionType } = !!sender
    ? await resultOfSenderExist(sender, senderRequest, depositCurrency!.id)
    : resultOfSenderNotExist(depositRequest)

  return {
    transactionType,
    primaryCurrencyCode: selectedCurrencyCode,
    primaryAmount: currencyTransaction.amount,
    preferredCurrencyCode: depositRequest.fiatCurrencyCode.toString() as CurrencyCode,
    preferredCurrencyAmount: depositRequest.fiatConversion,
    title,
    memo: memo!,
    direction: TransactionHistoryDirection.incoming,
    createdAt: currencyTransaction.createdAt!,
    transactionId: !!depositRequest ? depositRequest.depositTxHash : '',
    targetAddress: senderAddress,
  }
}

/**
 * Get sender if the withdraw request is transfer request
 * @param depositRequest
 */
export async function getDepositRequestSender(depositRequest: DepositRequest) {
  const { from: address, depositTxHash } = depositRequest
  const isTransfer = await verifyIsFromKBE(address)

  if (!isTransfer) {
    return
  }

  const withdrawalRequest = await findWithdrawalRequestForTransactionHash(depositTxHash)

  if (!withdrawalRequest) {
    return
  }
  const sender = await findUserByAccountId(withdrawalRequest.accountId)

  return { sender, senderRequest: withdrawalRequest }
}

interface Result {
  title: string
  senderAddress: string
  transactionType: TransactionType
  memo: string
}

const resultOfSenderExist = async (sender: User, senderRequest: WithdrawalRequest | undefined, selectedCurrencyId: number): Promise<Result> => {
  const senderAddresses = await findDepositAddressesForAccount(sender.accountId)

  const senderAddress = senderAddresses.find(req => req.currencyId === selectedCurrencyId)!.publicKey

  const title = `${senderAddress.substring(0, 7)}...${senderAddress.substring(senderAddress.length - 4)}`
  const transactionType = TransactionType.transfer
  const memo = senderRequest ? senderRequest.memo : ''
  return { title, senderAddress, transactionType, memo: memo! }
}

const resultOfSenderNotExist = (depositRequest: DepositRequest): Result => {
  const senderAddress = !!depositRequest ? depositRequest.from : ''
  const title = `${senderAddress.substring(0, 7)}...${senderAddress.substring(senderAddress.length - 4)}`
  const transactionType = TransactionType.currency
  const memo = ''
  return { title, senderAddress, transactionType, memo }
}
