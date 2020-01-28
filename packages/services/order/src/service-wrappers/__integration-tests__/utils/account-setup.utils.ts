import sinon from 'sinon'
import { createTemporaryTestingAccount } from '@abx-utils/account'
import * as accountOperations from '@abx-service-clients/account'
import { times } from 'lodash'

export async function createTestTradingAccounts(accountsToCreate = 1): Promise<{ accountId: string }[]> {
  const accounts = await Promise.all(times(accountsToCreate, String).map(() => createTemporaryTestingAccount()))

  const findAccountByIdStub = sinon.stub(accountOperations, 'findAccountById')

  accounts.forEach(account => findAccountByIdStub.withArgs(account.id).resolves(account))

  return accounts.map(({ id }) => ({ accountId: id! }))
}
