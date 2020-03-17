import { IEthTransactionsFee } from './eth'
import { IBtcTransactionsFee } from './btc'

export type ITransactionsFee = IEthTransactionsFee | IBtcTransactionsFee
