import { expect } from 'chai'
import sinon from 'sinon'

import { TestCurrency } from '@abx-utils/blockchain-currency-gateway'
import * as depositAddressOperations from '../../../../core'
import { filterOutAllAddressesWithPositiveBalance } from '../deposit_address_filter'
import { ETH_MINIMUM_DEPOSIT_AMOUNT } from '../../../../core'

describe('deposit_address_filter', () => {
  const currencyId = 1
  const publicKey = 'fooBard'

  beforeEach(() => {
    sinon.stub(depositAddressOperations, 'findKycOrEmailVerifiedDepositAddresses').resolves([
      {
        id: 1,
        currencyId,
        encryptedPrivateKey: 'privateKey',
        publicKey,
      },
    ])
  })

  afterEach(() => {
    sinon.restore()
  })

  it('filterOutAllAddressesWithPositiveBalance should not include any addresses with balance < 0', async () => {
    const onChainCurrencyManagerStub = new TestCurrency()
    onChainCurrencyManagerStub.setBalanceAtAddress(publicKey, 0)

    const addresses = await filterOutAllAddressesWithPositiveBalance(currencyId, onChainCurrencyManagerStub as any)

    expect(addresses.length).to.eql(0)
  })

  it('filterOutAllAddressesWithPositiveBalance should not include any addresses with balance < ETH_MINIMUM_DEPOSIT_AMOUNT', async () => {
    const onChainCurrencyManagerStub = new TestCurrency()
    onChainCurrencyManagerStub.setBalanceAtAddress(publicKey, ETH_MINIMUM_DEPOSIT_AMOUNT - 0.00001)

    const addresses = await filterOutAllAddressesWithPositiveBalance(currencyId, onChainCurrencyManagerStub as any)

    expect(addresses.length).to.eql(0)
  })

  it('filterOutAllAddressesWithPositiveBalance should return addresses with valid balance', async () => {
    const onChainCurrencyManagerStub = new TestCurrency()
    onChainCurrencyManagerStub.setBalanceAtAddress(publicKey, ETH_MINIMUM_DEPOSIT_AMOUNT + 1)

    const addresses = await filterOutAllAddressesWithPositiveBalance(currencyId, onChainCurrencyManagerStub as any)

    expect(addresses.length).to.eql(1)
  })
})
