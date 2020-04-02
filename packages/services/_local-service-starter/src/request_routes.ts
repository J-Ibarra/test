import { REFERENCE_DATA_REST_API_PORT } from '@abx-service-clients/reference-data'
import { ACCOUNT_REST_API_PORT } from '@abx-service-clients/account'
import { BALANCE_REST_API_PORT } from '@abx-service-clients/balance'
import { ADMIN_FUND_MANAGEMENT_REST_API_PORT } from '@abx-service-clients/admin-fund-management'
import { MARKET_DATA_REST_API_PORT } from '@abx-service-clients/market-data'
import { ORDER_DATA_API_PORT, ORDER_GATEWAY_API_PORT, SETTLEMENT_API_ROOT } from '@abx-service-clients/order'
import { WITHDRAWAL_REST_API_PORT } from '@abx-service-clients/withdrawal'
import { DEPOSIT_API_PORT } from '@abx-service-clients/deposit'
import { REPORT_REST_API_PORT } from '@abx-service-clients/report'

const accountRoutes = [
  '/internal-api/accounts',
  '/api/accounts',
  '/api/admin/account',
  '/api/mfa',
  '/api/reset-password',
  '/api/sessions',
  '/api/tokens',
  '/api/users',
  '/api/test-automation/accounts',
]
const referenceDataRoutes = [
  '/internal-api/reference-data',
  '/api/fees/transaction',
  '/api/boundaries',
  '/api/currencies',
  '/api/feature-flags',
  '/api/config',
  '/api/symbols',
  '/api/symbols/apply-threshold',
]
const balanceRoutes = ['/internal-api/balances', '/api/balances', '/api/test-automation/balances']
const adminFundManagementRoutes = ['/internal-api/admin-fund-management', '/api/admin/fund-management', '/api/test-automation/admin/fund-management']
const marketDataRoutes = ['/internal-api/market-data', '/api/market-data', '/api/mid-price', '/notifications/market-data-v2']
const orderDataRoutes = [
  '/internal-api/orders',
  '/api/fees',
  '/api/admin/fees',
  '/api/depth',
  '/api/order-matches',
  '/api/transaction-history',
  '/api/test-automation/orders',
]
const orderGatewayRoutes = ['/internal-api/order-gateway']
const orderSettlementRoutes = ['/internal-api/order-settlement']
const withdrawalRoutes = ['/internal-api/withdrawals', '/api/withdrawals', '/api/contacts', '/api/crypto']
const depositRoutes = ['/internal-api/deposit', '/api/vault', '/api/wallets', '/api/test-automation/deposit']
const reportRoutes = ['/api/reports']

export const routesToPort: { routes: string[]; port: number }[] = [
  {
    routes: accountRoutes,
    port: ACCOUNT_REST_API_PORT,
  },
  {
    routes: balanceRoutes,
    port: BALANCE_REST_API_PORT,
  },
  {
    routes: adminFundManagementRoutes,
    port: ADMIN_FUND_MANAGEMENT_REST_API_PORT,
  },
  {
    routes: marketDataRoutes,
    port: MARKET_DATA_REST_API_PORT,
  },
  {
    routes: orderDataRoutes,
    port: ORDER_DATA_API_PORT,
  },
  {
    routes: orderGatewayRoutes,
    port: ORDER_GATEWAY_API_PORT,
  },
  {
    routes: orderSettlementRoutes,
    port: SETTLEMENT_API_ROOT,
  },
  {
    routes: withdrawalRoutes,
    port: WITHDRAWAL_REST_API_PORT,
  },
  {
    routes: referenceDataRoutes,
    port: REFERENCE_DATA_REST_API_PORT,
  },
  {
    routes: depositRoutes,
    port: DEPOSIT_API_PORT,
  },
  {
    routes: reportRoutes,
    port: REPORT_REST_API_PORT,
  },
]
