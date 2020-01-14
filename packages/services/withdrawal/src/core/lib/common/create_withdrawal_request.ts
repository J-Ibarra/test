import { Transaction } from 'sequelize'

import { WithdrawalRequest } from '@abx-types/withdrawal'
import { getModel } from '@abx/db-connection-utils'

export async function createWithdrawalRequest(
  withdrawalParams: WithdrawalRequest,
  t?: Transaction,
) {
  const pendingRequest = await getModel<WithdrawalRequest>('withdrawalRequest').create(
    withdrawalParams,
    { transaction: t },
  )

  return pendingRequest.get()
}
