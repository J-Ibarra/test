import util from 'util'

import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { updateDepositRequest } from '../../../../core'
import { DepositGatekeeper, checkTransactionConfirmation } from '../common'

const logger = Logger.getInstance(
  'transaction_confirmed_deposit_requests_processor', 
  'processTransactionConfirmedDepositRequestForCurrency'
)

export async function processTransactionConfirmedDepositRequestsForCurrency(
  pendingHoldingsTransactionConfirmationGatekeeper: DepositGatekeeper,
  currency: CurrencyCode,
  onChainCurrencyManager: CurrencyManager,
) {
  const depositRequest = pendingHoldingsTransactionConfirmationGatekeeper.getNewestDepositForCurrency(currency)

  if (!depositRequest) {
    return
  }

  const depositTransactionConfirmed = await checkTransactionConfirmation(currency, depositRequest, onChainCurrencyManager, logger)
  if (!depositTransactionConfirmed) {
    logger.warn(`Attempted to process request ${depositRequest.id} where the transaction is not yet confirmed`)

    return pendingHoldingsTransactionConfirmationGatekeeper.unlockRequest(currency, depositRequest.id!)
  }
  logger.info(`Deposit transaction for request ${depositRequest.id} confirmed`)

  try {
    await completeDeposit(depositRequest)
    logger.info(`Deposit request ${depositRequest.id} successfully completed`)

    pendingHoldingsTransactionConfirmationGatekeeper.removeRequest(currency, depositRequest.id!)
  } catch (e) {
    logger.error(`Error encountered while process new deposit for ${currency}: ${depositRequest.id}`)
    logger.error(JSON.stringify(util.inspect(e)))
  }
}

async function completeDeposit(depositRequest: DepositRequest) {
  const { id, amount, depositAddress } = depositRequest

  await updateDepositRequest(id!, { status: DepositRequestStatus.completed })

  logger.debug(
    `Received Deposit Request ${id} for ${amount} at address: ${depositAddress.publicKey}`,
  )
}
