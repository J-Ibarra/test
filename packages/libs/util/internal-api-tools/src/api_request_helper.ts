import axios, { AxiosInstance } from 'axios'
import { Logger } from '@abx-utils/logging'

export class InternalApiRequestDispatcher {
  private axiosInstance: AxiosInstance
  private logger = Logger.getInstance('internal-api-tools', 'InternalApiRequestDispatcher')

  constructor(localApiPort?: number) {
    this.axiosInstance = axios.create({
      baseURL: process.env.INTERNAL_API_LB_URL || `http://localhost:${localApiPort}`, // The API Stub runs on this port for local E2E tests
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
  }

  public async fireRequestToInternalApi<T>(path: string, requestBody?: any): Promise<T> {
    this.logger.debug(`Making a request to ${path} with payload ${JSON.stringify(requestBody)}`)

    const response = await this.axiosInstance.post<T>(`/internal-api/${path}`, requestBody)

    return response.data
  }
}
