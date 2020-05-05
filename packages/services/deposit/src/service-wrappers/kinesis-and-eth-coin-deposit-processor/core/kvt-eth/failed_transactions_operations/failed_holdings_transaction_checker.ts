import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequest } from '@abx-types/deposit'
import { DepositGatekeeper } from '../../common'
import * as helper from './helper'

export interface FailedDeposit extends DepositRequest {
  failureRecordedAt: Date
}

/** Maintains a record of all deposit requests where the how wallet -> holdings transaction failed. */
let currencyCodeToFailedDepositRequests: Map<CurrencyCode, FailedDeposit[]> = new Map()

export async function registerFailedRequest(currencyCode: CurrencyCode, depositRequest: DepositRequest) {
  const logger = Logger.getInstance('failed_holdings_transaction_checker', 'registerFailedRequest')
  logger.info(`Registering failed request ${depositRequest.id} for currency ${currencyCode}`)
  const failedDepositRequestsForCurrency = currencyCodeToFailedDepositRequests.get(currencyCode) || []

  currencyCodeToFailedDepositRequests.set(
    currencyCode,
    failedDepositRequestsForCurrency.concat({
      ...depositRequest,
      failureRecordedAt: depositRequest.updatedAt,
    } as FailedDeposit),
  )
  logger.debug(`Failed requests after recording failed request ${depositRequest.id}: ${JSON.stringify(failedDepositRequestsForCurrency)}`)
}

export async function loadAllHoldingsTransactionFailedRequestsInMemory() {
  currencyCodeToFailedDepositRequests = await helper.loadAllFailedRequestsInMemory()
}

export async function cleanExpiredFailedRequests(pendingHoldingsTransferGatekeeper: DepositGatekeeper) {
  return helper.cleanOldDepositFailures(currencyCodeToFailedDepositRequests, pendingHoldingsTransferGatekeeper)
}
