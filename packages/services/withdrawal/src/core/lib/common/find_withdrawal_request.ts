import moment from 'moment'
import { Transaction } from 'sequelize'

import { getModel, wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { WithdrawalRequest, WithdrawalState } from '@abx-types/withdrawal'

export async function findWithdrawalRequestById(id: number, transaction?: Transaction) {
  const withdrawalRequest = await getModel<WithdrawalRequest>('withdrawalRequest').findByPrimary(id, {
    transaction,
  })

  return withdrawalRequest ? withdrawalRequest.get({ plain: true }) : null
}

export async function findWithdrawalRequestByIdWithFeeRequest(id: number, transaction?: Transaction): Promise<WithdrawalRequest | null> {
  return wrapInTransaction(sequelize, transaction, async t => {
    const withdrawalRequestInstance = await getModel<WithdrawalRequest>('withdrawalRequest').findByPrimary(id, {
      transaction,
      lock: t.LOCK.UPDATE,
    })

    if (withdrawalRequestInstance) {
      return joinWithdrawalRequestWithFeeRequest(withdrawalRequestInstance.get(), transaction)
    }

    return null
  })
}

export async function findWithdrawalRequestsByIds(ids: number[], transaction?: Transaction) {
  const withdrawalRequests = await getModel<WithdrawalRequest>('withdrawalRequest').findAll({
    where: {
      id: { $in: ids },
    },
    transaction,
  })

  return withdrawalRequests.map(withdrawalRequestInstance => withdrawalRequestInstance.get())
}

export async function findWithdrawalRequestsForTransactionHashes(txHashes: string[], transaction?: Transaction) {
  const withdrawalRequests = await getModel<WithdrawalRequest>('withdrawalRequest').findAll({
    where: {
      txHash: { $in: txHashes },
    },
    transaction,
  })

  return withdrawalRequests.map(withdrawalRequestInstance => withdrawalRequestInstance.get())
}

export async function findWithdrawalRequestByAdminRequestId(adminRequestId: number, transaction?: Transaction) {
  const withdrawalRequest = await getModel<WithdrawalRequest>('withdrawalRequest').find({
    where: { adminRequestId },
    transaction,
  })

  return withdrawalRequest ? withdrawalRequest.get({ plain: true }) : null
}

export async function findWithdrawalRequest(query: Partial<WithdrawalRequest>) {
  const withdrawalRequest = await getModel<WithdrawalRequest>('withdrawalRequest').findOne({
    where: { ...query } as any,
  })

  return withdrawalRequest ? withdrawalRequest.get() : null
}

export async function findAndLockWithdrawalRequestById(id: number, transaction?: Transaction) {
  const withdrawalRequest = await getModel<WithdrawalRequest>('withdrawalRequest').findByPrimary(id, {
    transaction,
    lock: Transaction.LOCK.UPDATE,
  })

  return withdrawalRequest ? withdrawalRequest.get({ plain: true }) : null
}

export async function findNonCancelledWithdrawalsForTheLast24Hours(accountId: string): Promise<WithdrawalRequest[]> {
  const withdrawalRequests = await getModel<WithdrawalRequest>('withdrawalRequest').findAll({
    where: {
      accountId,
      createdAt: {
        $gte: moment()
          .subtract(24, 'hours')
          .toDate(),
      },
      state: { $ne: WithdrawalState.cancelled },
    },
  })

  return withdrawalRequests.map(withdrawalRequest => withdrawalRequest.get({ plain: true }))
}

export async function findWithdrawalRequests(query: Partial<WithdrawalRequest>) {
  const withdrawalRequests = await getModel<WithdrawalRequest>('withdrawalRequest').findAll({
    where: query as any,
  })

  return withdrawalRequests.map(withdrawalRequest => withdrawalRequest.get({ plain: true }))
}

export const findWithdrawalRequestByTxHash = (txHash: string) => findWithdrawalRequest({ txHash })

export const findWithdrawalRequestByTxHashWithFeeRequest = async (txHash: string, transaction: Transaction) => {
  const withdrawalRequestInstance = await getModel<WithdrawalRequest>('withdrawalRequest').findOne({
    where: { txHash },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })

  if (withdrawalRequestInstance) {
    return joinWithdrawalRequestWithFeeRequest(withdrawalRequestInstance.get(), transaction)
  }

  return null
}

async function joinWithdrawalRequestWithFeeRequest(withdrawalRequest: WithdrawalRequest, transaction?: Transaction) {
  if (withdrawalRequest.feeWithdrawalRequestId) {
    const feeRequest = await findWithdrawalRequestById(withdrawalRequest.id!, transaction)

    withdrawalRequest.feeRequest = feeRequest!
  }

  return withdrawalRequest
}
