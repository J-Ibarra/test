import { isEmpty } from 'lodash'
import { SourceEventType } from '@abx-types/balance'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager, OnChainCurrencyGateway } from '@abx-query-libs/blockchain-currency-gateway'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { CryptoCurrency, CurrencyCode } from '@abx-types/reference-data'
import { DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { updateDepositRequest } from '../../../../../core'
import { DepositGatekeeper } from '../deposit_gatekeeper'
import * as helper from './helper'
import { createPendingDeposit } from '@abx-service-clients/balance'

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

export async function checkIfHoldingsTransactionHaveBeenRegisteredForFailedRequests(
  pendingCompletionGatekeeper: DepositGatekeeper,
  currencyManager: CurrencyManager,
) {
  return Promise.all(
    Object.values(CryptoCurrency)
      .filter(cryptoCurrency => !isEmpty(currencyCodeToFailedDepositRequests.get((cryptoCurrency as unknown) as CurrencyCode)))
      .map(cryptoCurrency =>
        checkHoldingsDepositTransactionsForAnyRecordedFailedRequests(
          pendingCompletionGatekeeper,
          currencyManager.getCurrencyFromTicker((cryptoCurrency as unknown) as CurrencyCode),
        ),
      ),
  )
}

async function checkHoldingsDepositTransactionsForAnyRecordedFailedRequests(
  pendingCompletionGatekeeper: DepositGatekeeper,
  currency: OnChainCurrencyGateway,
) {
  const newDepositTransactionsIntoTheHoldingsAccount = await helper.getDepositTransactionsIntoHoldingsAccount(currency)

  const failedRequestsWithTransactionIntoHoldings = newDepositTransactionsIntoTheHoldingsAccount
    .map(depositTransaction =>
      helper.findFailedDepositForHoldingsTransaction(currencyCodeToFailedDepositRequests, depositTransaction, currency.ticker!),
    )
    .filter(Boolean)

  return Promise.all(
    failedRequestsWithTransactionIntoHoldings.map(request =>
      prepareDepositRequestForCompletion(pendingCompletionGatekeeper, currency.ticker!, request!),
    ),
  )
}

async function prepareDepositRequestForCompletion(
  pendingCompletionGatekeeper: DepositGatekeeper,
  currencyCode: CurrencyCode,
  request: DepositRequest,
) {
  const logger = Logger.getInstance('failed_holdings_transaction_checker', 'prepareDepositRequestForCompletion')
  logger.info(`Holdings deposit transaction found for request ${request.id} and currency ${currencyCode}`)
  return wrapInTransaction(sequelize, null, async transaction => {
    const updatedRequest = await updateDepositRequest(
      request.id!,
      { holdingsTxHash: request.holdingsTxHash, status: DepositRequestStatus.pendingCompletion },
      transaction,
    )

    const failedTransactionsForCurrency = currencyCodeToFailedDepositRequests.get(currencyCode)
    currencyCodeToFailedDepositRequests.set(
      currencyCode,
      (failedTransactionsForCurrency || []).filter(({ id }) => id !== request.id),
    )

    await createPendingDeposit({
      accountId: request.depositAddress.accountId,
      amount: request.amount,
      currencyId: request.depositAddress.currencyId,
      sourceEventId: request.id!,
      sourceEventType: SourceEventType.currencyDepositRequest,
    })

    return pendingCompletionGatekeeper.addNewDepositsForCurrency(currencyCode, [updatedRequest])
  })
}

export async function loadAllHoldingsTransactionFailedRequestsInMemory() {
  currencyCodeToFailedDepositRequests = await helper.loadAllFailedRequestsInMemory()
}

export async function cleanExpiredFailedRequests(pendingHoldingsTransferGatekeeper: DepositGatekeeper) {
  return helper.cleanOldDepositFailures(currencyCodeToFailedDepositRequests, pendingHoldingsTransferGatekeeper)
}
