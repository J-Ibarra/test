import * as Sequelize from 'sequelize'
import { Block, Transaction } from 'web3/eth/types'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager, Ethereum } from '@abx-utils/blockchain-currency-gateway'
import {
  getBlockchainFollowerDetailsForCurrency,
  updateBlockchainFollowerDetailsForCurrency,
  pushRequestForProcessing,
  NEW_ETH_AND_KVT_DEPOSIT_REQUESTS_QUEUE_URL,
  findDepositRequestsWithInsufficientAmount,
} from '../../../core'
import { BlockchainFollowerDetails, DepositAddress, DepositRequestStatus, DepositRequest } from '@abx-types/deposit'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { findKycOrEmailVerifiedDepositAddresses, storeDepositRequests } from '../../../core'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'
import { CurrencyCode, CurrencyBoundary } from '@abx-types/reference-data'
import { WithdrawalRequest } from '@abx-types/withdrawal'
import { findWithdrawalRequestsForTransactionHashes } from '@abx-service-clients/withdrawal'
import { findCurrencyForCode, findBoundaryForCurrency } from '@abx-service-clients/reference-data'
import { FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION, convertTransactionToDepositRequest } from '../../../core'

const ETHEREUM_BLOCK_DELAY = 5

const logger = Logger.getInstance('services', 'ethereum_block_follower')

const testEnvironments = ['test', 'development']

export async function triggerEthereumBlockFollower(onChainCurrencyManager: CurrencyManager) {
  const ethereum: Ethereum = (await onChainCurrencyManager.getCurrencyFromTicker(CurrencyCode.ethereum)) as Ethereum

  try {
    const { id: currencyId } = await findCurrencyForCode(CurrencyCode.ethereum)
    const depositAddresses = await findKycOrEmailVerifiedDepositAddresses(currencyId)
    const { lastEntityProcessedIdentifier } = (await getBlockchainFollowerDetailsForCurrency(currencyId)) as BlockchainFollowerDetails

    if (Number(lastEntityProcessedIdentifier) === 0 && !testEnvironments.includes(process.env.NODE_ENV as string)) {
      throw new Error('Waiting for lastProcessedBlockNumber to be updated from 0')
    }

    const currentBlockNumber = await ethereum.getLatestBlockNumber()
    let blockDifference = currentBlockNumber - ETHEREUM_BLOCK_DELAY - Number(lastEntityProcessedIdentifier)

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
          await wrapInTransaction(sequelize, null, async (t) => {
            const blockNumberToProcess = Number(lastEntityProcessedIdentifier) + (index + 1)
            logger.debug(`Processing Block #${blockNumberToProcess}`)

            const blockData = (await ethereum.getBlockData(blockNumberToProcess)) as Block
            if (blockData) {
              const transactions = blockData.transactions.filter((tx) => tx.to && tx.to !== process.env.KVT_CONTRACT_ADDRESS)
              await handleEthereumTransactions(transactions, publicKeyToDepositAddress, ethereum, fiatValueOfOneCryptoCurrency, currencyBoundary, t)
            } else {
              throw new Error('Could not find block data, will try again in 10 seconds')
            }
          })
        }),
      )
      await updateBlockchainFollowerDetailsForCurrency(currencyId, (Number(lastEntityProcessedIdentifier) + blockDifference).toString())
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
  const potentialDepositTransactions = await findPotentialTransactions(
    transactions, publicKeyToDepositAddress, onChainCurrencyGateway)
  if (potentialDepositTransactions.length > 0) {
    logger.debug(`Found Potential Deposits: ${potentialDepositTransactions}`)

    const depositRequestsWithInsufficientAmount = await Promise.all(
      potentialDepositTransactions.map(({ depositAddress }) => findDepositRequestsWithInsufficientAmount(depositAddress.id!)),
    )
    const addressIdToDepositRequestsWithInsufficientAmount = depositRequestsWithInsufficientAmount.reduce(
      (acc, depositRequests) => (depositRequests.length > 0 ? acc.set(depositRequests[0].depositAddressId!, depositRequests) : acc),
      new Map<number, DepositRequest[]>(),
    )

    const depositRequests = await Promise.all(
      potentialDepositTransactions.map((tx) => {
        const depositTransaction = onChainCurrencyGateway.apiToDepositTransaction(tx.tx)
        return convertTransactionToDepositRequest(
          tx.depositAddress,
          depositTransaction,
          fiatValueOfOneCryptoCurrency,
          currencyBoundary,
          DepositRequestStatus.pendingHoldingsTransaction,
          addressIdToDepositRequestsWithInsufficientAmount.get(tx.depositAddress.id!),
        )
      }),
    )

    const storedDepositRequests = await storeDepositRequests(depositRequests, t)
    const depositRequestsWithSufficientAmount = storedDepositRequests.filter((req) => req.status !== DepositRequestStatus.insufficientAmount)

    if (depositRequestsWithSufficientAmount.length > 0) {
      await pushRequestForProcessing(depositRequestsWithSufficientAmount, NEW_ETH_AND_KVT_DEPOSIT_REQUESTS_QUEUE_URL)
    }
  }
}



/**
 *  We will only consider transactions which:
      are received by a deposit address that we monitor
      do not come from a kinesis holdings, unless there is a corresponding withdrawal for that
    In the case of ERC20 tokens we want to discard any transaction which were made to cover the ETH tx fee,
    from the deposit address into the holdings wallet.
 */
async function findPotentialTransactions(
  transactions: Transaction[],
  publicKeyToDepositAddress: Map<string, DepositAddress>,
  onChainCurrencyGateway: Ethereum,
) {
  const potentialTransactionHashes = transactions
    .filter((transaction) => publicKeyToDepositAddress.has(transaction.to))
    .map((transaction) => transaction.hash)

  if (potentialTransactionHashes.length > 0) {
    const withdrawalRequests = await findWithdrawalRequestsForTransactionHashes(potentialTransactionHashes)
    const holdingsAddress = await onChainCurrencyGateway.getHoldingPublicAddress()
    
    return transactions.reduce(
      (acc, transaction) =>
        isPotentialTransaction(transaction, publicKeyToDepositAddress, withdrawalRequests, holdingsAddress)
          ? acc.concat({ tx: transaction, depositAddress: publicKeyToDepositAddress.get(transaction.to)! })
          : acc,
      [] as { tx: Transaction, depositAddress: DepositAddress }[],
    )
  } else {
    return [] as { tx: Transaction; depositAddress: DepositAddress }[]
  }
}

function isPotentialTransaction(
  transaction: Transaction,
  publicKeyToDepositAddress: Map<string, DepositAddress>,
  withdrawalRequests: WithdrawalRequest[],
  holdingsAddress: string
) {
  if (!publicKeyToDepositAddress.has(transaction.to)) {
    return false
  } else if (transaction.from !== holdingsAddress) {
    return true
  }

  // potential if there is an existing withdrawal request
  const depositCreatedFromWithdrawalRequest = withdrawalRequests.some(({ txHash }) => txHash === transaction.hash)

  return depositCreatedFromWithdrawalRequest
}