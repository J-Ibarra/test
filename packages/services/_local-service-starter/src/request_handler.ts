import http from 'http'

import { REFERENCE_DATA_REST_API_PORT } from '@abx/exchange-reference-data-service'
import { ACCOUNT_REST_API_PORT } from '@abx/exchange-account-data-service'
import { BALANCE_REST_API_PORT } from '@abx/exchange-balance-service'
import { ADMIN_FUND_MANAGEMENT_REST_API_PORT } from '@abx/admin-fund-management-service'
import { MARKET_DATA_REST_API_PORT } from '@abx/exchange-market-data-service'
import { ORDER_DATA_API_PORT, ORDER_GATEWAY_API_PORT } from '@abx/order-service'
import { WITHDRAWAL_REST_API_PORT } from '@abx/exchange-withdrawal-service'
import { DEPOSIT_API_PORT } from '@abx/exchange-deposit-service'

const accountRoutes = ['/api/accounts', '/api/admin/account', '/api/mfa', '/api/reset-password', '/api/sessions', '/api/tokens', '/api/users']
const referenceDataRoutes = [
  '/api/fees/transaction',
  '/api/boundaries',
  '/api/currencies',
  '/api/feature-flags',
  '/api/symbols',
  '/api/symbols/apply-threshold',
]
const balanceRoutes = ['/api/balances']
const adminFundManagementRoutes = ['/api/admin/fund-management']
const marketDataRoutes = ['/api/market-data', '/api/mid-price', '/notifications/market-data-v2']
const orderDataRoutes = ['/api/fees', 'api/admin/fees', '/api/depth', '/api/order-matches', '/api/admin/orders', '/api/transaction-history']
const withdrawalRoutes = ['/api/withdrawals', '/api/contacts', '/api/crypto']
const depositRoutes = ['/api/vault', '/api/wallets']

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
    routes: withdrawalRoutes,
    port: WITHDRAWAL_REST_API_PORT,
  },
  {
    routes: orderDataRoutes,
    port: ORDER_DATA_API_PORT,
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
