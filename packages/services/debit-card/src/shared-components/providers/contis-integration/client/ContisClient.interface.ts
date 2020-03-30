import { ContisEndpointPath } from './ContisEndpoint.enum'
import { ContisResponse } from './ContisResponse.model'
import { ContisRequestPayload } from '../../debit-card-provider/contis/requests/ContisRequestPayload'
import { ContisResponsePayload } from '../../debit-card-provider/contis/responses/ContisResponsePayload'

export const CONTIS_CLIENT = 'contis-client'

/** Defines the blueprint for `Contis` API communication. */
export interface ContisClient {
  /**
   * Sends a request to the Contis API.
   *
   * @param endpointPath the endpoint path to issue the request to
   * @param requestBody the request body details
   * @param referenceId a generated ID used for tracking purposes
   */
  sendRequest<T>(
    endpointPath: ContisEndpointPath,
    requestBody: ContisRequestPayload,
    responseTransformer: (T) => ContisResponsePayload,
  ): Promise<ContisResponse<T>>

  generateReferenceId(): string
}
