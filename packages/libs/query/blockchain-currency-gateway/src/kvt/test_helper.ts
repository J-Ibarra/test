import { Wallet } from 'ethers'
import Web3 from 'web3'
import Contract from 'web3/eth/contract'
import { CONFIG } from '.'
import { Environment } from '@abx-types/reference-data'
import { getAccount } from '../ethereum/test_helpers'

/**
 * Deploy the contract to Ethereum Network and put the contract address to env
 * @param abi
 * @param byteCode
 */
export async function deployContract(abi, byteCode) {
  const selectedHost = CONFIG[Environment.test].url
  const selectedAccountIndex = 0
  const account = getAccount(selectedAccountIndex)
  const web3 = new Web3(new Web3.providers.HttpProvider(selectedHost))

  const tokenContract = new web3.eth.Contract(abi)
  const tokenTransaction = tokenContract.deploy({
    data: byteCode,
    arguments: [],
  })

  const gasPrice = await web3.eth.getGasPrice()
  const gasLimit = await tokenTransaction.estimateGas()

  const result = await tokenTransaction.send({
    from: account.address,
    gasPrice,
    gas: gasLimit,
  })
  // Assign the contract address to env
  process.env.KVT_CONTRACT_ADDRESS = result.options.address
}

export class KVTContract {
  public contract: Contract
  private owner: Wallet
  private gasPrice: string

  constructor(contract) {
    this.contract = contract
    this.owner = getAccount(0)
    this.gasPrice = this.contract.options.gasPrice
  }

  public async addAdmin(address: string) {
    const estimateGas = await this.contract.methods.setAdmin(address).estimateGas({
      from: this.owner.address,
    })
    return this.contract.methods.setAdmin(address).send({
      from: this.owner.address,
      gas: estimateGas,
      gasPrice: this.gasPrice,
    })
  }

  public async isAdmin(address: string): Promise<boolean> {
    return this.contract.methods.isAdmin(address).call()
  }

  public async getTransfers() {
    return this.contract.methods.getTransfers().call()
  }

  public async setTransferable(from: string, toState: boolean) {
    const estimateGas = await this.contract.methods.setTransferable(toState).estimateGas({
      from,
    })
    return this.contract.methods.setTransferable(toState).send({
      from,
      gas: estimateGas,
      gasPrice: this.gasPrice,
    })
  }

  public async approveTransferableToggle(from: string) {
    const estimateGas = await this.contract.methods.approveTransferableToggle().estimateGas({
      from,
    })
    await this.contract.methods.approveTransferableToggle().send({
      from,
      gas: estimateGas,
      gasPrice: this.gasPrice,
    })
  }

  public async adminTransfer(from: string, to: string, value) {
    const estimateGas = await this.contract.methods.adminTransfer(to, value).estimateGas({
      from,
    })
    await this.contract.methods.adminTransfer(to, value).send({
      from,
      gas: estimateGas,
      gasPrice: this.gasPrice,
    })
  }

  public async approveTransfer(from: string, approvedTransfer: string) {
    const estimateGas = await this.contract.methods.approveTransfer(approvedTransfer).estimateGas({
      from,
    })
    await this.contract.methods.approveTransfer(approvedTransfer).send({
      from,
      gas: estimateGas,
      gasPrice: this.gasPrice,
    })
  }

  public async quickAccountSetup(admin: string) {
    await this.addAdmin(admin)
    await this.setTransferable(admin, true)
    await this.approveTransferableToggle(this.owner.address)

    for (let i = 2; i < 10; i++) {
      await this.adminTransfer(this.owner.address, getAccount(i).address, 5000)
    }
    const transfers = await this.getTransfers()

    for (const transfer of transfers) {
      await this.approveTransfer(admin, transfer)
    }
  }
}
