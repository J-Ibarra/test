import { Wallet } from 'ethers'
import { JsonRpcProvider } from 'ethers/providers'
import Web3 from 'web3'
import { Environment } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'

export const CONFIG = {
  [Environment.development]: {
    url: 'http://localhost:8545/',
    networkId: 5777,
    mnemonic: 'insane amazing seminar sniff apology pioneer rib entire vocal north explain wealth',
  },
}

let web3: Web3
const logger = Logger.getInstance('network_traffic', 'eth')

setInterval(startNetworkTraffic, 1000)

export async function startNetworkTraffic() {
  const selectedHost = CONFIG[Environment.development].url
  web3 = new Web3(new Web3.providers.HttpProvider(selectedHost))

  const account1 = getAccount(10)
  const account2 = getAccount(11)

  const transaction = await web3.eth.accounts.privateKeyToAccount(account1.privateKey).signTransaction({
    to: account2.address,
    value: web3.utils.toWei('1', 'ether'),
    gas: 21000,
    gasPrice: await web3.eth.getGasPrice(),
  })
  await web3.eth.sendSignedTransaction(transaction.rawTransaction)
  logger.info('Transfer from Account1 to Account2 complete')

  const transaction2 = await web3.eth.accounts.privateKeyToAccount(account2.privateKey).signTransaction({
    to: account1.address,
    value: web3.utils.toWei('1', 'ether'),
    gas: 21000,
    gasPrice: await web3.eth.getGasPrice(),
  })
  await web3.eth.sendSignedTransaction(transaction2.rawTransaction)
  logger.info('Transfer from Account2 to Account1 complete')
}

export function getAccount(accountIndex: number) {
  return Wallet.fromMnemonic(CONFIG[Environment.development].mnemonic, getAccountPath(accountIndex)).connect(
    new JsonRpcProvider({ url: CONFIG[Environment.development].url, allowInsecure: true }),
  )
}

function getAccountPath(accountIndex: number) {
  return `m/44'/60'/0'/0/${accountIndex}`
}
