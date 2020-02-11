import http from 'http'

import { REFERENCE_DATA_REST_API_PORT } from '@abx-service-clients/reference-data'
import { ACCOUNT_REST_API_PORT } from '@abx-service-clients/account'
import { BALANCE_REST_API_PORT } from '@abx-service-clients/balance'
import { ADMIN_FUND_MANAGEMENT_REST_API_PORT } from '@abx-service-clients/admin-fund-management'
import { MARKET_DATA_REST_API_PORT } from '@abx-service-clients/market-data'
import { ORDER_DATA_API_PORT, ORDER_GATEWAY_API_PORT, SETTLEMENT_API_ROOT } from '@abx-service-clients/order'
import { WITHDRAWAL_REST_API_PORT } from '@abx-service-clients/withdrawal'
import { DEPOSIT_API_PORT } from '@abx-service-clients/deposit'

const accountRoutes = [
  'internal-api/accounts',
  '/api/accounts',
  '/api/admin/account',
  '/api/mfa',
  '/api/reset-password',
  '/api/sessions',
  '/api/tokens',
  '/api/users',
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
const balanceRoutes = ['/internal-api/balances', '/api/balances']
const adminFundManagementRoutes = ['/internal-api/admin-fund-management', '/api/admin/fund-management']
const marketDataRoutes = ['/internal-api/market-data', '/api/market-data', '/api/mid-price', '/notifications/market-data-v2']
const orderDataRoutes = [
  '/internal-api/orders',
  '/api/fees',
  'api/admin/fees',
  '/api/depth',
  '/api/order-matches',
  '/api/admin/orders',
  '/api/transaction-history',
]
const orderGatewayRoutes = ['/internal-api/order-gateway']
const orderSettlementRoutes = ['/internal-api/order-settlement']
const withdrawalRoutes = ['/internal-api/withdrawals', '/api/withdrawals', '/api/contacts', '/api/crypto']
const depositRoutes = ['/internal-api/deposit', '/api/vault', '/api/wallets']

const routesToPort: { routes: string[]; port: number }[] = [
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
]

export function pickRouteBasedForwarding(req: http.IncomingMessage, res, proxy): VoidFunction | null {
  const targetService = routesToPort.find(({ routes }) => isRequestTargetRouteWithinRoutes(req.url!, routes!))

  if (!!targetService) {
    return () => proxy.web(req, res, { target: `http://127.0.0.1:${targetService.port}` })
  } else if (req.url!.startsWith('/api/orders')) {
    if (req.url === '/api/orders' && (req.method === 'POST' || req.method === 'DELETE')) {
      return () => proxy.web(req, res, { target: `http://127.0.0.1:${ORDER_GATEWAY_API_PORT}` })
    }

    return () => proxy.web(req, res, { target: `http://127.0.0.1:${ORDER_DATA_API_PORT}` })
  }

  return null
}

function isRequestTargetRouteWithinRoutes(url: string, routes: string[]) {
  return routes.some(depositRoute => url!.startsWith(depositRoute))
}
