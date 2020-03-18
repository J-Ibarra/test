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

export async function bootstrapSalesforceService() {
  killProcessOnSignal()
  Logger.configure((process.env.LOG_LEVEL as LogLevel) || LogLevel.debug)

  const epicurus = getEpicurusInstance()
  epicurus.subscribe(AccountPubSubTopics.accountVerified, accountVerifiedRecorder)
  epicurus.subscribe(AccountPubSubTopics.accountKycCheck, accountKycChangePoller)

  epicurus.subscribe(WithdrawalPubSubChannels.withdrawalRequestCreated, withdrawalRequestRecorder)
  epicurus.subscribe(WithdrawalPubSubChannels.withdrawalRequestUpdated, fiatWithdrawalRequestUpdater)

  epicurus.subscribe(DepositPubSubChannels.depositRequestCreated, depositRequestRecorder)
  epicurus.subscribe(DepositPubSubChannels.walletAddressesForNewAccountCreated, accountCreatedRecorder)
}
