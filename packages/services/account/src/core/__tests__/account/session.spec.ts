import { expect } from 'chai'
import moment from 'moment'
import { createSession, createSessionForUser, killSession } from '../..'
import { createTemporaryTestingAccount } from '@abx-utils/account'
import { truncateTables } from '@abx-utils/db-connection-utils'

describe('session', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  it('creates and kills new session', async () => {
    const account = await createTemporaryTestingAccount()
    const newUser = account.users![0]

    const session = await createSession(newUser.id)

    expect(session.userId).to.eql(newUser.id)
    expect(session.deactivated).to.eql(false)

    const killed = await killSession(session.id)

    expect(killed.userId).to.eql(newUser.id)
    expect(killed.deactivated).to.eql(true)
  })

  it('createSessionForUser creates new cookie and updates user lastLogin', async () => {
    const { id, users, hin } = await createTemporaryTestingAccount()

    const accountUser = users![0]
    const { sessionCookie, user: userDetailsAfterFirstLogin } = await createSessionForUser(accountUser.id)

    expect(sessionCookie).to.be.a('string')
    expect(userDetailsAfterFirstLogin.id).to.equal(accountUser.id)
    expect(userDetailsAfterFirstLogin.accountId).to.equal(id)
    expect(userDetailsAfterFirstLogin.accountType).to.equal(userDetailsAfterFirstLogin.accountType)
    expect(userDetailsAfterFirstLogin.hin).to.equal(hin)
    expect(userDetailsAfterFirstLogin.hasTriggeredKycCheck).to.equal(false)

    // The lastLogin should be set to null as we use the previous login date
    expect(userDetailsAfterFirstLogin.lastLogin).to.eql(null)

    const { user: userDetailsAfterSecondLogin } = await createSessionForUser(accountUser.id)

    // test that the lastLogin field has been updated within the last 2 seconds
    const lastLoginUnix = moment(userDetailsAfterSecondLogin.lastLogin).unix()
    expect(lastLoginUnix).to.approximately(moment().unix(), 2)
  })
})
