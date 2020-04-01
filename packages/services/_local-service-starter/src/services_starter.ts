import { bootstrapReferenceDataService } from '@abx/exchange-reference-data-service'
import { bootstrapAccountsService } from '@abx/exchange-account-data-service'
import { bootstrapBalanceService } from '@abx/exchange-balance-service'
import { bootstrapFundManagementService } from '@abx/admin-fund-management-service'
import { bootstrapMarketDataService } from '@abx/exchange-market-data-service'
import { bootstrapReportsService } from '@abx/exchange-report-service'
import { bootstrapNotificationService } from '@abx/exchange-notification-service'
// import { bootstrapSchedulerService } from '@abx/exchange-scheduler-service'

import {
  bootstrapKinesisAndEthCoinDepositProcessor,
  bootstrapThirdPartyCoinDepositProcessor,
  bootstrapDepositApi,
  // bootstrapEthereumBlockFollowerProcessor,
  // bootstrapKVTBlockFollowerProcessor,
} from '@abx/exchange-deposit-service'

import { bootstrapWithdrawalApiService, bootstrapWithdrawalProcessorService } from '@abx/exchange-withdrawal-service'
import { bootstrapOrderDataService, bootstrapOrderGatewayService, bootstrapWorkerService, bootstrapSettlementService } from '@abx/order-service'
import { bootstrapWebhookApiService } from './webhooks'

export async function startAllServices() {
  await bootstrapReferenceDataService()
  await bootstrapAccountsService()
  await bootstrapBalanceService()
  await bootstrapFundManagementService()
  await bootstrapMarketDataService()
  await bootstrapOrderDataService()
  await bootstrapOrderGatewayService()
  await bootstrapWorkerService()
  await bootstrapSettlementService()
  await bootstrapReportsService()
  await bootstrapNotificationService()
  // await bootstrapSchedulerService()

  await bootstrapWithdrawalApiService()
  await bootstrapWithdrawalProcessorService()

  // Deposit Services
  await bootstrapThirdPartyCoinDepositProcessor()
  await bootstrapDepositApi()
  await bootstrapKinesisAndEthCoinDepositProcessor()
  // await bootstrapEthereumBlockFollowerProcessor()
  // await bootstrapKVTBlockFollowerProcessor()

  await bootstrapWebhookApiService()
}
