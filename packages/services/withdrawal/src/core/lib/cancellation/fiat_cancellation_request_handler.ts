import { Logger } from '@abx/logging'
import { ValidationError } from '@abx-types/error'
import { isFiatCurrency, findCurrencyForId } from '@abx-service-clients/reference-data'
import { WithdrawalCancelParams, WithdrawalState } from '@abx-types/withdrawal'
import { findWithdrawalRequestById } from '../common/find_withdrawal_request'
import { cancelWithdrawalRequest } from './cancel_withdrawal_request'

const logger = Logger.getInstance('fiat_cancellation_request_handler', 'cancelFiatWithdrawal')

const validators = [
  ({ currency }) => ({
    isInvalid: !currency || !isFiatCurrency(currency.code),
    error: 'Only fiat withdrawals can be cancelled',
  }),
  ({ withdrawalRequest }) => ({
    isInvalid: withdrawalRequest.state !== WithdrawalState.pending,
    error: `Withdrawal request with id ${withdrawalRequest.id} is in ${withdrawalRequest.state} state and cannot be cancelled`,
  }),
]

export async function cancelFiatWithdrawal({ id, transaction }: WithdrawalCancelParams) {
  const withdrawalRequest = await findWithdrawalRequestById(id)

  if (!withdrawalRequest) {
    throw new Error(`No withdrawal request exists with id ${id}`)
  }

  const currency = await findCurrencyForId(withdrawalRequest!.currencyId)

  const validationResults = validators.map(validate => validate({ withdrawalRequest: withdrawalRequest || {}, currency }))
  const failedValidations = validationResults.filter(({ isInvalid }) => isInvalid)

  if (failedValidations.length > 0) {
    logger.warn(`Withdrawal cancellation for ${id} failed validation`)
    failedValidations.forEach(({ error }) => logger.warn(error))

    throw new ValidationError(failedValidations[0].error)
  }

  logger.debug(`Cancelling Fiat Withdrawal ${id}`)
  return cancelWithdrawalRequest(withdrawalRequest!, transaction as any)
}
