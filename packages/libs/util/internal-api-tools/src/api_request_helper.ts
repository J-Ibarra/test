import axios, { AxiosInstance } from 'axios'

export class InternalApiRequestDispatcher {
  private axiosInstance: AxiosInstance

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
    const response = await this.axiosInstance.post<T>(`/internal-api/${path}`, requestBody)

    return response.data
  }
}
