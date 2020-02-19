/** A summary of the key details of a transaction. */
export interface Transaction {
  transactionHash: string
  time: Date
  amount: number
  senderAddress: string
  receiverAddress: string
}
