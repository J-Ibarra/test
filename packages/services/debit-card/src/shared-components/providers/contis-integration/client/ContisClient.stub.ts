import { ContisClient } from './ContisClient.interface'
import { ContisEndpointPath } from './ContisEndpoint.enum'
import { ContisResponse } from './ContisResponse.model'

export const stubReferenceId = 'stubReferenceId'
export const encryptionKey = 'e9de8858a76c406eb2cdde4a33f6e1b286ee3efccfb94506a7dfcfd04e9720bc46634d7679db40b1afa94cfe2d2f2018'

export class ContisClientStub implements ContisClient {
  private callRecord = new Map<ContisEndpointPath, number>()

  constructor(private stubbedEndpoints: Map<ContisEndpointPath, any>, private rejectRequest?: Map<ContisEndpointPath, boolean>) {}

  sendRequest<T>(endpointPath: ContisEndpointPath): Promise<ContisResponse<T>> {
    if (!!this.rejectRequest && !!this.rejectRequest.get(endpointPath)) {
      return Promise.reject(ContisResponse.error(400))
    }

    const stubbedResponse = this.stubbedEndpoints.get(endpointPath)
    this.callRecord.set(endpointPath, (this.callRecord.get(endpointPath) || 0) + 1)
    return Promise.resolve(ContisResponse.success(stubbedResponse))
  }

  getNumberOfCallsForEndpoint(endpointPath: ContisEndpointPath) {
    return this.callRecord.get(endpointPath)
  }

  generateReferenceId() {
    return stubReferenceId
  }

  getEncryptionKey() {
    return encryptionKey
  }

  cleanCallRecord() {
    this.callRecord = new Map()
  }
}
