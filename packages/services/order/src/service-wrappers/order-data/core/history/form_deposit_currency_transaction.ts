import { DepositRequest } from '@abx-types/deposit'
import { findDepositAddressesForAccount, findDepositRequestsByIds } from '@abx-service-clients/deposit'
import { CurrencyCode, Currency } from '@abx-types/reference-data'
import { CurrencyTransaction, TransactionType } from '@abx-types/order'
import { WithdrawalRequest } from '@abx-types/withdrawal'
import { findWithdrawalRequestsForTransactionHashes } from '@abx-service-clients/withdrawal'
import { TransactionHistoryDirection, TransactionHistory } from './model'
import { isFiatCurrency, getExchangeHoldingsWallets } from '@abx-service-clients/reference-data'
import { AdminRequest, findAdminRequests } from '@abx-service-clients/admin-fund-management'
import { groupBy, head } from 'lodash'

export async function buildDepositTransactionHistory(
  selectedCurrencyCode: CurrencyCode,
  depositTransactions: CurrencyTransaction[],
  allCurrencies: Currency[],
): Promise<TransactionHistory[]> {
  if (isFiatCurrency(selectedCurrencyCode)) {
    const adminRequests: AdminRequest[] = await findAdminRequests(depositTransactions.map(({ requestId }) => requestId!))
    const adminRequestIdToDescription =
      adminRequests.reduce((acc, adminRequest) => (acc[adminRequest.id] = adminRequest.description), {} as Record<number, string | undefined>) || {}

    return Promise.all(
      depositTransactions.map(depositTransaction =>
        formFiatDepositHistoryItem(depositTransaction, selectedCurrencyCode, adminRequestIdToDescription[depositTransaction.requestId!]),
      ),
    )
  }

  const holdingWallets = await getExchangeHoldingsWallets()
  const depositRequests = await findDepositRequestsByIds(depositTransactions.map(({ requestId }) => requestId!))
  const depositRequestIdToRequest = groupBy<DepositRequest>(depositRequests, 'id')

  const withdrawalRequests = await findWithdrawalRequestsForTransactionHashes(depositRequests.map(({ depositTxHash }) => depositTxHash))
  const txHashToWithdrawalRequest = groupBy(withdrawalRequests, 'txHash')

  return Promise.all(
    depositTransactions.map(depositTransaction => {
      const depositRequest = head(depositRequestIdToRequest[depositTransaction.requestId!])!

      return formCryptoDepositHistoryItem(
        depositTransaction,
        depositRequest,
        selectedCurrencyCode,
        allCurrencies,
        holdingWallets.some(holdingWallet => holdingWallet.publicKey === depositRequest.from)
          ? head(txHashToWithdrawalRequest[depositRequest.depositTxHash] || [])!
          : null,
      )
    }),
  )
}

async function formFiatDepositHistoryItem(
  currencyTransaction: CurrencyTransaction,
  selectedCurrencyCode: CurrencyCode,
  adminRequestDescription?: string,
) {
  return {
    transactionType: TransactionType.currency,
    primaryCurrencyCode: selectedCurrencyCode,
    primaryAmount: currencyTransaction.amount,
    preferredCurrencyCode: selectedCurrencyCode,
    preferredCurrencyAmount: currencyTransaction.amount,
    title: 'Kinesis Operations',
    memo: adminRequestDescription || currencyTransaction.memo!,
    direction: TransactionHistoryDirection.incoming,
    createdAt: currencyTransaction.createdAt!,
  }
}

async function formCryptoDepositHistoryItem(
  currencyTransaction: CurrencyTransaction,
  depositRequest: DepositRequest,
  selectedCurrencyCode: CurrencyCode,
  allCurrencies: Currency[],
  senderRequest?: WithdrawalRequest | null,
): Promise<TransactionHistory> {
  const depositCurrency = allCurrencies.find(({ code }) => code === selectedCurrencyCode)

  const { title, memo, senderAddress, transactionType } = !!senderRequest
    ? await resultOfSenderExist(senderRequest, depositCurrency!.id)
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

interface Result {
  title: string
  senderAddress: string
  transactionType: TransactionType
  memo: string
}

const resultOfSenderExist = async (senderRequest: WithdrawalRequest | undefined, selectedCurrencyId: number): Promise<Result> => {
  const senderAddresses = await findDepositAddressesForAccount(senderRequest!.accountId)
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
