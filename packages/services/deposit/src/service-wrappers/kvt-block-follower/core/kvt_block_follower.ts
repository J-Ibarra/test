import * as Sequelize from 'sequelize'
import { EventLog } from 'web3/types'
import { findBoundaryForCurrency, findCurrencyForCode } from '@abx-service-clients/reference-data'
import { CurrencyBoundary, CurrencyCode } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager, KvtOnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'
import {
  getBlockchainFollowerDetailsForCurrency,
  updateBlockchainFollowerDetailsForCurrency,
  convertTransactionToDepositRequest,
  FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION,
} from '../../../core'
import { BlockchainFollowerDetails, DepositAddress } from '@abx-types/deposit'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { findKycOrEmailVerifiedDepositAddresses, storeDepositRequests } from '../../../core'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'

const ETHEREUM_BLOCK_DELAY = 12

const logger = Logger.getInstance('services', 'kvt_block_follower')

const testEnvironments = ['test', 'development']

export async function triggerKVTBlockFollower(onChainCurrencyManager: CurrencyManager) {
  const kvt: KvtOnChainCurrencyGateway = (await onChainCurrencyManager.getCurrencyFromTicker(CurrencyCode.kvt)) as KvtOnChainCurrencyGateway

  try {
    const { id: currencyId } = await findCurrencyForCode(CurrencyCode.kvt)
    const depositAddresses = await findKycOrEmailVerifiedDepositAddresses(currencyId)
    const { lastBlockNumberProcessed } = (await getBlockchainFollowerDetailsForCurrency(currencyId)) as BlockchainFollowerDetails

    if (Number(lastBlockNumberProcessed) === 0 && !testEnvironments.includes(process.env.NODE_ENV as string)) {
      throw new Error('Waiting for lastProcessedBlockNumber to be updated from 0')
    }

    const currentBlockNumber = await kvt.getLatestBlockNumber()
    let blockDifference = currentBlockNumber - ETHEREUM_BLOCK_DELAY - Number(lastBlockNumberProcessed)

    // Only process 5 blocks at a time
    if (blockDifference > 5) {
      blockDifference = 5
    }

    const [fiatValueOfOneCryptoCurrency, currencyBoundary] = await Promise.all([
      calculateRealTimeMidPriceForSymbol(`${kvt.ticker}_${FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION}`),
      findBoundaryForCurrency(kvt.ticker),
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

            const KVTEvents = await kvt.contract.getPastEvents('Transfer', { fromBlock: blockNumberToProcess, toBlock: blockNumberToProcess })
            await handleKVTTransactions(KVTEvents, publicKeyToDepositAddress, kvt, fiatValueOfOneCryptoCurrency, currencyBoundary, t)
          })
        }),
      )
      await updateBlockchainFollowerDetailsForCurrency(currencyId, (lastBlockNumberProcessed + blockDifference).toString())
    }
  } catch (e) {
    logger.error('Ran into an error while processing block data')
    logger.error(e)
  }

  setTimeout(() => triggerKVTBlockFollower(onChainCurrencyManager), 10_000)
}

export async function handleKVTTransactions(
  KVTEvents: EventLog[],
  publicKeyToDepositAddress: Map<string, DepositAddress>,
  onChainCurrencyGateway: KvtOnChainCurrencyGateway,
  fiatValueOfOneCryptoCurrency: number,
  currencyBoundary: CurrencyBoundary,
  t: Sequelize.Transaction,
) {
  const potentialDepositTransactions = KVTEvents.reduce((acc, event) => {
    return publicKeyToDepositAddress.has(event.returnValues.to)
      ? acc.concat({ event, depositAddress: publicKeyToDepositAddress.get(event.returnValues.to)! })
      : acc
  }, [] as { event: EventLog; depositAddress: DepositAddress }[])

  if (potentialDepositTransactions.length > 0) {
    logger.debug(`Found Potential Deposits: ${potentialDepositTransactions}`)
    const depositRequests = potentialDepositTransactions.map(tx => {
      const depositTransaction = onChainCurrencyGateway.apiToDepositTransaction(tx.event)
      return convertTransactionToDepositRequest(tx.depositAddress, depositTransaction, fiatValueOfOneCryptoCurrency, currencyBoundary)
    })
    await storeDepositRequests(depositRequests, t)
  }
}
