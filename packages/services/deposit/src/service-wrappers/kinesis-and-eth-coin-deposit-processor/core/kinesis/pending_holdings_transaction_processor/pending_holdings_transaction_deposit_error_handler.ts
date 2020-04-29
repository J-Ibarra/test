import util from 'util'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequest } from '@abx-types/deposit'
import { DepositGatekeeper } from '../..'

const logger = Logger.getInstance('new_deposit_error_handler', 'handlerDepositError')

export async function handlerDepositError(
  error: Error,
  currency: CurrencyCode,
  depositRequest: DepositRequest,
  completedPendingHoldingsTransactionGatekeeper: DepositGatekeeper,
) {
  logger.error(`Error encountered while transferring funds to exchange holdings for request ${depositRequest.id}`)
  logger.error(JSON.stringify(util.inspect(error)))

  completedPendingHoldingsTransactionGatekeeper.removeRequest(currency, depositRequest.id!)
  completedPendingHoldingsTransactionGatekeeper.addNewDepositsForCurrency(currency, [depositRequest], 10)
}
