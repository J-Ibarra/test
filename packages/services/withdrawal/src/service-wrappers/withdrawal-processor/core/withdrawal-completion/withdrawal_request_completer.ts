import { WithdrawalCompletionPendingPayload } from './model'
import { nativelyImplementedCoins } from '../withdrawal-transaction-creation/withdrawal-transaction-dispatcher'
import { getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { findAllCurrencyCodes } from '@abx-service-clients/reference-data'
import { Environment } from '@abx-types/reference-data'
import { findWithdrawalRequestByTxHashWithFeeRequest } from '../../../../core'
import { completeCryptoWithdrawal } from './crypto'
import { Logger } from '@abx-utils/logging'

const logger = Logger.getInstance('order-data', 'withdrawal-completion')

export async function completeWithdrawalRequest({ txid, currency }: WithdrawalCompletionPendingPayload) {
  const allCurrencyCodes = await findAllCurrencyCodes()
  const currencyManager = getOnChainCurrencyManagerForEnvironment(process.env.NODE_ENV as Environment, allCurrencyCodes)

  // We only need to verify the confirmation for natively implemented
  // coin integrations since the the ones implemented with Crypto API
  // are guaranteed to have been confirmed
  if (nativelyImplementedCoins.includes(currency)) {
    const onChainCurrencyGateway = currencyManager.getCurrencyFromTicker(currency)
    const transactionConfirmed = await onChainCurrencyGateway.checkConfirmationOfTransaction(txid)

    if (!transactionConfirmed) {
      return
    }
  }

  const withdrawalRequestToComplete = await findWithdrawalRequestByTxHashWithFeeRequest(txid)

  if (!withdrawalRequestToComplete) {
    logger.warn(`Attempted to complete withdrawal request with txid ${txid} that could not be found`)
    return
  }

  await completeCryptoWithdrawal(withdrawalRequestToComplete, withdrawalRequestToComplete.feeRequest)
}
