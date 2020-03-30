import { expect } from 'chai'
import sinon from 'sinon'

import { findCurrenciesByAccountId, updateOrCreateExchangeConfig } from '../../core'
import * as currencies from '../../core/symbols/currency_in_memory_cache'
import { updateCurrencyEnabledStatus } from '../test_utils'
import { CurrencyCode, SupportedFeatureFlags } from '@abx-types/reference-data'
describe('find_currencies', () => {
  const accountId = 'test'
  const codeParameterName = 'code'
  const currencyCode = 'BTC'
  let findAllCurrenciesStub
  beforeEach(async () => {
    await updateCurrencyEnabledStatus(CurrencyCode.bitcoin, true)
    await updateOrCreateExchangeConfig({
      featureFlags: []
    })

    findAllCurrenciesStub = sinon.stub(currencies, 'fetchAllCurrencies').callsFake(currencies.findCurrencies)
  })
  afterEach(async () => {
    findAllCurrenciesStub.restore()

    await updateCurrencyEnabledStatus(CurrencyCode.bitcoin, false)
    await updateOrCreateExchangeConfig({
      featureFlags: []
    })
  })

  it('findCurrenciesByAccountId when bitcoin not enabled', async () => {
    await updateCurrencyEnabledStatus(CurrencyCode.bitcoin, false)
    const currenciesForAccount = await findCurrenciesByAccountId(accountId)

    expect(currenciesForAccount).to.have.lengthOf(6)
    expect(currenciesForAccount).not.include.something.with.property(codeParameterName, currencyCode)
  })

  it('findCurrenciesByAccountId when bitcoin is enabled', async () => {
    const currenciesForAccount = await findCurrenciesByAccountId(accountId)

    expect(currenciesForAccount).to.have.lengthOf(7)
    expect(currenciesForAccount).to.include.something.with.property(codeParameterName, currencyCode)
  })

  it('findCurrenciesByAccountId when feature flag is enabled=false', async () => {
    await updateOrCreateExchangeConfig({
      featureFlags: [{name: SupportedFeatureFlags.bitcoin, enabled: false}]
    })
    const currenciesForAccount = await findCurrenciesByAccountId(accountId)

    expect(currenciesForAccount).to.have.lengthOf(6)
    expect(currenciesForAccount).not.include.something.with.property(codeParameterName, currencyCode)
  })

  it('findCurrenciesByAccountId when feature flag is enabled=true', async () => {
    await updateOrCreateExchangeConfig({
      featureFlags: [{name: SupportedFeatureFlags.bitcoin, enabled: true}]
    })
    const currenciesForAccount = await findCurrenciesByAccountId(accountId)

    expect(currenciesForAccount).to.have.lengthOf(7)
    expect(currenciesForAccount).to.include.something.with.property(codeParameterName, currencyCode)
  })

  it('findCurrenciesByAccountId when feature flag is enabled=[]', async () => {
    await updateOrCreateExchangeConfig({
      featureFlags: [{name: SupportedFeatureFlags.bitcoin, enabled: []}]
    })
    const currenciesForAccount = await findCurrenciesByAccountId(accountId)

    expect(currenciesForAccount).to.have.lengthOf(6)
    expect(currenciesForAccount).not.include.something.with.property(codeParameterName, currencyCode)
  })

  it('findCurrenciesByAccountId when feature flag is enabled does not contain accountId', async () => {
    await updateOrCreateExchangeConfig({
      featureFlags: [{name: SupportedFeatureFlags.bitcoin, enabled: ['null']}]
    })
    const currenciesForAccount = await findCurrenciesByAccountId(accountId)

    expect(currenciesForAccount).to.have.lengthOf(6)
    expect(currenciesForAccount).not.include.something.with.property(codeParameterName, currencyCode)
  })

  it('findCurrenciesByAccountId when feature flag is enabled does not contain accountId', async () => {
    await updateOrCreateExchangeConfig({
      featureFlags: [{name: SupportedFeatureFlags.bitcoin, enabled: [accountId]}]
    })
    const currenciesForAccount = await findCurrenciesByAccountId(accountId)

    expect(currenciesForAccount).to.have.lengthOf(7)
    expect(currenciesForAccount).to.include.something.with.property(codeParameterName, currencyCode)
  })
})
