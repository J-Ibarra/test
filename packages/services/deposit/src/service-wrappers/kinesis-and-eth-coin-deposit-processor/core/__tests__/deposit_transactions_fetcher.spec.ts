import { getPotentialDepositRequests } from '../deposit_transactions_fetcher'
import * as sinon from 'sinon'
import * as midPriceCalcUtils from '@abx-service-clients/market-data'
import { expect } from 'chai'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import { CurrencyBoundary, CurrencyCode } from '@abx-types/reference-data'

let testCurrencyManager

describe('getPotentialDepositRequests', () => {
  const TEST_PRIVATE_KEY = 'test_private_key'
  const TEST_PUBLIC_KEY = 'test_public_key'

  const TEST_ADDRESS = 'test_address'
  const TEST_ACCOUNT_ID = 'test-acc'
  const TEST_CURRENCY_ID = 1
  const TEST_DEPOSIT_ADDRESS = {
    accountId: TEST_ACCOUNT_ID,
    encryptedPrivateKey: 'encr-PK',
    currencyId: TEST_CURRENCY_ID,
    publicKey: TEST_PUBLIC_KEY,
  } as any

  const testBoundary: CurrencyBoundary = {
    minAmount: 0.00001,
    maxDecimals: 5,
    currencyCode: CurrencyCode.kag,
    currencyId: TEST_CURRENCY_ID,
  }
  const currency = { code: CurrencyCode.kag, id: TEST_CURRENCY_ID }

  beforeEach(() => sinon.stub(referenceDataOperations, 'findCurrencyForId').resolves(currency))
  afterEach(() => sinon.restore())

  it('does not return address with zero balance', async () => {
    sinon.stub(midPriceCalcUtils, 'calculateRealTimeMidPriceForSymbol').resolves(1)
    sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves(testBoundary)

    const currencyGateway = {
      balanceAt: () => Promise.resolve(0),
    }
    testCurrencyManager = {
      getCurrencyFromId: () => Promise.resolve(currencyGateway),
    }

    const testDepositAddress = {
      accountId: TEST_ACCOUNT_ID,
      currencyId: TEST_CURRENCY_ID,
      encryptedPrivateKey: TEST_PRIVATE_KEY,
      publicKey: TEST_ADDRESS,
    } as any

    const potentialDepositRequests = await getPotentialDepositRequests(testCurrencyManager, [testDepositAddress])
    expect(potentialDepositRequests.length).to.eql(0)
  })

  it('returns the deposit transactions for an address', async () => {
    sinon.stub(midPriceCalcUtils, 'calculateRealTimeMidPriceForSymbol').resolves(1)
    sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves(testBoundary)

    const currecyGateway = {
      balanceAt: () => Promise.resolve(100),
      getDepositTransactions: () =>
        Promise.resolve([
          {
            address: TEST_ADDRESS,
            amount: 100,
            from: '',
            txHash: 'ABCD',
          },
        ]),
    }
    testCurrencyManager = {
      getCurrencyFromId: () => Promise.resolve(currecyGateway),
    }

    const potentialDepositRequests = await getPotentialDepositRequests(testCurrencyManager, [TEST_DEPOSIT_ADDRESS])
    expect(potentialDepositRequests.length).to.equal(1)
    expect(potentialDepositRequests[0].depositTxHash).to.equal('ABCD')
    expect(potentialDepositRequests[0].amount).to.equal(100)
  })

  it('adds the fiatConversion to the deposit request', async () => {
    const midPrice = 3000
    sinon.stub(midPriceCalcUtils, 'calculateRealTimeMidPriceForSymbol').resolves(midPrice)
    sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves(testBoundary)

    const amount = 100

    const currecyGateway = {
      balanceAt: () => Promise.resolve(100),
      getDepositTransactions: () =>
        Promise.resolve([
          {
            address: TEST_ADDRESS,
            amount: 100,
            from: '',
            txHash: 'ABCD',
          },
        ]),
    }
    testCurrencyManager = {
      getCurrencyFromId: () => Promise.resolve(currecyGateway),
    }

    const potentialDepositRequests = await getPotentialDepositRequests(testCurrencyManager, [TEST_DEPOSIT_ADDRESS])

    expect(potentialDepositRequests.length).to.equal(1)
    expect(potentialDepositRequests[0].fiatCurrencyCode).to.equal(CurrencyCode.usd)
    expect(potentialDepositRequests[0].fiatConversion).to.equal(midPrice * amount)
  })

  it('truncates deposit request amount to currency boundary limit', async () => {
    const midPrice = 3000
    sinon.stub(midPriceCalcUtils, 'calculateRealTimeMidPriceForSymbol').resolves(midPrice)
    sinon.stub(referenceDataOperations, 'findBoundaryForCurrency').resolves({
      ...testBoundary,
      maxDecimals: 4,
    })

    const amount = 1.12345
    const expectedAmount = 1.1234

    const currecyGateway = {
      balanceAt: () => Promise.resolve(amount),
      getDepositTransactions: () =>
        Promise.resolve([
          {
            address: TEST_ADDRESS,
            amount: amount,
            from: '',
            txHash: 'ABCD',
          },
        ]),
    }
    testCurrencyManager = {
      getCurrencyFromId: () => Promise.resolve(currecyGateway),
    }

    const potentialDepositRequests = await getPotentialDepositRequests(testCurrencyManager, [TEST_DEPOSIT_ADDRESS])

    expect(potentialDepositRequests.length).to.equal(1)
    expect(potentialDepositRequests[0].fiatCurrencyCode).to.equal(CurrencyCode.usd)
    expect(potentialDepositRequests[0].amount).to.equal(expectedAmount)
    expect(potentialDepositRequests[0].fiatConversion).to.equal(midPrice * expectedAmount)
  })
})
