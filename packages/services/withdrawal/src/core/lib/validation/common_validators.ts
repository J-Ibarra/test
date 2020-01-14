import { isNullOrUndefined } from 'util'
import { Account } from '@abx-types/account'
import { getWithdrawalLimit, validateValueWithinBoundary } from '@abx-service-clients/reference-data'
import { ValidationError } from '@abx-types/error'
import { CurrencyCode } from '@abx-types/reference-data'
import { kauConversion as convertToKau } from '../../helper'
import { findNonCancelledWithdrawalsForTheLast24Hours } from '../common/find_withdrawal_request'
import { CompleteValidationParams, WithdrawalRequestValidator } from './withdrawal_request_validator'

export const WITHDRAWAL_MEMO_MAX_LENGTH = 25

export const commonWithdrawalRequestValidators: WithdrawalRequestValidator[] = [
  ({ account }: CompleteValidationParams) => ({
    isInvalid: account.suspended,
    error: 'Account is suspended',
  }),
  ({ currency, currencyCode }: CompleteValidationParams) => ({
    isInvalid: !currency,
    error: `Currency ${currencyCode} not supported`,
  }),
  ({ amount }: CompleteValidationParams) => ({
    isInvalid: amount <= 0,
    error: `Withdrawal request amount ${amount} must be greater than 0`,
  }),
  ({ amount, currencyCode, boundaryForCurrency }: CompleteValidationParams) => {
    const boundaryValidationResult = validateValueWithinBoundary(amount, boundaryForCurrency)

    return {
      isInvalid: !boundaryValidationResult.valid,
      error: `The amount ${amount} ${currencyCode} is invalid, it must be ${boundaryValidationResult.expects}`,
    }
  },
  ({ memo }: CompleteValidationParams) => ({
    isInvalid: !!memo && memo.length > WITHDRAWAL_MEMO_MAX_LENGTH,
    error: `Withdrawal request memo must not be more than than 25 characters in length`,
  }),
  async ({ account, amount, currencyCode }: CompleteValidationParams) => {
    const amountWithinDailyAllowance = await isWithdrawalRequestWithinDailyLimit({ account, amount, currencyCode })

    return {
      isInvalid: !amountWithinDailyAllowance,
      error: `Withdrawal request for ${amount} ${currencyCode} exceeds the daily withdrawal limit for account ${account.users![0].email}`,
    }
  },
]

export async function isWithdrawalRequestWithinDailyLimit({
  account,
  amount,
  currencyCode,
}: {
  account: Account
  amount: number
  currencyCode: CurrencyCode
}) {
  const [amountInKau, remainingDailyAllowance] = await Promise.all([
    convertToKau(currencyCode, amount),
    getRemainingDailyWithdrawalAmoutForAccount(account),
  ])

  const amountInKauNumber = Number(amountInKau)

  return amountInKauNumber <= remainingDailyAllowance
}

export async function getRemainingDailyWithdrawalAmoutForAccount(account: Account): Promise<number> {
  const withdrawalLimit = await getWithdrawalLimit(account.status)

  if (isNullOrUndefined(withdrawalLimit)) {
    throw new ValidationError(`The Withdrawal limit is not found in the exchange config or account status isn\'t present in the db`)
  }

  const unCancelledWithdrawalsFromLast24Hours = await findNonCancelledWithdrawalsForTheLast24Hours(account.id)
  const sumOfKauConversion: number = unCancelledWithdrawalsFromLast24Hours.reduce((accumulator, { kauConversion }) => kauConversion + accumulator, 0)

  return withdrawalLimit - sumOfKauConversion
}
