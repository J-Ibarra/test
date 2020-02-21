import * as Sequelize from 'sequelize'
import { Block, Transaction } from 'web3/eth/types'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager, Ethereum } from '@abx-utils/blockchain-currency-gateway'
import { getBlockchainFollowerDetailsForCurrency, updateBlockchainFollowerDetailsForCurrency } from 'services/deposit/src/core/get_last_processed_block'
import { BlockchainFollowerDetails, DepositAddress } from '@abx-types/deposit'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { findKycOrEmailVerifiedDepositAddresses, storeDepositRequests } from '../../../core'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'
import { FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION } from '../../deposit-processor/core/transaction-fetching-strategies/fetch_for_each_address'
import { CurrencyCode, CurrencyBoundary } from '@abx-types/reference-data'
import { findCurrencyForCode, findBoundaryForCurrency } from '@abx-service-clients/reference-data'
import { convertTransactionToDepositRequest } from '../../deposit-processor/core/deposit_transactions_fetcher'

const ETHEREUM_BLOCK_DELAY = 12

const logger = Logger.getInstance('services', 'ethereum_block_follower')

const testEnvironments = ['test', 'development']

export async function triggerEthereumBlockFollower(onChainCurrencyManager: CurrencyManager) {
  const ethereum: Ethereum = (await onChainCurrencyManager.getCurrencyFromTicker(CurrencyCode.ethereum)) as Ethereum

  try {
    const { id: currencyId } = await findCurrencyForCode(CurrencyCode.ethereum)
    const depositAddresses = await findKycOrEmailVerifiedDepositAddresses(currencyId)
    const { lastBlockNumberProcessed } = await getBlockchainFollowerDetailsForCurrency(currencyId) as BlockchainFollowerDetails

    if (Number(lastBlockNumberProcessed) === 0 && !testEnvironments.includes(process.env.NODE_ENV as string)) {
      throw new Error('Waiting for lastProcessedBlockNumber to be updated from 0')
    }

    const currentBlockNumber = await ethereum.getLatestBlockNumber()
    let blockDifference = currentBlockNumber - ETHEREUM_BLOCK_DELAY - Number(lastBlockNumberProcessed)

    // Only process 5 blocks at a time
    if (blockDifference > 5) {
      blockDifference = 5
    }

    const [fiatValueOfOneCryptoCurrency, currencyBoundary] = await Promise.all([
      calculateRealTimeMidPriceForSymbol(`${ethereum.ticker}_${FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION}`),
      findBoundaryForCurrency(ethereum.ticker),
    ])

    const publicKeyToDepositAddress = depositAddresses.reduce(
      (acc, depositAddress) => acc.set(depositAddress.publicKey, depositAddress),
      new Map<string, DepositAddress>(),
    )

    if (blockDifference > 0) {
      const blockIterable = Array.from(new Array(blockDifference), (_, i) => i + 1)
      await Promise.all(
        blockIterable.map(async (_, index) => {
          await wrapInTransaction(sequelize, null, async t => {
            const blockNumberToProcess = Number(lastBlockNumberProcessed) + (index + 1)
            logger.debug(`Processing Block #${blockNumberToProcess}`)

            const blockData = (await ethereum.getBlockData(blockNumberToProcess)) as Block
            if (blockData) {
              const transactions = blockData.transactions.filter(tx => tx.to && tx.to !== process.env.KVT_CONTRACT_ADDRESS)
              await handleEthereumTransactions(transactions, publicKeyToDepositAddress, ethereum, fiatValueOfOneCryptoCurrency, currencyBoundary, t)
            } else {
              throw new Error('Could not find block data, will try again in 10 seconds')
            }
          })
        }),
      )
      await updateBlockchainFollowerDetailsForCurrency(currencyId, (lastBlockNumberProcessed + blockDifference).toString())
    }
  } catch (e) {
    logger.error('Ran into an error while processing block data')
    logger.error(e)
  }

  setTimeout(() => triggerEthereumBlockFollower(onChainCurrencyManager), 10_000)
}

export async function handleEthereumTransactions(
  transactions: Transaction[],
  publicKeyToDepositAddress: Map<string, DepositAddress>,
  onChainCurrencyGateway: Ethereum,
  fiatValueOfOneCryptoCurrency: number,
  currencyBoundary: CurrencyBoundary,
  t: Sequelize.Transaction,
) {
  const potentialDepositTransactions = transactions.reduce(
    (acc, transaction) =>
      publicKeyToDepositAddress.has(transaction.to)
        ? acc.concat({ tx: transaction, depositAddress: publicKeyToDepositAddress.get(transaction.to)! })
        : acc,
    [] as { tx: Transaction, depositAddress: DepositAddress }[],
  )

  if (potentialDepositTransactions.length > 0) {
    logger.debug(`Found Potential Deposits: ${potentialDepositTransactions}`)
    const depositRequests = potentialDepositTransactions.map(tx => {
      const depositTransaction = onChainCurrencyGateway.apiToDepositTransaction(tx.tx)
      return convertTransactionToDepositRequest(tx.depositAddress, depositTransaction, fiatValueOfOneCryptoCurrency, currencyBoundary)
    })
    await storeDepositRequests(depositRequests, t)
  }
}
