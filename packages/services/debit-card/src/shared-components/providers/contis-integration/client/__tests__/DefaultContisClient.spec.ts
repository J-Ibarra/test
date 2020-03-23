import { DefaultContisClient } from '../DefaultContisClient'
import { ConfigSource } from '../../../config'
import { ContisEndpointPath } from '../ContisEndpoint.enum'
import { ContisAuthToken } from '../ContisAuthToken'
import { ContisRequestPayload } from '../../../debit-card-provider/contis/requests/ContisRequestPayload'
import { CurrencyCode } from '../../../../models'

describe('DefaultContisClient', () => {
  let defaultContisClient: DefaultContisClient

  const encryptionService = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  }

  const username = 'user'
  const password = 'pass'

  const configSource: ConfigSource = {
    getContisLogin: () => ({
      username,
      password,
    }),
    getContisConfig: () => ({
      apiRoot: 'root',
      cardOrderFee: 100,
      webhookWhitelistedIP: '0.0.0.0',
      cardOrderValidationSLAInMinutes: 1,
      contisNotificationQueueUrl: '',
    }),
    getExchangeDbConfig: jest.fn(),
    getDebitCardDbConfig: jest.fn(),
    getCookieCryptoParams: jest.fn(),
    getJwtConfig: jest.fn(),
    getUserInterfaceDomain: jest.fn(),
    getLogLevel: jest.fn(),
    getRedisConfig: jest.fn(),
  }

  const axiosInstance = {
    post: jest.fn(),
  }

  beforeEach(() => {
    jest.spyOn(configSource, 'getContisLogin')

    defaultContisClient = new DefaultContisClient(
      CurrencyCode.EUR,
      encryptionService,
      configSource,
      axiosInstance as any,
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('instance variables are inityialized properly', () => {
    it('should call getContisLogin', () => {
      expect(configSource.getContisLogin).toBeCalled()
    })
  })

  describe('sendRequest', () => {
    const mockEndpointPath: ContisEndpointPath = ContisEndpointPath.logIn
    const mockRequestBody: ContisRequestPayload = {
      encryptPayload: () => mockRequestBody,
    }
    const accessToken = '123'
    const contisSecurityKey = '1234'
    const dateInFuture = new Date()
    dateInFuture.setDate(dateInFuture.getDate() + 10)

    describe('when token is expired or not defined', () => {
      beforeEach(async () => {
        jest.spyOn(defaultContisClient, 'sendRequest')
        jest
          .spyOn(axiosInstance, 'post')
          .mockReturnValueOnce(
            Promise.resolve({
              statusText: 'OK',
              data: {
                access_token: accessToken,
                expires: dateInFuture,
                Contis_SecurityKey: contisSecurityKey,
              },
            }),
          )
          .mockReturnValueOnce(Promise.resolve({ data: 'other' }))

        await defaultContisClient.sendRequest(mockEndpointPath, mockRequestBody)
      })

      it('should call sendRequest again', () => {
        // We call login on object creation
        expect(axiosInstance.post).toBeCalledTimes(2)
      })

      it('should make a post request to login', () => {
        expect(axiosInstance.post).toHaveBeenCalledWith(
          ContisEndpointPath.logIn,
          `GRANT_TYPE=password&UserName=${username}&Password=${password}`,
          {
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
          },
        )
      })

      it('should set authenticationToken', () => {
        const expectedToken = new ContisAuthToken(new Date(dateInFuture), accessToken)

        expect(defaultContisClient['authenticationToken']).toEqual(expectedToken)
      })

      it('should set encryptionKey', () => {
        expect(defaultContisClient['encryptionKey']).toBe(contisSecurityKey)
      })

      it('should make actual request after login', () => {
        expect(axiosInstance.post).toHaveBeenCalledWith(mockEndpointPath, mockRequestBody, {
          headers: {
            Authorization: `Bearer ${defaultContisClient['authenticationToken'].token}`,
          },
        })
      })
    })

    describe('when token is valid', () => {
      let response

      beforeEach(async () => {
        jest.spyOn(defaultContisClient, 'sendRequest')
        jest.spyOn(axiosInstance, 'post').mockReturnValueOnce(Promise.resolve({ data: 'other' }))

        defaultContisClient['authenticationToken'] = new ContisAuthToken(new Date(dateInFuture), accessToken)

        response = await defaultContisClient.sendRequest(mockEndpointPath, mockRequestBody)
      })

      it('should make actual request', () => {
        expect(axiosInstance.post).toHaveBeenCalledWith(mockEndpointPath, mockRequestBody, {
          headers: {
            Authorization: `Bearer ${defaultContisClient['authenticationToken'].token}`,
          },
        })
      })

      it('should return a response', () => {
        expect(response).toBeDefined()
      })
    })
  })
})
