import { CurrencyCode } from '@abx-types/reference-data'
import { isErc20Token } from '../../../core'
import { QueueConsumerOutput } from '@abx-utils/async-message-consumer'

export const nativelyImplementedCoins = [CurrencyCode.kag, CurrencyCode.kau, CurrencyCode.ethereum, CurrencyCode.kvt, CurrencyCode.tether]

/** The currencies where we received CryptoAPIs Kinesis holdings address transaction notifications. */
export const holdingsAddressTransactionNotificationEnabledCurrencies = [CurrencyCode.bitcoin]

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

/**
 *
 * @param handler
 */
export async function runHandlerAndSkipDeletionOnFailure(
  handler: (request?: any) => Promise<void | QueueConsumerOutput>,
): Promise<void | QueueConsumerOutput> {
  try {
    const result = await handler()
    return result
  } catch (e) {
    this.logger.error(`An error has ocurred while processing deposit request, skipping deletion.`)

    // Skipping deletion so message can be added to DLQ
    return { skipMessageDeletion: true }
  }
}
