import { expect } from 'chai'
import Decimal from 'decimal.js'
import sinon, { SinonStub } from 'sinon'

import { TestCurrency } from '@abx-utils/blockchain-currency-gateway'
import { DepositRequestStatus } from '@abx-types/deposit'
import * as depositRequestOperations from '../../../../core'
import * as midPriceCalculatorOperations from '@abx-service-clients/market-data'
import * as symbolOperations from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import * as depositFilterOperations from '../deposit_address_filter'
import { triggerEthDepositPoller } from '../eth_deposit_poller'
import { ETH_MINIMUM_DEPOSIT_AMOUNT } from '../../../../core'
import { truncateTables } from '@abx-utils/db-connection-utils'

describe('deposit_address_filter:triggerEthDepositPoller', () => {
  const currencyId = 1
  const ethToFiatMidPrice = 10
  const publicKey = 'fooBard'
  const depositTxHash = 'xXASxasxasf2131e'
  const depositAddress = {
    id: 1,
    currencyId,
    encryptedPrivateKey: 'privateKey',
    publicKey,
  }

  let storeDepositRequestsStub: SinonStub
  let midPriceCalculatorOperationsStub: SinonStub

  beforeEach(async () => {
    await truncateTables()
    sinon.stub(symbolOperations, 'findCurrencyForCode').resolves({
      id: currencyId,
    })
    storeDepositRequestsStub = sinon.stub(depositRequestOperations, 'storeDepositRequests')
    midPriceCalculatorOperationsStub = sinon.stub(midPriceCalculatorOperations, 'calculateRealTimeMidPriceForSymbol').resolves(ethToFiatMidPrice)
    sinon.stub(symbolOperations, 'findBoundaryForCurrency').resolves({
      id: 1,
      minAmount: 1,
      maxDecimals: 6,
      currencyCode: CurrencyCode.ethereum,
      currencyId: currencyId,
    })
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should not do any processing when no addresses with positive balances found', async () => {
    sinon.stub(depositFilterOperations, 'filterOutAllAddressesWithPositiveBalance').resolves([])

    const onChainCurrencyManager = new TestCurrency()

    await triggerEthDepositPoller(onChainCurrencyManager)

    expect(storeDepositRequestsStub.getCalls().length).to.eql(0)
    expect(midPriceCalculatorOperationsStub.getCalls().length).to.eql(0)
  })

  it('should not process deposit transaction when amount < ETH_MINIMUM_DEPOSIT_AMOUNT', async () => {
    sinon.stub(depositFilterOperations, 'filterOutAllAddressesWithPositiveBalance').resolves([depositAddress])
    sinon.stub(depositRequestOperations, 'getPendingDepositRequests').resolves([])

    const onChainCurrencyManager = createCurrencyManagerWithDepositTransaciton(ETH_MINIMUM_DEPOSIT_AMOUNT - 0.00001)
    await triggerEthDepositPoller(onChainCurrencyManager)

    expect(midPriceCalculatorOperationsStub.getCalls().length).to.eql(1)
    expect(storeDepositRequestsStub.getCalls().length).to.eql(0)
  })

  it('should process new deposit transactions with valid balance', async () => {
    sinon.stub(depositFilterOperations, 'filterOutAllAddressesWithPositiveBalance').resolves([depositAddress])
    sinon.stub(depositRequestOperations, 'getPendingDepositRequests').resolves([])

    const depositFrom = 'foo'
    const depositAmount = 10
    const onChainCurrencyManager = createCurrencyManagerWithDepositTransaciton(depositAmount)

    await triggerEthDepositPoller(onChainCurrencyManager)

    expect(midPriceCalculatorOperationsStub.getCalls().length).to.eql(1)
    expect(storeDepositRequestsStub.getCalls().length).to.eql(1)
    expect(
      storeDepositRequestsStub.calledWith([
        {
          from: depositFrom,
          amount: depositAmount,
          depositTxHash,
          fiatCurrencyCode: CurrencyCode.usd,
          fiatConversion: new Decimal(depositAmount).times(ethToFiatMidPrice).toNumber(),
          status: DepositRequestStatus.pendingHoldingsTransaction,
          depositAddress,
        },
      ]),
    ).to.eql(true)
  })

  const createCurrencyManagerWithDepositTransaciton = (depositAmount: number) => {
    const onChainCurrencyManager = new TestCurrency()
    onChainCurrencyManager.setDepositTransactions({
      address: publicKey,
      txHash: depositTxHash,
      amount: depositAmount,
      from: 'foo',
    })

    return onChainCurrencyManager
  }
})
