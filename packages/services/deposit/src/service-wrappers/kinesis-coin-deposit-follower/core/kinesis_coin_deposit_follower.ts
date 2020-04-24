import * as Sequelize from 'sequelize'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { Logger } from '@abx-utils/logging'
import { Kinesis, DepositTransaction } from '@abx-utils/blockchain-currency-gateway'
import { 
  getBlockchainFollowerDetailsForCurrency, 
  updateBlockchainFollowerDetailsForCurrency, 
  pushRequestForProcessing, 
  NEW_KINESIS_DEPOSIT_REQUESTS_QUEUE_URL,
} from '../../../core'
import { BlockchainFollowerDetails } from '@abx-types/deposit'
import { storeDepositRequests } from '../../../core'
import { CurrencyCode, CurrencyBoundary, Environment } from '@abx-types/reference-data'
import { findCurrencyForCode } from '@abx-service-clients/reference-data'
import { convertTransactionToDepositRequest } from '../../../core'
import {
  createPublicKeyToDepositorDetailsMap,
  DepositAddressAccountStatusPair,
  getBoundaryAndLatestFiatValuePair,
} from './kinesis_coin_deposit_follower_helpers'

const logger = Logger.getInstance('services', 'kinesis_coin_deposit_follower')

export async function triggerKinesisCoinDepositFollower(onChainCurrencyGateway: Kinesis, currencyCode: CurrencyCode) {
  try {
    const { id: currencyId } = await findCurrencyForCode(currencyCode)

    const { lastEntityProcessedIdentifier } = (await getBlockchainFollowerDetailsForCurrency(currencyId)) as BlockchainFollowerDetails
    const depositCandidateOperations = await onChainCurrencyGateway.getLatestTransactions(lastEntityProcessedIdentifier)

    if (depositCandidateOperations.length > 0) {
      logger.debug(`Found ${depositCandidateOperations.length} ${currencyCode} deposit candidate transactions`)
      const { fiatValueOfOneCryptoCurrency, currencyBoundary } = await getBoundaryAndLatestFiatValuePair(currencyCode)
      const publicKeyToDepositAddress = await createPublicKeyToDepositorDetailsMap(depositCandidateOperations)

      await wrapInTransaction(sequelize, null, async (t) => {
        await handleKinesisPaymentOperations(depositCandidateOperations, publicKeyToDepositAddress, fiatValueOfOneCryptoCurrency, currencyBoundary, t)

        await updateBlockchainFollowerDetailsForCurrency(currencyId, depositCandidateOperations[0].txHash)
      })
    }
  } catch (e) {
    logger.error('Ran into an error while processing kinesis payment operations')
    logger.error(e)
  }

  retriggerOnTimeout(onChainCurrencyGateway, currencyCode)
}

export async function handleKinesisPaymentOperations(
  depositCandidateOperations: DepositTransaction[],
  publicKeyToDepositAddress: Map<string, DepositAddressAccountStatusPair>,
  fiatValueOfOneCryptoCurrency: number,
  currencyBoundary: CurrencyBoundary,
  t: Sequelize.Transaction,
) {
  const depositTransactions = depositCandidateOperations.filter(({ to }) => publicKeyToDepositAddress.has(to!))

  if (depositTransactions.length > 0) {
    logger.info(`${depositTransactions.length} of the ${depositCandidateOperations.length} ${currencyBoundary.currencyCode} candidates are valid`)
    const depositRequests = depositTransactions.map((depositTransaction) =>
      mapDepositTransactionToDepositRequest(depositTransaction, publicKeyToDepositAddress, fiatValueOfOneCryptoCurrency, currencyBoundary),
    )

    const storedDepositRequests = await storeDepositRequests(depositRequests, t)
    logger.debug(`${depositRequests.length} new ${currencyBoundary.currencyCode} deposit requests stored`)

    await pushRequestForProcessing(storedDepositRequests, NEW_KINESIS_DEPOSIT_REQUESTS_QUEUE_URL)
    logger.debug(`${storedDepositRequests.length} new ${currencyBoundary.currencyCode} deposit requests pushed for processing`)
  }
}

function mapDepositTransactionToDepositRequest(
  depositTransaction: DepositTransaction,
  publicKeyToDepositAddress: Map<string, DepositAddressAccountStatusPair>,
  fiatValueOfOneCryptoCurrency: number,
  currencyBoundary: CurrencyBoundary,
) {
  const { depositAddress } = publicKeyToDepositAddress.get(depositTransaction.to!)!

  return convertTransactionToDepositRequest(depositAddress, depositTransaction, fiatValueOfOneCryptoCurrency, currencyBoundary)
}

function retriggerOnTimeout(onChainCurrencyGateway: Kinesis, currencyCode: CurrencyCode) {
  if (process.env.NODE_ENV !== Environment.test) {
    setTimeout(() => triggerKinesisCoinDepositFollower(onChainCurrencyGateway, currencyCode))
  }
}
