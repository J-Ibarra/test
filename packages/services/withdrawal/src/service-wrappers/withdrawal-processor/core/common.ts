import { CurrencyCode } from '@abx-types/reference-data'
import { isErc20Token } from '../../../core'
import { QueueConsumerOutput } from '@abx-utils/async-message-consumer'
import { Logger } from '@abx-utils/logging'

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

const logger = Logger.getInstance('withdrawal-processor', 'runHandlerAndSkipDeletionOnFailure')

/**
 * A helper to wrap the actual message handler, adding catch logic which
 * prevent the message from being deleted so that the message can be moved
 * to the DLQ on failure.
 *
 * @param handler the actual message handler function
 */
export async function runHandlerAndSkipDeletionOnFailure(
  handler: (request?: any) => Promise<void | QueueConsumerOutput>,
): Promise<void | QueueConsumerOutput> {
  try {
    const result = await handler()
    return result
  } catch (e) {
    logger.error(`An error has ocurred while processing withdrawal request, skipping deletion.`)
    logger.error(JSON.stringify(e))

    // Skipping deletion so message can be added to DLQ
    return { skipMessageDeletion: true }
  }
}
