import { expect } from 'chai'
import { AccountType } from '@abx-types/account'
import { createTemporaryTestingAccount } from '@abx-utils/account'
import {
  findDepositAddresses,
  findDepositAddressesForAccount,
  findKycOrEmailVerifiedDepositAddresses,
  findOrCreateDepositAddressesForAccount,
  generateNewDepositAddress,
  storeDepositAddress,
} from '..'
import * as accountOperations from '@abx-service-clients/account'
import sinon from 'sinon'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import { truncateTables } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import * as onChainIntegration from '@abx-utils/blockchain-currency-gateway'
import { findDepositAddressByAddressOrPublicKey } from '../deposit-address'

describe('Deposit Address module', () => {
  let ACCOUNT_ID: string

  let currencyId: number = 2
  let ethereumCurrencyId: number = 3
  const kagCurrencyId = 4
  const kvtCurrencyId = 5
  const tetherCurrencyId = 6
  const cryptoCurrencies = [
    {
      id: currencyId,
      code: CurrencyCode.kau,
    },
    {
      id: ethereumCurrencyId,
      code: CurrencyCode.ethereum,
    },
    {
      id: kagCurrencyId,
      code: CurrencyCode.kag,
    },
    {
      id: kvtCurrencyId,
      code: CurrencyCode.kvt,
    },
    {
      id: tetherCurrencyId,
      code: CurrencyCode.tether,
    },
  ]

  const testCurrencyManager = {
    generateAddress: () => ({ privateKey: 'private-key', publicKey: 'publicKey' }),
    getAddressFromPrivateKey: () => 'address',
    encryptValue: (value) => Promise.resolve(value),
    getId: () => currencyId,
  } as any

  beforeEach(async () => {
    await truncateTables()
    const account = await createTemporaryTestingAccount(AccountType.individual)

    ACCOUNT_ID = account.id
  })

  afterEach(() => sinon.restore())

  it('stores an address and can be retrieved', async () => {
    const newAddress = await generateNewDepositAddress(ACCOUNT_ID, testCurrencyManager)
    sinon.stub(referenceDataOperations, 'getCurrencyId').resolves(currencyId)

    await storeDepositAddress(newAddress)

    const allAddresses = await findDepositAddresses({ currencyId })
    expect(allAddresses.length).to.eql(1)
  })

  it('findDepositAddressesForUser only gets addresses for specified account', async () => {
    const newAddress = await generateNewDepositAddress(ACCOUNT_ID, testCurrencyManager)
    await storeDepositAddress(newAddress)

    const notAccountId = (await createTemporaryTestingAccount()).id

    const noUserAddresses = await findDepositAddressesForAccount(notAccountId)
    expect(noUserAddresses.length).to.equal(0)

    const addressesForAccount = await findDepositAddressesForAccount(ACCOUNT_ID)
    expect(addressesForAccount.length).to.equal(1)
  })

  it('findDepositAddressByAddressOrPublicKey should find deposit address for a publicKey', async () => {
    const storedAddress = await storeDepositAddress({
      accountId: ACCOUNT_ID,
      currencyId: 1,
      encryptedPrivateKey: 'foo',
      publicKey: 'Bar',
      transactionTrackingActivated: false,
    })

    const fetchedDepositAddress = await findDepositAddressByAddressOrPublicKey('bar', 1)

    expect(storedAddress).to.eql(fetchedDepositAddress)
  })

  it('findDepositAddressByAddressOrPublicKey should find deposit address for an address', async () => {
    const storedAddress = await storeDepositAddress({
      accountId: ACCOUNT_ID,
      currencyId: 1,
      encryptedPrivateKey: 'foo',
      publicKey: 'foo-pk',
      address: 'Bar',
      transactionTrackingActivated: false,
    })

    const fetchedDepositAddress = await findDepositAddressByAddressOrPublicKey('bar', 1)

    expect(storedAddress).to.eql(fetchedDepositAddress)
  })

  describe('findOrCreateDepositAddressesForAccount', () => {
    const testBasedOnCurrencyManager = (currency): any => {
      return {
        generateAddress: () => Promise.resolve({ privateKey: `private-key-${currency}`, publicKey: `publicKey${currency}` }),
        getAddressFromPrivateKey: () => Promise.resolve('address'),
        encryptValue: (value) => Promise.resolve(value),
        getId: () => Promise.resolve(cryptoCurrencies.find((cc) => cc.code === currency)!.id),
      }
    }

    beforeEach(() => {
      sinon.stub(referenceDataOperations, 'findCryptoCurrencies').resolves(cryptoCurrencies)
      sinon.stub(referenceDataOperations, 'getAllCurrenciesEligibleForAccount').resolves(cryptoCurrencies)

      sinon
        .stub(onChainIntegration.CurrencyManager.prototype, 'getCurrencyFromTicker')
        .callsFake((currencyCode) => testBasedOnCurrencyManager(currencyCode))
    })

    it('generates missing deposit addresses for all currencies (new account)', async () => {
      const newAddresses = await findOrCreateDepositAddressesForAccount(ACCOUNT_ID)
      expect(newAddresses.length).to.eql(5)

      const kauAddress = newAddresses.find((a) => a.currencyId === currencyId)
      const kagAddress = newAddresses.find((a) => a.currencyId === kagCurrencyId)
      expect(kauAddress!.publicKey).to.eql(kagAddress!.publicKey)
      expect(kauAddress!.encryptedPrivateKey).to.eql(kagAddress!.encryptedPrivateKey)
    })

    it('generates missing deposit address ETH token address missing', async () => {
      const newAddress = {
        accountId: ACCOUNT_ID,
        encryptedPrivateKey: 'private-key-1',
        publicKey: 'public-key-2',
        transactionTrackingActivated: false,
      }
      await storeDepositAddress({
        ...newAddress,
        publicKey: `public-key${CurrencyCode.kau}`,
        currencyId,
      })
      await storeDepositAddress({
        ...newAddress,
        publicKey: `public-key${CurrencyCode.ethereum}`,
        currencyId: ethereumCurrencyId,
      })
      await storeDepositAddress({
        ...newAddress,
        publicKey: `public-key${CurrencyCode.kag}`,
        currencyId: kagCurrencyId,
      })
      await storeDepositAddress({
        ...newAddress,
        publicKey: `public-key${CurrencyCode.kvt}`,
        currencyId: kvtCurrencyId,
      })

      const newAddresses = await findOrCreateDepositAddressesForAccount(ACCOUNT_ID)

      const tetherAddress = newAddresses.find((a) => a.currencyId === tetherCurrencyId)!
      expect(tetherAddress.publicKey).to.eql(`public-key${CurrencyCode.kvt}`)
    })
  })

  it('findKycOrEmailVerifiedDepositAddresses only gets addresses for emailVerified or KycVerified accounts', async () => {
    const kycVerifiedAccount = await createTemporaryTestingAccount(AccountType.individual)
    const kycVerifiedAccount2 = await createTemporaryTestingAccount(AccountType.individual)

    await storeDepositAddress({
      accountId: kycVerifiedAccount.id,
      encryptedPrivateKey: 'encrPK',
      currencyId: ethereumCurrencyId,
      publicKey: 'pk1',
      transactionTrackingActivated: false,
    })
    await storeDepositAddress({
      accountId: kycVerifiedAccount2.id,
      encryptedPrivateKey: 'encrPK2',
      currencyId: ethereumCurrencyId,
      publicKey: 'pk2',
      transactionTrackingActivated: false,
    })
    sinon.stub(accountOperations, 'getAllKycOrEmailVerifiedAccountIds').resolves(new Set([kycVerifiedAccount.id, kycVerifiedAccount2.id]))

    const addresses = await findKycOrEmailVerifiedDepositAddresses(ethereumCurrencyId)
    addresses.forEach(({ currencyId: addressCurrencyId }) => expect(addressCurrencyId).to.eql(ethereumCurrencyId))

    const accountIdsFromAddresses = addresses.map((address) => address.accountId)

    expect(accountIdsFromAddresses.includes(kycVerifiedAccount.id)).to.eql(true)
    expect(accountIdsFromAddresses.includes(kycVerifiedAccount2.id)).to.eql(true)
  })
})
