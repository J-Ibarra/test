import { BlockchainFacade } from './BlockchainFacade'
import { CryptoAddress, Transaction } from './model'

export class BitcoinBlockchainFacade implements BlockchainFacade {
  // TODO
  createTransaction(senderAddress: CryptoAddress, receiverPublicAddress: string, amount: number): Promise<Transaction> {
    console.log(senderAddress, receiverPublicAddress, amount)
    return null as any
  }

  // TODO
  getTransaction(transactionHash: string): Promise<Transaction> {
    console.log(transactionHash)
    return null as any
  }

  // TODO
  generateAddress(): Promise<CryptoAddress> {
    return null as any
  }
}
