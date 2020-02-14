import { Transaction } from 'sequelize'
import { getEnvironment, CurrencyCode, Currency } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager, OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'
import { getModel } from '@abx-utils/db-connection-utils'
import { ValidationError } from '@abx-types/error'
import { findCryptoCurrencies, isFiatCurrency } from '@abx-service-clients/reference-data'
import { DepositAddress } from '@abx-types/deposit'
import { encryptValue } from '@abx-utils/encryption'
import { groupBy } from 'lodash'
import { getAllKycVerifiedAccountIds } from '@abx-service-clients/account'

const logger = Logger.getInstance('lib', 'deposit_address')
const KYC_ACCOUNTS_CACHE_EXPIRY_10_MINUTES = 10 * 60 * 1000
let cryptoCurrencies: Currency[] = []

export async function generateNewDepositAddress(accountId: string, currency: OnChainCurrencyGateway) {
  const cryptoAddress = await currency.generateAddress()
  // const publicKey = currency.getAddressFromPrivateKey(privateKey)
  const encryptedPrivateKey = await encryptValue(cryptoAddress.privateKey)
  let encryptedWif
  if (cryptoAddress.wif) {
    encryptedWif = await encryptValue(cryptoAddress.wif)
  }

  const currencyId = await currency.getId()
  return {
    accountId,
    currencyId,
    publicKey: cryptoAddress.publicKey,
    address: cryptoAddress.address,
    encryptedPrivateKey,
    encryptedWif,
  } as DepositAddress
}

export async function findDepositAddresses(query: Partial<DepositAddress>, transaction?: Transaction) {
  const depositAddresses = await getModel<DepositAddress>('depositAddress').findAll({
    where: query as any,
    transaction,
  })
  return depositAddresses.map(address => address.get())
}

export async function findKycOrEmailVerifiedDepositAddresses(currencyId: number, transaction?: Transaction) {
  const kycVefifiedAccounts = await getAllKycVerifiedAccountIds(KYC_ACCOUNTS_CACHE_EXPIRY_10_MINUTES)
  const depositAddressInstances = await getModel<DepositAddress>('depositAddress').findAll({
    where: { currencyId },
    transaction,
  })
  const depositAddresses = depositAddressInstances.map(depositAddressInstance => depositAddressInstance.get())

  return depositAddresses.filter(({ accountId }) => kycVefifiedAccounts.has(accountId))
}

export async function findOrCreateDepositAddressesForAccount(accountId: string) {
  logger.debug(`Finding existing deposit addresses for account ${accountId}`)

  const existingDepositAddresses = await findDepositAddressesForAccount(accountId, true)
  logger.debug(`Found existing deposit addresses for currency: ${existingDepositAddresses.map(({ currencyId }) => currencyId).join(',')}`)

  if (cryptoCurrencies.length === 0) {
    cryptoCurrencies = await findCryptoCurrencies()
  }

  if (existingDepositAddresses.length < cryptoCurrencies.length) {
    const missingDepositAddresses = await createMissingDepositAddressesForAccount(accountId, existingDepositAddresses)

    logger.debug(`Created missing deposit addresses for currenciy ids: ${missingDepositAddresses.map(d => d.currencyId)}`)

    return findDepositAddressesForAccount(accountId, true)
  }

  return existingDepositAddresses
}

export async function findDepositAddressForId(id: number) {
  const depositAddress = await getModel<DepositAddress>('depositAddress').findOne({
    where: { id },
  })

  return !!depositAddress ? depositAddress.get() : null
}

export async function findDepositAddressesForAccount(accountId: string, includeCurrencyDetail: boolean = false) {
  const depositAddresses = await getModel<DepositAddress>('depositAddress').findAll({
    where: { accountId },
  })

  if (includeCurrencyDetail) {
  }

  return depositAddresses.map(address => address.get({ plain: true }))
}

export async function storeDepositAddress(address: DepositAddress) {
  const savedAddress = await getModel<DepositAddress>('depositAddress').create(address)
  return savedAddress.get()
}

export async function createMissingDepositAddressesForAccount(
  accountId: string,
  existingDepositAddresses: DepositAddress[],
): Promise<DepositAddress[]> {
  logger.debug(`Creating missing deposit addresses`)
  if (cryptoCurrencies.length === 0) {
    cryptoCurrencies = await findCryptoCurrencies()
  }

  logger.debug(`Crypto currencies ${cryptoCurrencies.join(', ')}`)
  const manager = new CurrencyManager(
    getEnvironment(),
    cryptoCurrencies.map(({ code }) => code),
  )

  const currencyIdToDepositAddress = groupBy(existingDepositAddresses, 'currencyId')

  const cryptoCurrenciesToGenerateAddressFor = cryptoCurrencies.filter(({ id }) => (currencyIdToDepositAddress[id] || []).length === 0)

  logger.debug(`Currencies to generate: ${cryptoCurrenciesToGenerateAddressFor.join(', ')}`)

  return Promise.all(
    cryptoCurrenciesToGenerateAddressFor.map(({ code }) => {
      return createNewDepositAddress(manager, accountId, code)
    }),
  )
}

export async function createNewDepositAddress(manager: CurrencyManager, accountId: string, currencyTicker: CurrencyCode): Promise<DepositAddress> {
  if (!Object.values(CurrencyCode).includes(currencyTicker) || isFiatCurrency(currencyTicker)) {
    throw new ValidationError(`Currency ${currencyTicker} is not valid for this type of deposit`, {
      context: {
        currencyTicker,
      },
    })
  }

  const address = await generateNewDepositAddress(accountId, manager.getCurrencyFromTicker(currencyTicker))
  return storeDepositAddress(address)
}

export async function generateDepositAddressForAccount(accountId: string, currencyTicker: CurrencyCode): Promise<DepositAddress> {
  const currencyAddressExists = (await findDepositAddressesForAccount(accountId, true)).find(
    addressDetails => addressDetails.currency?.code === currencyTicker,
  )

  if (currencyAddressExists) {
    return currencyAddressExists
  }

  logger.debug(`Generating crypto address for ${currencyTicker}`)

  const manager = new CurrencyManager(getEnvironment(), [currencyTicker])

  return generateNewDepositAddress(accountId, manager.getCurrencyFromTicker(currencyTicker))
}
