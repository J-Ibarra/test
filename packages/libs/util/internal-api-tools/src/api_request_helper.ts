import axios, { AxiosInstance } from 'axios'
import { MemoryCache } from '@abx-utils/db-connection-utils'
import { Logger } from '@abx-utils/logging'

export class InternalApiRequestDispatcher {
  private axiosInstance: AxiosInstance
  private logger = Logger.getInstance('internal-api-tools', 'InternalApiRequestDispatcher')
  private memoryCache = MemoryCache.getInstance()

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

  public async returnCachedValueOrRetrieveFromSource<T>({
    endpoint, 
    ttl = 30_000,
    responseBody = {}
  }: {
    endpoint: string, 
    ttl?: number,
    responseBody?: any
  }): Promise<T> {
    const cachedValue = await this.memoryCache.get(endpoint)
  
    if (!!cachedValue) {
      return cachedValue as T
    }
  
    const freshValue = await this.fireRequestToInternalApi<T>(endpoint, responseBody)
    this.memoryCache.set<T>({
      key: endpoint,
      ttl,
      val: freshValue,
    })
  
    return freshValue
  }
}
