import {
  CryptoWithdrawalRequestWrapper,
  WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL,
  BatchCryptoWithdrawalRequestWrapper,
  SingleCryptoWithdrawalRequestWrapper,
} from '@abx-service-clients/withdrawal'
import { getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { findCryptoCurrencies } from '@abx-service-clients/reference-data'
import { Environment, SymbolPairStateFilter } from '@abx-types/reference-data'
import { handleCryptoCurrencyWithdrawalRequest } from './crypto_currency_request_handler'
import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { findWithdrawalRequestByIdWithFeeRequest } from '../../../../core'
import { processWaitingWithdrawalBatch } from './batch-processing/batch_withdrawal_processor'
import { runHandlerAndSkipDeletionOnFailure } from '../common'

export function bootstrapNewWithdrawalRequestQueueProcessor() {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages<CryptoWithdrawalRequestWrapper>(WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL, processNewWithdrawalRequest)
}

export async function processNewWithdrawalRequest(cryptoWithdrawalRequest: CryptoWithdrawalRequestWrapper) {
  const currencies = await findCryptoCurrencies(SymbolPairStateFilter.all)
  const currencyManager = getOnChainCurrencyManagerForEnvironment(process.env.NODE_ENV as Environment)

  if ((cryptoWithdrawalRequest as BatchCryptoWithdrawalRequestWrapper).isBatch) {
    const currency = (cryptoWithdrawalRequest as BatchCryptoWithdrawalRequestWrapper).currency

    return runHandlerAndSkipDeletionOnFailure(() => processWaitingWithdrawalBatch(currency, currencyManager.getCurrencyFromTicker(currency)))
  } else {
    const withdrawalRequest = (await findWithdrawalRequestByIdWithFeeRequest((cryptoWithdrawalRequest as SingleCryptoWithdrawalRequestWrapper).id))!
    const currency = currencies.find(({ id }) => id === withdrawalRequest.currencyId)!

    return runHandlerAndSkipDeletionOnFailure(() =>
      handleCryptoCurrencyWithdrawalRequest({ ...withdrawalRequest, currency }, currencyManager.getCurrencyFromTicker(currency.code)),
    )
  }
}
