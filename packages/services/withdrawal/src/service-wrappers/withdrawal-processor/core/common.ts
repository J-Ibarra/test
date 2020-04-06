import { CurrencyCode } from '@abx-types/reference-data'
import { isErc20Token } from '../../../core'

export const nativelyImplementedCoins = [CurrencyCode.kag, CurrencyCode.kau, CurrencyCode.ethereum, CurrencyCode.kvt, CurrencyCode.tether]

/**
 * Responsible for returning the actual coin that the transaction fee is paid into.
 * For example, for ERC20 tokens running on the Ethereum blockchain, the transaction fees are paid in ETH.
 *
 * In that scenario, since Kinesis covers the on-chain withdrawal fee, we want to reduce the ETH revenue balance.
 * @param currency the currency to return the transaction fee for
 */
export function getTransactionFeeCurrency(currency: CurrencyCode) {
  if (isErc20Token(currency)) {
    return CurrencyCode.ethereum
  }

  return currency
}
