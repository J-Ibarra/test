import Decimal from 'decimal.js'

import { Balance } from '@abx-types/balance'
import { CurrencyWithdrawalConfig } from '@abx-types/reference-data'
import { getWithdrawalConfigForCurrency, findCurrencyForId } from '@abx-service-clients/reference-data'
import { Logger } from '@abx-utils/logging'
import { ValidationError } from '@abx-types/error'
import { isFiatCurrency } from '@abx-service-clients/reference-data'
import { CompleteFiatWithdrawalParams, WithdrawalState, CurrencyEnrichedWithdrawalRequest } from '@abx-types/withdrawal'
import { findWithdrawalRequestByAdminRequestId } from '../../common/find_withdrawal_request'
import { completeFiatWithdrawalRequest } from './fiat_withdrawal_completer'
import { findBalance } from '@abx-service-clients/balance'

const logger = Logger.getInstance('fiat_completion_request_handler', 'completeFiatWithdrawal')

type Validator = (
  id: number,
  request: CurrencyEnrichedWithdrawalRequest,
  balance: Balance,
  currencyWithdrawalConfig: CurrencyWithdrawalConfig,
) => { isInvalid: boolean; error?: string }

const validators: Validator[] = [
  (_, { currency }) => ({
    isInvalid: !currency || !isFiatCurrency(currency.code),
    error: `Withdrawal request currency ${currency && currency.code} is not a valid fiat currency`,
  }),
  (id, { state }) => ({
    isInvalid: state !== WithdrawalState.pending,
    error: `Withdrawal request with id ${id} is in a ${state} state and cannot be completed`,
  }),
  (_, { accountId, currency, amount }, balance, { feeAmount }) => {
    logger.info(`${balance.available.value} ${currency}`)

    return {
      isInvalid: balance.available!.value! < new Decimal(amount).plus(feeAmount).toNumber(),
      error: `Insufficient funds in ${
        currency!.code
      } account balance for account ${accountId}, cannot confirm withdrawal for ${amount} + ${feeAmount} fee`,
    }
  },
]

const runValidation = async (id, withdrawalRequest, balanceForAccountAndCurrency, fee) => {
  if (typeof fee !== 'undefined') {
    const withdrawalConfigForCurrency = { feeAmount: fee } as any
    return validators.map(validate => validate(id, withdrawalRequest || ({} as any), balanceForAccountAndCurrency, withdrawalConfigForCurrency))
  } else {
    const withdrawalConfigForCurrency = await getWithdrawalConfigForCurrency({ currencyCode: withdrawalRequest.currency.code })
    return validators.map(validate => validate(id, withdrawalRequest || ({} as any), balanceForAccountAndCurrency, withdrawalConfigForCurrency))
  }
}

export async function completeFiatWithdrawal({ adminRequestId, fee }: CompleteFiatWithdrawalParams) {
  let withdrawalRequest = await findWithdrawalRequestByAdminRequestId(adminRequestId)

  if (!withdrawalRequest) {
    throw new ValidationError(`No withdrawal request exists for admin request id ${adminRequestId}`)
  }

  const withdrawnCurrency = await findCurrencyForId(withdrawalRequest!.currencyId)
  withdrawalRequest = {
    ...withdrawalRequest,
    currency: withdrawnCurrency,
  } as CurrencyEnrichedWithdrawalRequest

  const balanceForAccountAndCurrency = await findBalance(withdrawnCurrency.code, withdrawalRequest.accountId)

  const validationResults = await runValidation(withdrawalRequest.id, withdrawalRequest, balanceForAccountAndCurrency, fee)
  const failedValidations = validationResults.filter(({ isInvalid }) => isInvalid)

  if (failedValidations.length > 0) {
    logger.warn(`Withdrawal completion for ${withdrawalRequest.id} failed validation`)
    failedValidations.forEach(({ error }) => logger.warn(error))

    throw new ValidationError(failedValidations[0].error!)
  }

  logger.info(`Completing Fiat Withdrawal ${withdrawalRequest.id}`)

  return completeFiatWithdrawalRequest({ ...withdrawalRequest, currency: withdrawnCurrency }, fee)
}
