import { CurrencyCode } from '@abx-types/reference-data'
import { processWaitingBitcoinWithdrawalRequests } from './bitcoin_batch_withdrawal_transaction_creator'
import { OnChainCurrencyGateway, BitcoinOnChainCurrencyGatewayAdapter } from '@abx-utils/blockchain-currency-gateway'

/**
 * The gateway to processing withdrawal bach requests.
 * This flow is currently only enabled for BTC as we hove specific UTXO
 * edge cases there that require withdrawal request batching.
 */
export async function processWaitingWithdrawalBatch(currency: CurrencyCode, onChainCurrencyGateway: OnChainCurrencyGateway) {
  if (currency !== CurrencyCode.bitcoin) {
    throw new Error(`Batch processing not implemented for ${currency}`)
  }

  await processWaitingBitcoinWithdrawalRequests(onChainCurrencyGateway as BitcoinOnChainCurrencyGatewayAdapter)
}
