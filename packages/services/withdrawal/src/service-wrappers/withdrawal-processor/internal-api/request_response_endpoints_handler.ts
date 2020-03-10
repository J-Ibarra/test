import { WithdrawalProcessorEndpoints } from '@abx-service-clients/withdrawal'
import { completeFiatWithdrawal } from '../core/withdrawal-completion/fiat/fiat_completion_request_handler'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createRequestResponseEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: WithdrawalProcessorEndpoints.completeFiatWithdrawal,
      handler: ({ adminRequestId, fee }) => completeFiatWithdrawal({ adminRequestId, fee }),
    },
  ]
}
