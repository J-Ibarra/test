import { CurrencyCode } from '@abx-types/reference-data'
import { processWaitingBitcoinWithdrawalRequests } from './bitcoin_batch_withdrawal_transaction_creator'
import { OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'
import { BitcoinOnChainCurrencyGatewayAdapter } from '@abx-utils/blockchain-currency-gateway/src/bitcoin/BitcoinOnChainCurrencyGatewayAdapter'

export async function processWaitingWithdrawalBatch(currency: CurrencyCode, onChainCurrencyGateway: OnChainCurrencyGateway) {
  if (currency !== CurrencyCode.bitcoin) {
    throw new Error(`Batch processing not implemented for ${currency}`)
  }

  await processWaitingBitcoinWithdrawalRequests(onChainCurrencyGateway as BitcoinOnChainCurrencyGatewayAdapter)
}
