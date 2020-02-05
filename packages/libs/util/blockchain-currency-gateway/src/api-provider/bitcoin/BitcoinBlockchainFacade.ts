import { BlockchainFacade } from '../BlockchainFacade'
import { CryptoAddress, Transaction } from '../model'
import { TransactionResponse } from '../../currency_gateway'

export class BitcoinBlockchainFacade implements BlockchainFacade {
  
  // TODO
  createTransaction(
    senderAddress: Pick<CryptoAddress, 'privateKey' | 'address' | 'wif'>,
    receiverPublicAddress: string,
    amount: number,
  ): Promise<TransactionResponse> {
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

  // TODO
  balanceAt(address: string): Promise<number> {
    console.log(address)
    return null as any
  }

  // TODO
  validateAddress(address: string): Promise<boolean> {
    console.log(address)
    return null as any
  }

  validateAddressIsNotContractAddress(address: string): Promise<boolean> {
    console.log(address)
    return Promise.resolve(false)
  }
}
