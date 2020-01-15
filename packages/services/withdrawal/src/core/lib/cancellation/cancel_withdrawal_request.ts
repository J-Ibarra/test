import { Transaction } from 'sequelize'
import { Logger } from '@abx/logging'
import { wrapInTransaction, sequelize } from '@abx/db-connection-utils'
import { WithdrawalRequest, WithdrawalState } from '@abx-types/withdrawal'
import { updateWithdrawalRequest } from './../common/update_withdrawal_request'

const logger = Logger.getInstance('cancel_withrawal_request', 'cancelWithdrawalRequest')

export async function cancelWithdrawalRequest(withdrawalRequest: WithdrawalRequest, transaction?: Transaction): Promise<WithdrawalRequest> {
  return wrapInTransaction(sequelize, transaction, async t => {
    logger.debug(`Cancelling withdrawal request ${withdrawalRequest.id}`)
    const cancelledRequest = await updateWithdrawalRequest({ ...withdrawalRequest, state: WithdrawalState.cancelled }, t)

    logger.debug(`Cancelled withdrawal request ${withdrawalRequest.id}`)
    return cancelledRequest
  })
}
