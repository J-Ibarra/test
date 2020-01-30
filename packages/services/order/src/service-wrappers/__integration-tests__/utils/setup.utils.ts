import sinon from 'sinon'
import { CurrencyCode, SymbolPair, CurrencyBoundary } from '@abx-types/reference-data'
import { setDefaultFeeTiers } from '../../../core'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as balanceClientOperations from '@abx-service-clients/balance'
import { bootstrap as bootstrapWorker } from '../../worker/bootstrap_handler'
import { bootstrap as bootstrapOrderGateway } from '../../order-gateway/bootstrap_handler'
import { bootstrapForTesting as bootstrapSettlement } from '../../settlement/bootstrap_handler'
import '../../../core'
import { truncateTables, getCacheClient } from '@abx-utils/db-connection-utils'
import { AccountType } from '@abx-types/account'
import * as fxRateUtils from '@abx-utils/fx-rate'
import * as accountClientOperations from '@abx-service-clients/account'
import * as marketDataOperations from '@abx-service-clients/market-data'
import { BalanceType } from '@abx-types/balance'

export const DEFAULT_TEST_FEE_RATE = 0.01
export const OPERATOR_ACCOUNT_ID = 'foo-acc-operator'

export interface CurrencySetupParams {
  id: number
  currency: CurrencyCode
  boundary?: Pick<CurrencyBoundary, 'minAmount' | 'maxDecimals'>
}

export async function setUp({
  baseCurrency,
  quoteCurrency,
  feeCurrency,
  customFeeRate,
}: {
  baseCurrency: CurrencySetupParams
  quoteCurrency: CurrencySetupParams
  feeCurrency: CurrencySetupParams
  customFeeRate?: number
}): Promise<{
  symbol: SymbolPair
  balanceReserveStub: sinon.SinonStub
  finaliseReserveStub: sinon.SinonStub
  updateAvailableStub: sinon.SinonStub
  releaseReserve: sinon.SinonStub
}> {
  await truncateTables()
  await getCacheClient().flush()
  sinon.restore()

  const pair = {
    id: `${baseCurrency.currency}_${quoteCurrency.currency}`,
    base: {
      id: baseCurrency.id,
      code: baseCurrency.currency,
    },
    quote: {
      id: quoteCurrency.id,
      code: quoteCurrency.currency,
    },
    fee: {
      id: feeCurrency.id,
      code: feeCurrency.currency,
    },
    orderRange: 0.3,
    sortOrder: 1,
  }

  sinon.stub(referenceDataOperations, 'getCompleteSymbolDetails').resolves(pair)
  sinon.stub(referenceDataOperations, 'getAllSymbolPairSummaries').resolves([pair])
  sinon.stub(referenceDataOperations, 'getAllCompleteSymbolDetails').resolves([pair])
  sinon
    .stub(referenceDataOperations, 'findBoundaryForCurrency')
    .withArgs(baseCurrency.currency)
    .resolves(baseCurrency.boundary)
    .withArgs(quoteCurrency.currency)
    .resolves(quoteCurrency.boundary)
    .withArgs(feeCurrency.currency)
    .resolves(feeCurrency.boundary)
  sinon.stub(referenceDataOperations, 'getExcludedAccountTypesFromOrderRangeValidations').resolves([AccountType.admin])
  sinon.stub(referenceDataOperations, 'getSymbolPairSummary').resolves(pair)
  sinon.stub(referenceDataOperations, 'getVatRate').resolves(0.077)
  sinon.stub(referenceDataOperations, 'getSymbolBoundaries').resolves({
    baseBoundary: baseCurrency.boundary,
    quoteBoundary: quoteCurrency.boundary,
    base: {
      id: baseCurrency.id,
      code: baseCurrency.currency,
    },
    quote: {
      id: quoteCurrency.id,
      code: quoteCurrency.currency,
    },
    fee: {
      id: feeCurrency.id,
      code: feeCurrency.currency,
    },
  })
  sinon.stub(marketDataOperations, 'calculateRealTimeMidPriceForSymbol').resolves(10)
  sinon.stub(fxRateUtils, 'convertAmountToFiatCurrency').resolves(1)
  sinon.stub(fxRateUtils, 'getQuoteFor').resolves(1)

  sinon.stub(accountClientOperations, 'findOrCreateOperatorAccount').resolves({
    id: OPERATOR_ACCOUNT_ID,
  })
  sinon.stub(balanceClientOperations, 'findRawBalances').resolves([
    {
      balanceTypeId: BalanceType.reserved,
      id: 1,
    },
  ])
  sinon.stub(balanceClientOperations, 'getBalanceAdjustmentsForBalanceAndTradeTransactions').resolves([])

  await setDefaultFeeTiers([
    { tier: 1, symbolId: pair.id, rate: customFeeRate !== undefined ? customFeeRate : DEFAULT_TEST_FEE_RATE, threshold: 100_000 },
  ])
  await bootstrapServices()

  return {
    symbol: pair,
    balanceReserveStub: sinon.stub(balanceClientOperations, 'createReserve'),
    finaliseReserveStub: sinon.stub(balanceClientOperations, 'finaliseReserve'),
    updateAvailableStub: sinon.stub(balanceClientOperations, 'updateAvailable'),
    releaseReserve: sinon.stub(balanceClientOperations, 'releaseReserve'),
  }
}

async function bootstrapServices() {
  await bootstrapWorker()
  await bootstrapOrderGateway()
  await bootstrapSettlement()
}
