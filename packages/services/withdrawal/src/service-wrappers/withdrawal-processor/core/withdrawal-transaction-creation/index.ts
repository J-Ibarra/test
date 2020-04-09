import { CryptoWithdrawalRequestWrapper, WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL } from '@abx-service-clients/withdrawal'
import { getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { findCryptoCurrencies } from '@abx-service-clients/reference-data'
import { Environment, SymbolPairStateFilter } from '@abx-types/reference-data'
import { handleCryptoCurrencyWithdrawalRequest } from './crypto_currency_request_handler'
import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { findWithdrawalRequestByIdWithFeeRequest } from '../../../../core'

export function bootstrapNewWithdrawalRequestQueueProcessor() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages<CryptoWithdrawalRequestWrapper>(WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL, processNewWithdrawalRequest)
}

async function processNewWithdrawalRequest(cryptoWithdrawalRequest: CryptoWithdrawalRequestWrapper) {
  const currencies = await findCryptoCurrencies(SymbolPairStateFilter.all)
  const currencyManager = getOnChainCurrencyManagerForEnvironment(
    process.env.NODE_ENV as Environment,
    currencies.map(({ code }) => code),
  )

  const withdrawalRequest = (await findWithdrawalRequestByIdWithFeeRequest(cryptoWithdrawalRequest.id))!
  const currency = currencies.find(({ id }) => id === withdrawalRequest.currencyId)!

  await handleCryptoCurrencyWithdrawalRequest({ ...withdrawalRequest, currency }, currencyManager.getCurrencyFromTicker(currency.code))
}
