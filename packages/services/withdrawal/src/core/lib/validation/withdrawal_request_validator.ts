import { Account } from '@abx-types/account'
import { BalanceTypeObj } from '@abx-types/balance'
import { CurrencyBoundary } from '@abx-types/reference-data'
import { Logger } from '@abx/logging'
import { CurrencyManager } from '@abx-query-libs/blockchain-currency-gateway'
import { ValidationError } from '@abx-types/error'
import { Currency, CurrencyCode } from '@abx-types/reference-data'
import { cryptoWithdrawalAddressNotContractAddress, cryptoWithdrawalRequestValidators } from './crypto_validators'
import { fiatWithdrawalRequestValidators } from './fiat_validators'
import { isFiatCurrency, findBoundaryForCurrency } from '@abx-service-clients/reference-data'

export interface WithdrawalValidationParams {
  currency: Currency
  currencyCode: CurrencyCode
  amount: number
  availableBalance: BalanceTypeObj
  account: Account
  manager: CurrencyManager
  memo?: string
  address?: string
  feeCurrency: Currency
  feeCurrencyAvailableBalance: BalanceTypeObj
  feeAmount: number
}

export interface CompleteValidationParams extends WithdrawalValidationParams {
  boundaryForCurrency: CurrencyBoundary
}

interface WithdrawalValidationResult {
  isInvalid: boolean
  error: string
}
export type WithdrawalRequestValidator = (WithdrawalValidationParams) => Promise<WithdrawalValidationResult> | WithdrawalValidationResult

const logger = Logger.getInstance('withdrawal_request_validator', 'validateWithdrawal')

export async function validateWithdrawal(validationParams: WithdrawalValidationParams) {
  const { address, currencyCode, manager } = validationParams

  const validators: WithdrawalRequestValidator[] = isFiatCurrency(currencyCode) ? fiatWithdrawalRequestValidators : cryptoWithdrawalRequestValidators

  const isAddressAContractAddress = await cryptoWithdrawalAddressNotContractAddress(manager, currencyCode, address)
  if (!isAddressAContractAddress) {
    logger.warn(`Withdrawal request for account ${validationParams.account.id} failed validation`)
    logger.warn(
      `The ETH address you provided is a contract address. At this point we are unable to withdraw your ETH to a contract address. Please submit your request with a different ETH address`,
    )
    throw new ValidationError(
      'The ETH address you provided is a contract address. At this point we are unable to withdraw your ETH to a contract address. Please submit your request with a different ETH address',
    )
  }

  const boundaryForCurrency = await findBoundaryForCurrency(validationParams.currencyCode)
  const validationResults = await Promise.all(validators.map(validate => validate({ ...validationParams, boundaryForCurrency })))
  const failedValidations = validationResults.filter(({ isInvalid }) => isInvalid)

  if (failedValidations.length > 0) {
    logger.warn(`Withdrawal request for account ${validationParams.account.id} failed validation`)
    failedValidations.forEach(({ error }) => logger.warn(error))

    throw new ValidationError(failedValidations[0].error)
  }
}
