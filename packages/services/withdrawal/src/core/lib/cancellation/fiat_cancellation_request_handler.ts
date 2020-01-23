import { Logger } from '@abx-utils/logging'
import { ValidationError } from '@abx-types/error'
import { isFiatCurrency } from '@abx-service-clients/reference-data'
import { WithdrawalCancelParams, WithdrawalState } from '@abx-types/withdrawal'
import { findWithdrawalRequestById } from '../common/find_withdrawal_request'
import { cancelWithdrawalRequest } from './cancel_withdrawal_request'

const logger = Logger.getInstance('fiat_cancellation_request_handler', 'cancelFiatWithdrawal')

const validators = [
  (id, withdrawalRequest) => ({
    isInvalid: !withdrawalRequest.id,
    error: `No withdrawal request exists with id ${id}`,
  }),
  (_, { currency }) => ({
    isInvalid: !currency || !isFiatCurrency(currency.code),
    error: 'Only fiat withdrawals can be cancelled',
  }),
  (id, { state }) => ({
    isInvalid: state !== WithdrawalState.pending,
    error: `Withdrawal request with id ${id} is in ${state} state and cannot be cancelled`,
  }),
]

export async function cancelFiatWithdrawal({ id, transaction }: WithdrawalCancelParams) {
  const withdrawalRequest = await findWithdrawalRequestById(id)

  const validationResults = validators.map(validate => validate(id, withdrawalRequest || {}))
  const failedValidations = validationResults.filter(({ isInvalid }) => isInvalid)

  if (failedValidations.length > 0) {
    logger.warn(`Withdrawal cancellation for ${id} failed validation`)
    failedValidations.forEach(({ error }) => logger.warn(error))

    throw new ValidationError(failedValidations[0].error)
  }

  logger.debug(`Cancelling Fiat Withdrawal ${id}`)
  return cancelWithdrawalRequest(withdrawalRequest!, transaction as any)
}
