import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { accountCreatedRecorder } from './core/exchange_to_salesforce_change_recorders/account_creation_recorder'
import { accountVerifiedRecorder } from './core/exchange_to_salesforce_change_recorders/account_verified_recorder'
import { depositRequestRecorder } from './core/exchange_to_salesforce_change_recorders/deposit_request_recorder'
import { withdrawalRequestRecorder } from './core/exchange_to_salesforce_change_recorders/withdrawal_request_recorder'
import { fiatWithdrawalRequestUpdater } from './core/exchange_to_salesforce_change_recorders/withdrawal_request_updater'
import { accountKycChangePoller } from './core/salesforce_to_exchange_change_pollers/account_kyc_change_poller'
import { AccountPubSubTopics } from '@abx-service-clients/account'
import { WithdrawalPubSubChannels } from '@abx-service-clients/withdrawal'
import { DepositPubSubChannels } from '@abx-service-clients/deposit'
import { Logger, LogLevel } from '@abx-utils/logging'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'
import { Environment } from '@abx-types/reference-data'
import { runAccountDataMigrations } from '../../migrations/migration-runner'

const logger = Logger.getInstance('salesforce', 'service_starter')

export async function bootstrapSalesforceService() {
  killProcessOnSignal()
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)
  if (process.env.NODE_ENV !== Environment.development && process.env.NODE_ENV !== Environment.e2eLocal) {
    runAccountDataMigrations()
  }

  const epicurus = getEpicurusInstance()
  epicurus.subscribe(AccountPubSubTopics.accountVerified, request => wrapInTryCatch('accountVerifiedRecorder', accountVerifiedRecorder, request))
  epicurus.subscribe(AccountPubSubTopics.accountKycCheck, request => wrapInTryCatch('accountKycChangePoller', accountKycChangePoller, request))

  epicurus.subscribe(WithdrawalPubSubChannels.withdrawalRequestCreated, request =>
    wrapInTryCatch('withdrawalRequestRecorder', withdrawalRequestRecorder, request),
  )
  epicurus.subscribe(WithdrawalPubSubChannels.withdrawalRequestUpdated, request =>
    wrapInTryCatch('fiatWithdrawalRequestUpdater', fiatWithdrawalRequestUpdater, request),
  )

  epicurus.subscribe(DepositPubSubChannels.depositRequestCreated, request =>
    wrapInTryCatch('depositRequestRecorder', depositRequestRecorder, request),
  )
  epicurus.subscribe(DepositPubSubChannels.walletAddressesForNewAccountCreated, request =>
    wrapInTryCatch('accountCreatedRecorder', accountCreatedRecorder, request),
  )
}

function wrapInTryCatch(handlerLabel, handlerFn, request) {
  try {
    handlerFn(request)
  } catch (e) {
    logger.error(`Error ocurred while executing ${handlerLabel} with payload ${JSON.stringify(request)}`)
    logger.error(JSON.stringify(e))
  }
}
