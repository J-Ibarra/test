import { IBtcTransactionDetailsRequest, IBtcTransactionDetails } from './btc'
import { ITransactionDetailsRequestEth, IEthereumTransactionDetails } from './eth'

export type ITransactionDetailsRequest = IBtcTransactionDetailsRequest | ITransactionDetailsRequestEth

export type ITransactionDetails = IBtcTransactionDetails | IEthereumTransactionDetails
