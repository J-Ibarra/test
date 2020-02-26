import util from 'util'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { updateDepositRequest } from '../../../../../core'
import { DepositGatekeeper } from '../deposit_gatekeeper'
import * as FailedHoldingsTransactionChecker from '../failed_transactions_operations/failed_holdings_transaction_checker'

const logger = Logger.getInstance('new_deposit_error_handler', 'handlerDepositError')

export async function handlerDepositError(
  error: Error,
  currency: CurrencyCode,
  depositRequest: DepositRequest,
  pendingHoldingsTransferGatekeeper: DepositGatekeeper,
) {
  logger.error(`Error encountered while transferring funds to exchange holdings for request ${depositRequest.id}`)
  logger.error(JSON.stringify(util.inspect(error)))

  const updatedRequest = await updateDepositRequest(depositRequest.id!, {
    status: DepositRequestStatus.failedHoldingsTransaction,
  })
  pendingHoldingsTransferGatekeeper.removeRequest(currency, depositRequest.id!)
  FailedHoldingsTransactionChecker.registerFailedRequest(currency, {
    ...updatedRequest,
    depositAddress: depositRequest.depositAddress,
  })
}
