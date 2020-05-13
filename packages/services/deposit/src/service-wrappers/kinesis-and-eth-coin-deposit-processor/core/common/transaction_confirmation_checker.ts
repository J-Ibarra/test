import util from 'util'

import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequest } from '@abx-types/deposit'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { Logger } from '@abx-utils/logging'

export async function checkTransactionConfirmation(currency: CurrencyCode, depositRequest: DepositRequest, onChainCurrencyManager: CurrencyManager, logger: Logger) {
  const onChainGateway = onChainCurrencyManager.getCurrencyFromTicker(currency)

  try {
    const depositTransactionConfirmed = await onChainGateway.checkConfirmationOfTransaction(depositRequest.depositTxHash)

    return depositTransactionConfirmed
  } catch (e) {
    logger.error(`Error encountered while checking confirmation of deposit transaction ${depositRequest.depositTxHash}`)
    logger.error(JSON.stringify(util.inspect(e)))

    return false
  }
}