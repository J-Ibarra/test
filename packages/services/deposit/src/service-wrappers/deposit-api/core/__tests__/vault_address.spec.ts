import { expect } from 'chai'
import { getAccountVaultPublicKey, persistAccountVaultPublicKey, validateAccount } from '../vault/vault_data_retrieval'
import { createTemporaryTestingAccount } from '@abx-utils/account'
import { truncateTables } from '@abx-utils/db-connection-utils'

describe('vault_address', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  it('persistUsersVaultPublicKey should store vault address generated', async () => {
    const account = await createTemporaryTestingAccount()
    const vaultPublicKey = 'persistUsersVaultPublicKey_PublicKey'

    const vaultAddress = await persistAccountVaultPublicKey(account.id, vaultPublicKey)
    expect(vaultAddress.accountId).to.eql(account.id)
    expect(vaultAddress.publicKey).to.eql(vaultPublicKey)
  })
  it('persistUsersVaultPublicKey should return an error because the vault belongs to another account', async () => {
    const account = await createTemporaryTestingAccount()
    const accountTwo = await createTemporaryTestingAccount()
    const vaultPublicKey = 'getUserVaultPublicKey_PublicKey'
    await persistAccountVaultPublicKey(accountTwo.id, vaultPublicKey)
    let response
    try {
      response = await persistAccountVaultPublicKey(account.id, vaultPublicKey)
    } catch (e) {
      response = e.message
    }
    expect(response).to.eql('This is not the correct public key for your wallet.')
  })
  it('persistUsersVaultPublicKey should return an error because you are adding a vault that does not belong to your account', async () => {
    const account = await createTemporaryTestingAccount()
    const myVaultPublicKey = 'getUserVaultPublicKey_PublicKey'
    const someoneElsesVaultPublicKey = 'getUserVaultPublicKey_PublicKey_not_mine'
    await persistAccountVaultPublicKey(account.id, myVaultPublicKey)
    let response
    try {
      response = await persistAccountVaultPublicKey(account.id, someoneElsesVaultPublicKey)
    } catch (e) {
      response = e.message
    }
    expect(response).to.eql('Your accounts linked wallet does not match the wallet you are trying to import. Accounts can only have 1 wallet.')
  })
  it('getUserVaultPublicKey should return null if there is no persisted vault public key for accountId provided', async () => {
    const account = await createTemporaryTestingAccount()
    const vaultAddress = await getAccountVaultPublicKey({ accountId: account.id })
    expect(vaultAddress).to.eql(null)
  })
  it('getUserVaultPublicKey should return correct vaultAddress object for accountId provided', async () => {
    const account = await createTemporaryTestingAccount()
    const vaultPublicKey = 'getUserVaultPublicKey_PublicKey'
    await persistAccountVaultPublicKey(account.id, vaultPublicKey)

    const vaultAddress = await getAccountVaultPublicKey({ accountId: account.id })
    expect(vaultAddress!.accountId).to.eql(account.id)
    expect(vaultAddress!.publicKey).to.eql(vaultPublicKey)
  })
  it('persistUsersVaultPublicKey should return an error because you are adding a vault that does not belong to your account', async () => {
    const account = await createTemporaryTestingAccount()
    const myVaultPublicKey = 'getUserVaultPublicKey_PublicKey'
    const someoneElsesVaultPublicKey = 'getUserVaultPublicKey_PublicKey_not_mine'
    await persistAccountVaultPublicKey(account.id, myVaultPublicKey)
    let response
    try {
      response = await persistAccountVaultPublicKey(account.id, someoneElsesVaultPublicKey)
    } catch (e) {
      response = e.message
    }
    expect(response).to.eql('Your accounts linked wallet does not match the wallet you are trying to import. Accounts can only have 1 wallet.')
  })
  it('validateAccount should not throw errors', async () => {
    const account = await createTemporaryTestingAccount()
    const vaultPublicKey = 'persistUsersVaultPublicKey_PublicKey'
    let functionError
    try {
      await validateAccount(account.id, vaultPublicKey)
      functionError = false
    } catch (e) {
      functionError = true
    }
    expect(functionError).to.eql(false)
  })
  it('validateAccount should return an error because the vault belongs to another account', async () => {
    const account = await createTemporaryTestingAccount()
    const accountTwo = await createTemporaryTestingAccount()
    const vaultPublicKey = 'getUserVaultPublicKey_PublicKey'
    await persistAccountVaultPublicKey(accountTwo.id, vaultPublicKey)
    let response
    try {
      response = await validateAccount(account.id, vaultPublicKey)
    } catch (e) {
      response = e.message
    }
    expect(response).to.eql('This is not the correct public key for your wallet.')
  })
  it('validateAccount should return an error because you are adding a vault that does not belong to your account', async () => {
    const account = await createTemporaryTestingAccount()
    const myVaultPublicKey = 'getUserVaultPublicKey_PublicKey'
    const someoneElsesVaultPublicKey = 'getUserVaultPublicKey_PublicKey_not_mine'
    await persistAccountVaultPublicKey(account.id, myVaultPublicKey)
    let response
    try {
      response = await validateAccount(account.id, someoneElsesVaultPublicKey)
    } catch (e) {
      response = e.message
    }
    expect(response).to.eql('Your accounts linked wallet does not match the wallet you are trying to import. Accounts can only have 1 wallet.')
  })
})
