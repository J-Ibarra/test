import * as Sequelize from 'sequelize'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager, Kinesis } from '@abx-utils/blockchain-currency-gateway'
import { getBlockchainFollowerDetailsForCurrency } from '../../../core'
import { BlockchainFollowerDetails, DepositAddress } from '@abx-types/deposit'
import { findKycOrEmailVerifiedDepositAddresses, storeDepositRequests } from '../../../core'
import { CurrencyCode, CurrencyBoundary } from '@abx-types/reference-data'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'
import { findCurrencyForCode, findBoundaryForCurrency } from '@abx-service-clients/reference-data'
import { FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION, convertTransactionToDepositRequest } from '../../../core'
import { PaymentOperationRecord } from 'js-kinesis-sdk'

const logger = Logger.getInstance('services', 'kinesis_coin_deposit_follower')

export async function triggerKinesisCoinDepositFollower(onChainCurrencyManager: CurrencyManager, currencyCode: CurrencyCode) {
  const currency: Kinesis = (await onChainCurrencyManager.getCurrencyFromTicker(currencyCode)) as Kinesis

  try {
    const { id: currencyId } = await findCurrencyForCode(currencyCode)

    const depositAddresses = await findKycOrEmailVerifiedDepositAddresses(currencyId)
    const publicKeyToDepositAddress = depositAddresses.reduce(
      (acc, depositAddress) => acc.set(depositAddress.publicKey, depositAddress),
      new Map<string, DepositAddress>(),
    )

    const { lastEntityProcessedIdentifier } = (await getBlockchainFollowerDetailsForCurrency(currencyId)) as BlockchainFollowerDetails
    const latestPaymentOperations = await currency.getLatestPaymentOperations(lastEntityProcessedIdentifier)

    const [fiatValueOfOneCryptoCurrency, currencyBoundary] = await Promise.all([
      calculateRealTimeMidPriceForSymbol(`${currency.ticker}_${FIAT_CURRENCY_FOR_DEPOSIT_CONVERSION}`),
      findBoundaryForCurrency(currency.ticker),
    ])

    await wrapInTransaction(sequelize, null, t => {
      return this.handleKinesisPaymentOperations(
        latestPaymentOperations,
        publicKeyToDepositAddress,
        currency,
        fiatValueOfOneCryptoCurrency,
        currencyBoundary,
        t,
      )
    })
  } catch (e) {
    logger.error('Ran into an error while processing kinesis payment operations')
    logger.error(e)
  }

  setTimeout(() => triggerKinesisCoinDepositFollower(onChainCurrencyManager, currencyCode), 5_000)
}

export async function handleKinesisPaymentOperations(
  paymentOperations: PaymentOperationRecord[],
  publicKeyToDepositAddress: Map<string, DepositAddress>,
  onChainCurrencyGateway: Kinesis,
  fiatValueOfOneCryptoCurrency: number,
  currencyBoundary: CurrencyBoundary,
  t: Sequelize.Transaction,
) {
  const potentialDepositTransactions = paymentOperations
    .filter(({ type }) => type === 'payment' || type === 'create_account')
    .filter(operation => publicKeyToDepositAddress.has(getAddressForOperation(operation)))
    .map(operation => {
      return {
        tx: operation,
        depositAddress: publicKeyToDepositAddress.get(
          getAddressForOperation(operation)
        )!,
      }
    }) as { tx: PaymentOperationRecord; depositAddress: DepositAddress }[]


  if (potentialDepositTransactions.length > 0) {
    logger.debug(`Found Potential Deposits: ${potentialDepositTransactions}`)
    const depositRequests = potentialDepositTransactions.map(tx => {
      const depositTransaction = onChainCurrencyGateway.apiToDepositTransaction(tx.tx)
      return convertTransactionToDepositRequest(tx.depositAddress, depositTransaction, fiatValueOfOneCryptoCurrency, currencyBoundary)
    })
    await storeDepositRequests(depositRequests, t)
  }

  function getAddressForOperation(operation: PaymentOperationRecord): string {
    return operation.type === 'payment' ? operation.to : (operation as any).account 
  }
}


