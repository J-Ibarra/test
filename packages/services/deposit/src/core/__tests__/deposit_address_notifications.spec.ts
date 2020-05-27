import { expect } from 'chai'
import sinon from 'sinon'
import { registerForDepositAddressTransactionNotifications } from '../deposit-address'
import { CurrencyCode } from '@abx-types/reference-data'
import * as referenceDataOperations from '@abx-service-clients/reference-data'

import * as retrievalOperation from '../deposit-address/data-access/deposit_address_query_handler'
import * as updateOperations from '../deposit-address/data-access/deposit_address_update_handler'
import * as blockchainOperations from '@abx-utils/blockchain-currency-gateway'

describe('deposit_address_notifications', () => {
  const accountId = 'acc-id-1'
  const currencyId = 1

  afterEach(() => sinon.restore())

  it('registerForDepositAddressTransactionNotifications should throw error when deposit address not found', async () => {
    sinon.stub(referenceDataOperations, 'findCurrencyForCode').resolves({ id: currencyId })
    sinon.stub(retrievalOperation, 'findDepositAddress').resolves()

    try {
      await registerForDepositAddressTransactionNotifications({ id: accountId } as any, CurrencyCode.kvt)
    } catch (e) {
      expect(e.message).to.eql(`Deposit address does not exist for currency id: ${currencyId} and account id: ${accountId}`)
    }
  })

  it('registerForDepositAddressTransactionNotifications should not register address if address already registered', async () => {
    sinon.stub(referenceDataOperations, 'findCurrencyForCode').resolves({ id: currencyId })
    sinon.stub(retrievalOperation, 'findDepositAddress').resolves({ transactionTrackingActivated: true })
    const updateDepositAddressStub = sinon.stub(updateOperations, 'updateDepositAddress').resolves()

    await registerForDepositAddressTransactionNotifications({ id: accountId } as any, CurrencyCode.kvt)
    expect(updateDepositAddressStub.notCalled).to.eql(true)
  })

  it('registerForDepositAddressTransactionNotifications should not register address if address is ERC20 and ERC20 subscription already exists', async () => {
    const depositAddress = { id: 1, transactionTrackingActivated: false } as any

    sinon.stub(referenceDataOperations, 'findCurrencyForCode').resolves({ id: currencyId })
    sinon.stub(retrievalOperation, 'findDepositAddress').resolves({ id: 1, transactionTrackingActivated: false })
    sinon.stub(retrievalOperation, 'countERC20AddressesWithTransactionTracking').resolves(1)
    const getOnChainCurrencyManagerForEnvironmentStub = sinon.stub(blockchainOperations, 'getOnChainCurrencyManagerForEnvironment').resolves()

    const updateDepositAddressStub = sinon.stub(updateOperations, 'updateDepositAddress').resolves()

    await registerForDepositAddressTransactionNotifications({ id: accountId } as any, CurrencyCode.tether)

    expect(updateDepositAddressStub.getCall(0).args[0]).to.eql({ ...depositAddress, transactionTrackingActivated: true })
    expect(getOnChainCurrencyManagerForEnvironmentStub.notCalled).to.eql(true)
  })

  it('registerForDepositAddressTransactionNotifications should register address if address has no tracking activated', async () => {
    const depositAddress = { id: 1, transactionTrackingActivated: false } as any

    sinon.stub(referenceDataOperations, 'findCurrencyForCode').resolves({ id: currencyId })
    sinon.stub(retrievalOperation, 'findDepositAddress').resolves({ id: 1, transactionTrackingActivated: false })

    let trackingActivated = false

    const currencyManager = {
      getCurrencyFromTicker: () => ({
        createAddressTransactionSubscription: async () => {
          trackingActivated = true

          return true
        },
      }),
    }
    const getOnChainCurrencyManagerForEnvironmentStub = sinon
      .stub(blockchainOperations, 'getOnChainCurrencyManagerForEnvironment')
      .returns(currencyManager as any)
    const updateDepositAddressStub = sinon.stub(updateOperations, 'updateDepositAddress').resolves()

    await registerForDepositAddressTransactionNotifications({ id: accountId } as any, CurrencyCode.bitcoin)

    expect(updateDepositAddressStub.getCall(0).args[0]).to.eql({ ...depositAddress, transactionTrackingActivated: true })
    expect(getOnChainCurrencyManagerForEnvironmentStub.calledOnce).to.eql(true)
    expect(trackingActivated).to.eql(true)
  })
})
