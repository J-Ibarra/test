import { CurrencyCode } from '@abx-types/reference-data'
import { CurrencyManager } from './currency_manager'
import { ValidationError } from '@abx-types/error'

export interface AddressValidationParams {
  code: CurrencyCode
  address: string
}

export async function validateCryptoAddress({ code, address }: AddressValidationParams): Promise<string> {
  const manager = new CurrencyManager()
  const onChainCurrencyGateway = manager.getCurrencyFromTicker(code)

  try {
    const criteria = await Promise.all([
      onChainCurrencyGateway.validateAddress(address),
      onChainCurrencyGateway.validateAddressIsNotContractAddress(address),
    ])

    // validateAddress will error
    // validateAddressIsNotContractAddress just returns a boolean, so we still need to check
    // validateAddress's typing says it should return a bool, so we'll cater for if this may change
    if (criteria.some((result) => !result)) {
      throw new ValidationError(getErrorCryptoAddressMessage({ code, address }))
    }

    return getValidCryptoAddressMessage({ code, address })
  } catch (e) {
    throw new ValidationError(getErrorCryptoAddressMessage({ code, address }))
  }
}

export function getErrorCryptoAddressMessage({ code, address }: AddressValidationParams) {
  return `${code} address ${address} is not valid`
}

export function getValidCryptoAddressMessage({ code, address }: AddressValidationParams) {
  return `${code} address ${address} is valid`
}
