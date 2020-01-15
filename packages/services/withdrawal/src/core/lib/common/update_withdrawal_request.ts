import { Transaction } from 'sequelize'

import { getModel } from '@abx/db-connection-utils'
import { WithdrawalRequest } from '@abx-types/withdrawal'

export async function updateWithdrawalRequest({ id, ...values }: Partial<WithdrawalRequest>, transaction?: Transaction): Promise<WithdrawalRequest> {
  const [, [updatedWithdrawalRequest]] = await getModel<Partial<WithdrawalRequest>>('withdrawalRequest').update(values, {
    where: { id } as any,
    transaction,
    returning: true,
  })

  return updatedWithdrawalRequest && (updatedWithdrawalRequest.get() as any)
}

export async function updateWithdrawalRequests(
  id: number[],
  { ...values }: Partial<WithdrawalRequest>,
  transaction?: Transaction,
): Promise<WithdrawalRequest> {
  const [, [updatedWithdrawalRequest]] = await getModel<WithdrawalRequest>('withdrawalRequest').update(values as WithdrawalRequest, {
    where: { id },
    transaction,
    returning: true,
  })

  return updatedWithdrawalRequest && updatedWithdrawalRequest.get()
}
