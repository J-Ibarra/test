import { bootstrapReferenceDataService } from '@abx/exchange-reference-data-service'
import { bootstrapAccountsService } from '@abx/exchange-account-data-service'
import { bootstrapBalanceService } from '@abx/exchange-balance-service'
import { bootstrapFundManagementService } from '@abx/admin-fund-management-service'
import { bootstrapMarketDataService } from '@abx/exchange-market-data-service'
import { bootstrapReportsService } from '@abx/exchange-report-service'
import { bootstrapNotificationService } from '@abx/exchange-notification-service'
import { bootstrapSchedulerService } from '@abx/exchange-scheduler-service'
import { bootstrapDepositProcessor } from '@abx/exchange-deposit-service'

import { bootstrapOrderDataService, bootstrapOrderGatewayService, bootstrapWorkerService, bootstrapSettlementService } from '@abx/order-service'

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
  await bootstrapSchedulerService()
  await bootstrapDepositProcessor()
}
