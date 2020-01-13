import Decimal from 'decimal.js'

import { AccountStatus } from '@abx-types/account'
import { commonWithdrawalRequestValidators } from './common_validators'
import { CompleteValidationParams, WithdrawalRequestValidator } from './withdrawal_request_validator'

export const fiatWithdrawalRequestValidators: WithdrawalRequestValidator[] = [
  ...commonWithdrawalRequestValidators,
  ({ amount, availableBalance, currencyCode, feeAmount }: CompleteValidationParams) => ({
    isInvalid: new Decimal(amount).add(feeAmount).greaterThan(availableBalance.value || 0),
    error: `Withdrawal request amount ${currencyCode}${amount} and fee ${feeAmount} is greater than available balance`,
  }),
  ({ account }: CompleteValidationParams) => ({
    isInvalid: account.status !== AccountStatus.kycVerified,
    error: 'Fiat withdrawals can only be made by accounts whose identity has been verified',
  }),
]
