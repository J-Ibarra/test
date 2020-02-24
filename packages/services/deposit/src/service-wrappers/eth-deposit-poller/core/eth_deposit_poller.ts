import util from 'util'

import { Logger } from '@abx-utils/logging'
import { OnChainCurrencyGateway, DepositTransaction } from '@abx-utils/blockchain-currency-gateway'
import { DepositAddress, DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import {
  getPendingDepositRequests,
  storeDepositRequests,
  splitDepositAddressesIntoBatches,
  depositAmountAboveMinimumForCurrency,
  AmountTruncationFunction,
} from '../../../core'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { filterOutAllAddressesWithPositiveBalance } from './deposit_address_filter'
import { findCurrencyForCode, findBoundaryForCurrency, truncateCurrencyDecimals } from '@abx-service-clients/reference-data'
import { createDepositTransaction } from '../../kinesis-and-eth-coin-deposit-processor/core/transaction-fetching-strategies/fetch_once_at_the_start'
import { FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION } from '../../kinesis-and-eth-coin-deposit-processor/core/transaction-fetching-strategies/fetch_for_each_address'

// Etherscan has a hard limit of 5 requests per second
const etherscanRateLimit = 2
const logger = Logger.getInstance('eth_deposit_poller', 'triggerEthAccountPoller')

export async function triggerEthDepositPoller(onChainCurrencyManager: OnChainCurrencyGateway) {
  const { id: currencyId } = await findCurrencyForCode(CurrencyCode.ethereum)
  const addressesWithPositiveBalance = await filterOutAllAddressesWithPositiveBalance(currencyId, onChainCurrencyManager)

  if (addressesWithPositiveBalance.length > 0) {
    const { fiatValueOfOneCryptoCurrency: fiatValueOfOneEth, truncateToCurrencyDP } = await retrieveFiatConversionAndTruncation()

    const depositAddressBatches = await splitDepositAddressesIntoBatches(addressesWithPositiveBalance, etherscanRateLimit)
    const existingDepositRequests = await getPendingDepositRequests(currencyId)

    logger.debug(`Deposit address batches to process: ${JSON.stringify(depositAddressBatches)}`)

    for (const depositAddressBatch of depositAddressBatches) {
      try {
        // Making sure we don't go over the ETHERSCAN 5 requests per second limit
        await Promise.all([
          ...depositAddressBatch.map(depositAddress =>
            recordNewEthDepositsForAddress(depositAddress, existingDepositRequests, onChainCurrencyManager, fiatValueOfOneEth, truncateToCurrencyDP),
          ),
          waitOneSecond(),
        ])
      } catch (e) {
        logger.info(`Error ocurred while trying to retrieve deposit requests for addresses ${depositAddressBatch.map(({ publicKey }) => publicKey)}`)
        logger.error(JSON.stringify(util.inspect(e)))
      }
    }
  }

  setTimeout(() => triggerEthDepositPoller(onChainCurrencyManager), 5000)
}

async function retrieveFiatConversionAndTruncation() {
  const fiatValueOfOneCryptoCurrency = await calculateRealTimeMidPriceForSymbol(`${CurrencyCode.ethereum}_${FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION}`)
  const currencyBoundary = await findBoundaryForCurrency(CurrencyCode.ethereum)
  const truncateToCurrencyDP = truncateCurrencyDecimals(currencyBoundary) as any

  return { fiatValueOfOneCryptoCurrency, truncateToCurrencyDP }
}

async function recordNewEthDepositsForAddress(
  depositAddress: DepositAddress,
  existingDepositRequests: DepositRequest[],
  onChainCurrencyManager: OnChainCurrencyGateway,
  fiatValueOfOneCryptoCurrency: number,
  truncateToCurrencyDP: AmountTruncationFunction,
): Promise<DepositRequest[]> {
  const previouslyProcessedDepositsForAddress = existingDepositRequests.filter(
    ({ depositAddress: processedDepositAddress }) => depositAddress.id === processedDepositAddress.id,
  )

  try {
    const newDepositTransactions = await onChainCurrencyManager.getDepositTransactions(
      depositAddress.publicKey,
      previouslyProcessedDepositsForAddress.map(({ depositTxHash }) => depositTxHash),
    )

    logger.debug(`New deposit transactions for address ${depositAddress.publicKey}: ${JSON.stringify(newDepositTransactions)}`)

    const transactionsWithAmountBiggerThanMinimumDeposit = newDepositTransactions.filter(({ amount }) =>
      depositAmountAboveMinimumForCurrency(amount, CurrencyCode.ethereum),
    )

    if (transactionsWithAmountBiggerThanMinimumDeposit.length > 0) {
      return persistDepositTransactions(
        depositAddress,
        fiatValueOfOneCryptoCurrency,
        transactionsWithAmountBiggerThanMinimumDeposit,
        truncateToCurrencyDP,
      )
    }
  } catch (e) {
    logger.error(`Unable to get ETH transactions for account ${depositAddress.accountId} and address ${depositAddress.publicKey}`)
    logger.error(JSON.stringify(util.inspect(e)))
  }

  return []
}

function persistDepositTransactions(
  depositAddress: DepositAddress,
  fiatValueOfOneCryptoCurrency: number,
  transactions: DepositTransaction[],
  truncateToCurrencyDP: (n: number) => number,
): Promise<DepositRequest[]> {
  logger.info(
    `Persisting ${transactions.length} new ETH deposits found for account ${depositAddress.accountId} and address ${depositAddress.publicKey}`,
  )

  const depositRequests = transactions.reduce(
    (allRequests, depositTransaction) =>
      allRequests.concat({
        ...createDepositTransaction(depositTransaction, fiatValueOfOneCryptoCurrency, truncateToCurrencyDP),
        status: DepositRequestStatus.pendingHoldingsTransaction,
        depositAddress,
      }) as DepositRequest[],
    [] as DepositRequest[],
  )

  return storeDepositRequests(depositRequests)
}

async function waitOneSecond() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, 1000)
  })
}
