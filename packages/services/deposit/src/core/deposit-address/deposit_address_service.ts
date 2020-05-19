import { CurrencyCode, Currency, SymbolPairStateFilter } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager, OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'
import { ValidationError } from '@abx-types/error'
import { findCryptoCurrencies, isFiatCurrency, findCurrencyForCode, getAllCurrenciesEligibleForAccount } from '@abx-service-clients/reference-data'
import { DepositAddress } from '@abx-types/deposit'
import { encryptValue } from '@abx-utils/encryption'
import { groupBy } from 'lodash'
import { Account } from '@abx-types/account'
import { findDepositAddressesForAccount, findDepositAddress } from './data-access/deposit_address_query_handler'
import { storeDepositAddress, updateDepositAddress } from './data-access/deposit_address_update_handler'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'

const logger = Logger.getInstance('lib', 'deposit_address')
let cryptoCurrencies: Currency[] = []

export async function generateNewDepositAddress(accountId: string, currency: OnChainCurrencyGateway) {
  let cryptoAddress
  try {
    cryptoAddress = await currency.generateAddress()
  } catch (e) {
    logger.error(`Unable to generate crypto address for ${currency.ticker}`)
    logger.error(JSON.stringify(e))

    throw e
  }
  const encryptedPrivateKey = await encryptValue(cryptoAddress.privateKey)

  let encryptedWif
  // Third party coins will have address and WIF
  if (!!cryptoAddress.wif) {
    encryptedWif = await encryptValue(cryptoAddress.wif!)
  }

  const currencyId = await currency.getId()
  return {
    accountId,
    currencyId,
    publicKey: cryptoAddress.publicKey,
    encryptedPrivateKey,
    address: cryptoAddress.address || cryptoAddress.publicKey,
    encryptedWif,
    transactionTrackingActivated: false,
  } as DepositAddress
}

export async function findOrCreateDepositAddressesForAccount(accountId: string) {
  logger.debug(`Finding existing deposit addresses for account ${accountId}`)

  const existingDepositAddresses = await findDepositAddressesForAccount(accountId)
  logger.debug(`Found existing deposit addresses for currency: ${existingDepositAddresses.map(({ currencyId }) => currencyId).join(',')}`)

  if (cryptoCurrencies.length === 0) {
    cryptoCurrencies = await findCryptoCurrencies(SymbolPairStateFilter.all)
  }

  if (existingDepositAddresses.length < cryptoCurrencies.length) {
    logger.debug(
      `${existingDepositAddresses.length} Existing deposit addresses found ${existingDepositAddresses.map(({ currencyId }) => currencyId).join(',')}`,
    )
    const missingDepositAddresses = await createMissingDepositAddressesForAccount(accountId, existingDepositAddresses)

    logger.debug(`Created missing deposit addresses for currenciy ids: ${missingDepositAddresses.map((d) => d.currencyId)}`)

    return findDepositAddressesForAccount(accountId)
  }

  return existingDepositAddresses
}

export async function createMissingDepositAddressesForAccount(
  accountId: string,
  existingDepositAddresses: DepositAddress[],
): Promise<DepositAddress[]> {
  logger.debug(`Creating missing deposit addresses`)
  if (cryptoCurrencies.length === 0) {
    cryptoCurrencies = await findCryptoCurrencies(SymbolPairStateFilter.all)
  }

  const allCurrenciesEligibleForAccount = (await getAllCurrenciesEligibleForAccount(accountId)).map(({ code }) => code)
  const filteredCryptoCurrencies = cryptoCurrencies.reduce(
    (acc, currency) => (allCurrenciesEligibleForAccount.includes(currency.code) ? acc.concat(currency) : acc),
    [] as Currency[],
  )

  logger.debug(`Crypto currencies for account ${accountId}: ${filteredCryptoCurrencies.map(({ code }) => code).join(', ')}`)

  const manager = new CurrencyManager()
  const currencyIdToDepositAddress = groupBy(existingDepositAddresses, 'currencyId')

  const cryptoCurrenciesToGenerateAddressFor = filteredCryptoCurrencies.filter(({ id }) => (currencyIdToDepositAddress[id] || []).length === 0)

  if (cryptoCurrenciesToGenerateAddressFor.length === 0) {
    return []
  }

  logger.debug(
    `Currencies to generate ${cryptoCurrenciesToGenerateAddressFor.length} : ${cryptoCurrenciesToGenerateAddressFor
      .map(({ code }) => code)
      .join(', ')}`,
  )

  return createNewDepositAddresses(manager, accountId, cryptoCurrenciesToGenerateAddressFor, filteredCryptoCurrencies)
}

async function createNewDepositAddresses(
  currencyManager: CurrencyManager,
  accountId: string,
  cryptoCurrenciesToGenerateAddressFor: Currency[],
  allCurrenciesEligibleForAccount: Currency[],
): Promise<DepositAddress[]> {
  const kauCurrencyId = allCurrenciesEligibleForAccount.find((c) => c.code === CurrencyCode.kau)!.id
  logger.debug(`KAU currency id: ${kauCurrencyId}`)

  const createdDepositAddressesWithoutKau = await Promise.all(
    cryptoCurrenciesToGenerateAddressFor
      .filter(({ id }) => id !== kauCurrencyId)
      .map(({ code }) => {
        return createNewDepositAddress(currencyManager, accountId, code)
      }),
  )
  const kagCurrencyId = allCurrenciesEligibleForAccount.find((c) => c.code === CurrencyCode.kag)!.id
  logger.debug(`KAG currency id: ${kauCurrencyId}`)

  const kagDepositAddress = createdDepositAddressesWithoutKau.find((address) => address.currencyId === kagCurrencyId)
  logger.debug(`kagDepositAddress: ${JSON.stringify(kagDepositAddress)}`)

  if (kagDepositAddress) {
    const kauDepositAddress = await reuseDepositAddress(kagDepositAddress, CurrencyCode.kau, cryptoCurrenciesToGenerateAddressFor)
    return createdDepositAddressesWithoutKau.concat(kauDepositAddress)
  }

  return createdDepositAddressesWithoutKau
}

async function reuseDepositAddress(
  depositAddress: DepositAddress,
  currencyCode: CurrencyCode,
  allCryptoCurrencies: Currency[],
): Promise<DepositAddress> {
  const cryptoCurrency = allCryptoCurrencies.find((c) => c.code === currencyCode)
  if (!cryptoCurrency) {
    throw new Error(`Cannot create a deposit address for ${currencyCode} as it is not enabled for account ${depositAddress.accountId}`)
  }

  // reuse the existing public address
  logger.debug(`Use existing public address for ${currencyCode} and account ${depositAddress.accountId}`)
  const newDepositAddress = {
    ...depositAddress,
    id: undefined,
    currencyId: cryptoCurrency!.id,
    createdAt: undefined,
    transactionTrackingActivated: false,
  }

  logger.debug(`Address: ${JSON.stringify(newDepositAddress)}`)
  return storeDepositAddress(newDepositAddress)
}

export async function createNewDepositAddress(manager: CurrencyManager, accountId: string, currencyTicker: CurrencyCode): Promise<DepositAddress> {
  if (!Object.values(CurrencyCode).includes(currencyTicker) || isFiatCurrency(currencyTicker)) {
    throw new ValidationError(`Currency ${currencyTicker} is not valid for this type of deposit`, {
      context: {
        currencyTicker,
      },
    })
  }

  logger.debug(`Generating address for ${currencyTicker} and account ${accountId}`)
  const address = await generateNewDepositAddress(accountId, manager.getCurrencyFromTicker(currencyTicker))
  logger.debug(`Generated address for account ${accountId} and currency ${currencyTicker}`)
  logger.debug(`Address: ${JSON.stringify(address)}`)

  return storeDepositAddress(address)
}

export const findDepositAddressAndListenForEvents = async ({ id }: Account, currencyCode: CurrencyCode): Promise<DepositAddress> => {
  const { id: currencyId } = await findCurrencyForCode(currencyCode, SymbolPairStateFilter.all)

  return wrapInTransaction(sequelize, null, async (transaction) => {
    const depositAddress = await findDepositAddress({ query: { accountId: id, currencyId }, transaction, usePessimisticLock: true })

    if (!depositAddress) {
      throw new ValidationError(`Deposit address does not exist for currency id: ${currencyId} and account id: ${id}`)
    }

    if (depositAddress.transactionTrackingActivated) {
      logger.debug(`Deposit address transaction tracking already activated for currency id: ${currencyId} and account id: ${id}`)
      return depositAddress
    }

    const manager = new CurrencyManager()

    const successfulEventCreation = await manager.getCurrencyFromTicker(currencyCode).createAddressTransactionSubscription(depositAddress)
    const updatedDepositAddress = await updateDepositAddress(
      { ...depositAddress, transactionTrackingActivated: successfulEventCreation },
      transaction,
    )

    return updatedDepositAddress
  })
}
