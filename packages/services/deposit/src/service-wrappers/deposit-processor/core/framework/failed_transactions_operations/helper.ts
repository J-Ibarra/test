import moment from 'moment'
import { Logger } from '@abx-utils/logging'
import { DepositTransaction, OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequestStatus } from '@abx-types/deposit'
import { getAllDepositRequests, updateAllDepositRequests } from '../../../../../core'
import { DepositGatekeeper } from '../deposit_gatekeeper'
import * as LastDepositHashRecorder from '../deposit_hash_recorder/last_deposit_hash_recorder'
import { FailedDeposit } from './failed_holdings_transaction_checker'
import { findAllCurrencies } from '@abx-service-clients/reference-data'

export function findFailedDepositForHoldingsTransaction(
  currencyCodeToFailedDepositRequests: Map<CurrencyCode, FailedDeposit[]>,
  holdingsDepositTransaction: DepositTransaction,
  currencyCode: CurrencyCode,
) {
  const failedTransactionsForCurrency = currencyCodeToFailedDepositRequests.get(currencyCode) || []

  const failedDepositRequestForTransaction = failedTransactionsForCurrency.find(
    ({ depositAddress }) => depositAddress.publicKey === holdingsDepositTransaction.from,
  )

  return !!failedDepositRequestForTransaction
    ? {
        ...failedDepositRequestForTransaction,
        holdingsTxHash: holdingsDepositTransaction.txHash,
      }
    : null
}

export async function getDepositTransactionsIntoHoldingsAccount(currencyGateway: OnChainCurrencyGateway) {
  const lastSeenTransactionHash = LastDepositHashRecorder.getLastSeenTransactionHash(currencyGateway.ticker!)

  const holdingsPublicAddress = await currencyGateway.getHoldingPublicAddress()
  const newDepositTransactionsIntoTheHoldingsAccount = await currencyGateway.getDepositTransactions(holdingsPublicAddress, lastSeenTransactionHash)

  await LastDepositHashRecorder.saveTransactionHash(currencyGateway.ticker!, newDepositTransactionsIntoTheHoldingsAccount[0].txHash)

  return newDepositTransactionsIntoTheHoldingsAccount
}

export async function cleanOldDepositFailures(
  currencyCodeToFailedDepositRequests: Map<CurrencyCode, FailedDeposit[]>,
  pendingHoldingsTransferGatekeeper: DepositGatekeeper,
) {
  return Promise.all(
    Array.from(currencyCodeToFailedDepositRequests.keys()).map(currencyCode =>
      cleanOldDepositFailuresForCurrency(pendingHoldingsTransferGatekeeper, currencyCode, currencyCodeToFailedDepositRequests),
    ),
  )
}

const logger = Logger.getInstance('helper', 'cleanOldDepositFailuresForCurrency')
// Deposits where the failure was recorded more than 3 minutes ago will be removed from the failed requests
const EXPIRY_TIME_IN_MINUTES = 3

/**
 * Moves all failed deposit requests recorded more than 10 minutes ago in the pendingHoldingsTransferGatekeeper,
 * allowing them to be processed again.
 *
 * @param pendingHoldingsTransferGatekeeper the pending holdings gatekeeper which the deposit
 * @param currencyCode the currency Code
 * @param currencyCodeToFailedDepositRequests the map of all
 */
export async function cleanOldDepositFailuresForCurrency(
  pendingHoldingsTransferGatekeeper: DepositGatekeeper,
  currencyCode: CurrencyCode,
  currencyCodeToFailedDepositRequests: Map<CurrencyCode, FailedDeposit[]>,
) {
  const failedDepositRequestsForCurrency = currencyCodeToFailedDepositRequests.get(currencyCode) || []
  logger.debug(`Failed deposit requests for ${currencyCode}: ${JSON.stringify(failedDepositRequestsForCurrency)}`)
  const expiredDepositRequests = failedDepositRequestsForCurrency.filter(({ failureRecordedAt }) =>
    moment(failureRecordedAt).isBefore(moment().subtract(EXPIRY_TIME_IN_MINUTES, 'minutes')),
  )

  return wrapInTransaction(sequelize, null, async transaction => {
    await updateAllDepositRequests(
      expiredDepositRequests.map(({ id }) => id!),
      { status: DepositRequestStatus.pendingHoldingsTransaction },
      transaction,
    )

    const expiredDepositRequestIds = expiredDepositRequests.map(({ id }) => id)
    logger.info(
      `${
        expiredDepositRequestIds.length
      } expired requests found for ${currencyCode}, adding them back to pendingHoldingsTransferGatekeeper ${expiredDepositRequestIds.join(',')}`,
    )
    currencyCodeToFailedDepositRequests.set(
      currencyCode,
      failedDepositRequestsForCurrency.filter(({ id }) => !expiredDepositRequestIds.includes(id)),
    )
    pendingHoldingsTransferGatekeeper.addNewDepositsForCurrency(currencyCode, expiredDepositRequests)
  })
}

/** To be invoked on service startup. */
export async function loadAllFailedRequestsInMemory() {
  const allFailedDepositRequests = await getAllDepositRequests({
    status: DepositRequestStatus.failedHoldingsTransaction,
  })
  const allCurrencies = await findAllCurrencies()

  const currencyIdToCurrency = allCurrencies.reduce((idToCurrencyCode, currency) => idToCurrencyCode.set(currency.id, currency.code), new Map())

  return allFailedDepositRequests.reduce((currencyToFailedRequests, failedDepositRequest) => {
    const currencyCode = currencyIdToCurrency.get(failedDepositRequest.depositAddress.currencyId)
    const depositRequests = currencyToFailedRequests.get(currencyCode) || []

    return currencyToFailedRequests.set(
      currencyCode,
      depositRequests.concat({
        ...failedDepositRequest,
        failureRecordedAt: failedDepositRequest.updatedAt,
      }),
    )
  }, new Map())
}
