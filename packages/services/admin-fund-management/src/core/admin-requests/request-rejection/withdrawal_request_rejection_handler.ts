import { Transaction } from 'sequelize'

import { EpicurusPubSubChannel } from '@abx/db-connection-utils'

import { getEpicurusInstance as getInstance } from '@abx/db-connection-utils'

import { WithdrawalState } from '@abx-types/withdrawal'
import { findWithdrawalRequest, cancelFiatWithdrawal } from '@abx-service-clients/withdrawal'
import { AdminRequest, WithdrawalUpdateRequest } from '@abx-service-clients/admin-fund-management'

export async function rejectWithdrawalRequest(currencyId: number, request: AdminRequest, transaction: Transaction, rejectedAt: Date): Promise<void> {
  const requestBeingCancelled = await findWithdrawalRequest({
    currencyId,
    amount: request.amount,
    state: WithdrawalState.pending,
    adminRequestId: request.id
  })

  const withdrawalUpdateRequestParams: WithdrawalUpdateRequest = {
    globalTransactionId: request.globalTransactionId,
    description: request.description,
    paymentStatus: 'Forfeited',
    updatedAt: rejectedAt,
    tradingPlatformName: request.tradingPlatformName,
  }

  const epicurus = getInstance()
  epicurus.publish(EpicurusPubSubChannel.withdrawalRequestUpdated, withdrawalUpdateRequestParams)

  await cancelFiatWithdrawal({ id: requestBeingCancelled.id, transaction })
}
