import { expect } from 'chai'
import MockExpressRequest from 'mock-express-request'
import { getApiCacheClient } from '@abx-utils/db-connection-utils'
import { maintenanceMiddleware } from '../maintenance'
import * as mocks from 'node-mocks-http'

describe('maintenance middleware', () => {
  const client = getApiCacheClient()

  afterEach(async () => {
    await client.delete('maintenance')
  })

  it('request should pass through the middleware and proceed', async () => {
    const client = getApiCacheClient()
    await client.delete('maintenance')

    const request = new MockExpressRequest()
    const response = mocks.createResponse()

    const successResult = await maintenanceMiddleware(request, response, () => {
      ''
    })

    expect(successResult).to.equal(undefined)
  })

  it('request should get stopped and error message and 500 status returned', async () => {
    const client = getApiCacheClient()
    await client.set<string>('maintenance', '1')

    const request = new MockExpressRequest()

    const mockResponse = {
      statusCode: undefined,
      send: (response: any) => {
        return { ...mockResponse, response }
      },
      status: (code: number) => {
        mockResponse.statusCode = code as any
        return mockResponse
      },
    }

    const successResult = await maintenanceMiddleware(request, mockResponse as any, null as any)
    const {
      response: { error },
      statusCode,
    } = successResult as any
    expect(error).to.eql('The system is down for maintenance')
    expect(statusCode).to.eql(503)
  })
})
