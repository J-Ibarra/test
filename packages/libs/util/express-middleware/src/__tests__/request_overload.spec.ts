import { expect } from 'chai'
import { createAccountAndSession, JwtTokenHandler, createTemporaryTestingAccount } from '@abx-utils/account'
import { overloadRequestWithSessionInfo } from '../request_overload'
import { OverloadedRequest } from '@abx-types/account'
import * as mocks from 'node-mocks-http'

describe('request overloading', () => {
  it('request should be enriched with session details', async () => {
    const { cookie, account, email, id } = await createAccountAndSession()
    const request: OverloadedRequest = mocks.createRequest({
        cookies: {
            appSession: cookie.substring(11)
        }
    })

    await overloadRequestWithSessionInfo(request)

    expect(request.session!.userId).to.eql(id)
    expect(request.account!.id).to.eql(account.id)
    expect(request.user.id).to.eql(id)
    expect(request.user.email).to.eql(email)
    expect(request.where).to.eql({})
  })

  it('request should be enriched with api token details', async () => {
    const account = await createTemporaryTestingAccount()
    const authorizationToken = new JwtTokenHandler().generateToken(account.id).token
    const request: OverloadedRequest = mocks.createRequest({
        headers: {
          authorization: authorizationToken
        }
    })

    await overloadRequestWithSessionInfo(request)

    expect(request.account!.id).to.eql(account.id)
    expect(request.where).to.eql({})
  })

  it('request should be enriched with query params', async () => {
    const { cookie } = await createAccountAndSession()
    const request: OverloadedRequest = mocks.createRequest({
        cookies: {
            appSession: cookie.substring(11)
        },
        query: {
          prop: 'equal',
          comma_eq: 'foo,bar',
          noComma_eq: 'par'
        }
    })

    await overloadRequestWithSessionInfo(request)

    expect(request.where).to.eql({
      prop: 'equal',
      comma: {
        '$eq': ['foo', 'bar']
      },
      noComma: {
        $eq: 'par'
      }
    })
  })
})
