import { ContisEndpointPath } from '../../providers'
import { ContisRequestPayload } from '../../providers/debit-card-provider/contis/requests/ContisRequestPayload'

export interface ContisRequestDetails {
  endpoint: ContisEndpointPath
  payload: ContisRequestPayload
}
