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

describe('Deposit Address module', () => {
  let ACCOUNT_ID: string

  let currencyId: number = 2
  let ethereumCurrencyId: number = 3

  const testCurrencyManager = {
    generateAddress: () => ({ privateKey: 'private-key', publicKey: 'publicKey' }),
    getAddressFromPrivateKey: () => 'address',
    encryptValue: value => Promise.resolve(value),
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

  it('fetchDepositAddressesForUser generates missing deposit addresses for implemented currencies', async () => {
    const newAddress = {
      accountId: ACCOUNT_ID,
      currencyId: 1,
      encryptedPrivateKey: 'private-key-1',
      publicKey: 'public-key-2',
    }

    await storeDepositAddress(newAddress)

    const currentAddresses = await findDepositAddressesForAccount(ACCOUNT_ID)
    expect(currentAddresses.length).to.eql(1)

    sinon.stub(referenceDataOperations, 'findCryptoCurrencies').resolves([
      {
        id: currencyId,
        code: CurrencyCode.kau,
      },
      {
        id: ethereumCurrencyId,
        code: CurrencyCode.ethereum,
      },
      {
        id: 4,
        code: CurrencyCode.kag,
      },
    ])
    sinon.stub(onChainIntegration.CurrencyManager.prototype, 'getCurrencyFromTicker').returns(testCurrencyManager)

    const newAddresses = await findOrCreateDepositAddressesForAccount(ACCOUNT_ID)
    expect(newAddresses.length).to.eql(4)
  })

  it('findKycOrEmailVerifiedDepositAddresses only gets addresses for emailVerified or KycVerified accounts', async () => {
    const kycVerifiedAccount = await createTemporaryTestingAccount(AccountType.individual)
    const kycVerifiedAccount2 = await createTemporaryTestingAccount(AccountType.individual)

    await storeDepositAddress({
      accountId: kycVerifiedAccount.id,
      encryptedPrivateKey: 'encrPK',
      currencyId: ethereumCurrencyId,
      publicKey: 'pk1',
    })
    await storeDepositAddress({
      accountId: kycVerifiedAccount2.id,
      encryptedPrivateKey: 'encrPK2',
      currencyId: ethereumCurrencyId,
      publicKey: 'pk2',
    })
    sinon.stub(accountOperations, 'getAllKycOrEmailVerifiedAccountIds').resolves(new Set([kycVerifiedAccount.id, kycVerifiedAccount2.id]))

    const addresses = await findKycOrEmailVerifiedDepositAddresses(ethereumCurrencyId)
    addresses.forEach(({ currencyId: addressCurrencyId }) => expect(addressCurrencyId).to.eql(ethereumCurrencyId))

    const accountIdsFromAddresses = addresses.map(address => address.accountId)

    expect(accountIdsFromAddresses.includes(kycVerifiedAccount.id)).to.eql(true)
    expect(accountIdsFromAddresses.includes(kycVerifiedAccount2.id)).to.eql(true)
  })
})
