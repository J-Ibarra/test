import { Transaction } from 'sequelize'

import { getEpicurusInstance as getInstance } from '@abx/db-connection-utils'

import { WithdrawalState } from '@abx-types/withdrawal'
import { cancelFiatWithdrawal } from '@abx-service-clients/withdrawal'
import { AdminRequest, WithdrawalUpdateRequest } from '@abx-service-clients/admin-fund-management'

export async function rejectWithdrawalRequest(request: AdminRequest, transaction: Transaction, rejectedAt: Date): Promise<void> {
  const withdrawalUpdateRequestParams: WithdrawalUpdateRequest = {
    globalTransactionId: request.globalTransactionId,
    description: request.description,
    paymentStatus: 'Forfeited',
    updatedAt: rejectedAt,
    tradingPlatformName: request.tradingPlatformName,
  }

  const epicurus = getInstance()
  epicurus.publish(EpicurusPubSubChannel.withdrawalRequestUpdated, withdrawalUpdateRequestParams)

  await cancelFiatWithdrawal(cancelFiatWithdrawal.id)
}
