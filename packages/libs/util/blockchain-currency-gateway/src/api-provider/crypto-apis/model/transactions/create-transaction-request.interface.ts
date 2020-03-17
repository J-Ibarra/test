import { IBtcCreateTransactionRequest } from './btc'
import { IEthCreateTransactionRequest } from './eth/eth-create-transaction.interface'

export type CreateTransactionRequest = IBtcCreateTransactionRequest | IEthCreateTransactionRequest
