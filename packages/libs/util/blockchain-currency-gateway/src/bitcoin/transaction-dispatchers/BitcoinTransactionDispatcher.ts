import { CreateTransactionPayload, MultiTargetTransactionCreationResult } from '../../model'
import { TransactionResponse } from '../../currency_gateway'

export interface BitcoinTransactionDispatcher {
  /**
   * The transaction creation workflow contains 3 steps (3rd step is optional):
   * 1. Calculating fee based on the transaction size
   * 2. Create Transaction -> Sign -> Send on-chain
   * 3. Optionally register a transaction confirmation webhook
   */
  createTransaction(payload: CreateTransactionPayload): Promise<TransactionResponse | MultiTargetTransactionCreationResult>
}
