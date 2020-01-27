import { Wallet } from 'ethers'
import { JsonRpcProvider } from 'ethers/providers'
import Web3 from 'web3'
import Contract from 'web3/eth/contract'
import { Environment } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import KinesisVelocityToken from './contracts/KinesisVelocityToken.json'

export const CONFIG = {
  [Environment.development]: {
    url: 'http://localhost:8545/',
    networkId: 5777,
    mnemonic: 'insane amazing seminar sniff apology pioneer rib entire vocal north explain wealth',
  },
}

const abi = KinesisVelocityToken.abi
const byteCode = KinesisVelocityToken.bytecode

let owner: Wallet
let admin: Wallet
let holdings: Wallet

let contract: Contract

const logger = Logger.getInstance('local_development', 'kvt')

export async function deployContractToDevelopment() {
  const selectedHost = CONFIG[Environment.development].url
  try {
    owner = getAccount(0)
    admin = getAccount(1)
    holdings = getAccount(2)

    const web3 = new Web3(new Web3.providers.HttpProvider(selectedHost))
    const tokenContract = new web3.eth.Contract(abi)
    const tokenTransaction = tokenContract.deploy({
      data: byteCode,
      arguments: [],
    })

    const gasPrice = await web3.eth.getGasPrice()
    const gasLimit = await tokenTransaction.estimateGas()

    const result = await tokenTransaction.send({
      from: owner.address,
      gasPrice,
      gas: gasLimit,
    })

    tokenContract.options.address = result.options.address
    contract = tokenContract

    logger.info('Waiting for node to be ready')
    setTimeout(() => {
      setupTransferable()
    }, 2000)
  } catch (error) {
    throw error
  }
}

export async function setupTransferable() {
  logger.info('Transferable tokens can be found at the following address')
  logger.info(`Admin Private Key: ${admin.privateKey}`)
  logger.info('Deposited Tokens and Eth will be deposited to the following address')
  logger.info(`KVT Holdings PrivKey: ${holdings.privateKey}`)

  await addAdmin(admin.address)

  await setTransferable(admin.address, true)
  await approveTransferableToggle(owner.address)
  await transferAllToAdmin()

  logger.info('Confirming balance at token holder')
  logger.info(`KVT Balance at Admin: ${await kvtBalance(admin.address)}`)
}

export async function transferAllToAdmin() {
  // Initiate the transfer
  const adminTransferEstimateGas = await contract.methods.adminTransfer(admin.address, 300000).estimateGas({
    from: owner.address,
  })
  await contract.methods.adminTransfer(admin.address, 300000).send({
    from: owner.address,
    gas: adminTransferEstimateGas,
    gasPrice: contract.options.gasPrice,
  })

  const transfers = await contract.methods.getTransfers().call()

  // Approve the transfer
  const approveTransferEstimateGas = await contract.methods.approveTransfer(transfers[0]).estimateGas({
    from: admin.address,
  })
  await contract.methods.approveTransfer(transfers[0]).send({
    from: admin.address,
    gas: approveTransferEstimateGas,
    gasPrice: contract.options.gasPrice,
  })
}

export async function kvtBalance(address: string) {
  const bigBalance = await contract.methods.balanceOf(address).call()
  return Number(bigBalance)
}

export async function addAdmin(address: string) {
  const estimateGas = await contract.methods.setAdmin(address).estimateGas({
    from: owner.address,
  })
  return contract.methods.setAdmin(address).send({
    from: owner.address,
    gas: estimateGas,
    gasPrice: contract.options.gasPrice,
  })
}

export function getAccount(accountIndex: number) {
  return Wallet.fromMnemonic(CONFIG[Environment.development].mnemonic, getAccountPath(accountIndex)).connect(
    new JsonRpcProvider({ url: CONFIG[Environment.development].url, allowInsecure: true }),
  )
}

function getAccountPath(accountIndex: number) {
  return `m/44'/60'/0'/0/${accountIndex}`
}

export async function setTransferable(from: string, toState: boolean) {
  const estimateGas = await contract.methods.setTransferable(toState).estimateGas({
    from,
  })
  return contract.methods.setTransferable(toState).send({
    from,
    gas: estimateGas,
    gasPrice: contract.options.gasPrice,
  })
}

export async function approveTransferableToggle(from: string) {
  const estimateGas = await contract.methods.approveTransferableToggle().estimateGas({
    from,
  })
  await contract.methods.approveTransferableToggle().send({
    from,
    gas: estimateGas,
    gasPrice: contract.options.gasPrice,
  })
}

setTimeout(deployContractToDevelopment, 5000)
