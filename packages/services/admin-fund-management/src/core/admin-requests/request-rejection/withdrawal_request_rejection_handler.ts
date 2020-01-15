import { getEpicurusInstance as getInstance } from '@abx/db-connection-utils'

import { WithdrawalPubSubChannels, cancelFiatWithdrawal } from '@abx-service-clients/withdrawal'
import { AdminRequest, WithdrawalUpdateRequest } from '@abx-service-clients/admin-fund-management'

export async function rejectWithdrawalRequest(request: AdminRequest, rejectedAt: Date): Promise<void> {
  const withdrawalUpdateRequestParams: WithdrawalUpdateRequest = {
    globalTransactionId: request.globalTransactionId,
    description: request.description,
    paymentStatus: 'Forfeited',
    updatedAt: rejectedAt,
    tradingPlatformName: request.tradingPlatformName,
  }

  const epicurus = getInstance()
  epicurus.publish(WithdrawalPubSubChannels.withdrawalRequestUpdated, withdrawalUpdateRequestParams)

  await cancelFiatWithdrawal(request.id)
}
