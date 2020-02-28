import util from 'util'
import { AxiosInstance, AxiosResponse } from 'axios'
import moment from 'moment'

import { Logger } from '@nestjs/common'
import qs from 'qs'
import uuid from 'uuid-random'

import { ContisClient } from './ContisClient.interface'
import { ContisResponse } from './ContisResponse.model'
import { ContisEndpointPath } from './ContisEndpoint.enum'
import { CurrencyCode, ContisLogin, Environment } from '../../../models'
import { ContisAuthToken } from './ContisAuthToken'
import { AESEncryptionService } from '../encryption'
import { ConfigSource } from '../../config'
import { ContisRequestPayload } from '../../debit-card-provider/contis/requests/ContisRequestPayload'
import { ContisResponsePayload } from '../../debit-card-provider/contis/responses/ContisResponsePayload'

const GRANT_TYPE = 'password'
export const CONTIS_AXIOS_INSTANCE_TOKEN = 'CONTIS_AXIOS_INSTANCE'

export class DefaultContisClient implements ContisClient {
  private logger = new Logger('DefaultContisClient')
  private contisLogin: ContisLogin
  private authenticationToken: ContisAuthToken
  private encryptionKey: string

  constructor(
    currency: CurrencyCode,
    private encryptionService: AESEncryptionService,
    configSource: ConfigSource,
    private axiosInstance: AxiosInstance,
  ) {
    this.contisLogin = configSource.getContisLogin(currency)
    if (process.env.ENV!.toLowerCase() !== Environment.test && process.env.ENV!.toLowerCase() !== Environment.ci) {
      this.logIn()
    }
  }

  public async sendRequest<T>(
    endpointPath: ContisEndpointPath,
    requestBody: ContisRequestPayload,
    responseTransformer: (T) => ContisResponsePayload = response => response,
  ): Promise<ContisResponse<T>> {
    this.logger.debug(`Token: ${JSON.stringify(this.authenticationToken)}`)

    if (!!this.authenticationToken && !this.authenticationToken.hasExpired()) {
      return this.sendRequestToContis<T>(endpointPath, requestBody, responseTransformer)
    } else {
      await this.logIn()
      return this.sendRequestToContis<T>(endpointPath, requestBody, responseTransformer)
    }
  }

  public generateReferenceId(): string {
    return uuid()
  }

  public getEncryptionKey(): string {
    return this.encryptionKey
  }

  private async sendRequestToContis<T>(
    endpointPath: ContisEndpointPath,
    requestBody: ContisRequestPayload,
    responseTransformer: (t: any) => ContisResponsePayload = response => response,
  ) {
    try {
      this.logger.log(`Contis Request Before Encryption`)
      this.logger.log(JSON.stringify(requestBody))
      const requestPayload = requestBody.encryptPayload(this.encryptionService, this.encryptionKey)
      this.logger.log(`Contis Request After Encryption`)
      this.logger.log(JSON.stringify(requestPayload))

      const response = await this.axiosInstance.post<T>(endpointPath, requestPayload, {
        headers: {
          Authorization: `Bearer ${this.authenticationToken.token}`,
        },
      })
      this.logger.debug(`${endpointPath} request to Contis succeeded`)

      return this.generateResponse<T>(response, responseTransformer)
    } catch (e) {
      this.logger.error(`${endpointPath} request to Contis failed`)
      this.logger.error(`Error: ${JSON.stringify(util.inspect(e.response.data))}`)
      if (!!e.response && e.response.status === 401) {
        await this.logIn()
        return this.sendRequestToContis(endpointPath, requestBody, responseTransformer)
      }

      throw e
    }
  }

  private generateResponse<T>(response: AxiosResponse, responseTransformer: (T) => ContisResponsePayload): ContisResponse<T> {
    if (response.statusText === 'OK') {
      return ContisResponse.success<T>(
        responseTransformer(response.data).decryptPayload(this.encryptionService, this.encryptionKey),
      )
    }

    return ContisResponse.error(response.status) as ContisResponse<T>
  }

  private async logIn() {
    const { username, password } = this.contisLogin

    try {
      const response = await this.axiosInstance.post(
        ContisEndpointPath.logIn,
        qs.stringify({
          GRANT_TYPE,
          UserName: username,
          Password: password,
        }),
        {
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
        },
      )

      if (response.statusText === 'OK') {
        this.logger.debug(`Successfully acquired login token from Contis for ${username}`)
        this.extractAuthData(response)
      }
    } catch (e) {
      this.logger.error('Unable to acquire login token from Contis')
      this.logger.error(JSON.stringify(util.inspect(e)))
      throw e
    }
  }

  private extractAuthData(response: AxiosResponse): void {
    const { access_token, expires, Contis_SecurityKey } = response.data

    const authToken = new ContisAuthToken(moment(expires).toDate(), access_token)

    this.authenticationToken = authToken
    this.encryptionKey = Contis_SecurityKey
  }
}
