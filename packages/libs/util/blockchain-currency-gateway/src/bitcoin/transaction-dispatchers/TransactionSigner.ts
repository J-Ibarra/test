import * as bitcoin from 'bitcoinjs-lib'
import { Environment } from '@abx-types/reference-data'

export const mainnetEnvironments = [Environment.production]
const network = mainnetEnvironments.includes(process.env.NODE_ENV as Environment) ? bitcoin.networks.bitcoin : bitcoin.networks.testnet

/** In order to keep all wifs private we use offline/native signing (instead of submitting request to the API provider). */
export function signTransaction(transactionHex: string, senderWif: string): string {
  const transaction = bitcoin.Transaction.fromHex(transactionHex)

  const transactionBuilder = new bitcoin.TransactionBuilder(network)
  const senderKeyPair = bitcoin.ECPair.fromWIF(senderWif, network)

  transaction.outs.forEach((txOut) => {
    transactionBuilder.addOutput(txOut.script, txOut.value)
  })

  transaction.ins.forEach((txIn) => {
    transactionBuilder.addInput(txIn.hash, txIn.index)
  })

  transaction.ins.forEach((_, idx) => {
    transactionBuilder.sign(idx, senderKeyPair)
  })

  return transactionBuilder.build().toHex()
}
