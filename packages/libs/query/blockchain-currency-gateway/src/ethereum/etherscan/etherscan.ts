import axios from 'axios'
import { get } from 'lodash'
import { Logger } from '@abx/logging'
import { EtherscanInternalTransaction, EtherscanTransaction, EthscanTransactionType } from './interface'

const logger = Logger.getInstance('etherscan', 'getEthScanTransactionsForAddress')

export async function getEthScanTransactionsForAddress<T = EtherscanInternalTransaction | EtherscanTransaction>(
  address: string,
  transactionType: EthscanTransactionType = EthscanTransactionType.transaction,
): Promise<T[]> {
  const url = `https://${process.env.ETHERSCAN_API_DOMAIN_ROOT}.etherscan.io/api?module=account&action=${transactionType}&address=${address}&startblock=0&apikey=${process.env.ETHERSCAN_API_KEY}`

  logger.info(
    `Making Etherscan request to: https://${process.env.ETHERSCAN_API_DOMAIN_ROOT}.etherscan.io/api?module=account&action=${transactionType}&address=${address}&startblock=0&`,
  )

  try {
    const response = await axios.get(url)

    return get(response, 'data.result', [])
  } catch (e) {
    throw e
  }
}
