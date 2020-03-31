import { Transaction } from 'sequelize'
import { getEnvironment, CurrencyCode, Currency } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager, OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'
import { getModel } from '@abx-utils/db-connection-utils'
import { ValidationError } from '@abx-types/error'
import { findCryptoCurrencies, isFiatCurrency, findCurrencyForCode, findCurrencyForId } from '@abx-service-clients/reference-data'
import { DepositAddress } from '@abx-types/deposit'
import { encryptValue } from '@abx-utils/encryption'
import { groupBy } from 'lodash'
import { Account } from '@abx-types/account'
import { getAllKycOrEmailVerifiedAccountIds } from '@abx-service-clients/account'

const logger = Logger.getInstance('lib', 'deposit_address')
const KYC_ACCOUNTS_CACHE_EXPIRY_3_MINUTES_IN_SECONDS = 3 * 60
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
    address: cryptoAddress.address,
    encryptedWif,
    transactionTrackingActivated: false,
  } as DepositAddress
}

export async function findDepositAddresses(query: Partial<DepositAddress>, transaction?: Transaction) {
  const depositAddresses = await getModel<DepositAddress>('depositAddress').findAll({
    where: query as any,
    transaction,
  })
  return depositAddresses.map(address => address.get())
}

export async function findDepositAddress(query: Partial<DepositAddress>, transaction?: Transaction): Promise<DepositAddress | null> {
  const depositAddressInstance = await getModel<DepositAddress>('depositAddress').findOne({
    where: query as any,
    transaction,
  })

  return depositAddressInstance ? depositAddressInstance.get() : null
}

export async function findKycOrEmailVerifiedDepositAddresses(currencyId: number, transaction?: Transaction) {
  const kycVerifiedAccounts = await getAllKycOrEmailVerifiedAccountIds(KYC_ACCOUNTS_CACHE_EXPIRY_3_MINUTES_IN_SECONDS)
  const depositAddressInstances = await getModel<DepositAddress>('depositAddress').findAll({
    where: { currencyId },
    transaction,
  })
  const depositAddresses = depositAddressInstances.map(depositAddressInstance => depositAddressInstance.get())

  return depositAddresses.filter(({ accountId }) => kycVerifiedAccounts.has(accountId))
}

export async function findOrCreateDepositAddressesForAccount(accountId: string) {
  logger.debug(`Finding existing deposit addresses for account ${accountId}`)

  const existingDepositAddresses = await findDepositAddressesForAccount(accountId)
  logger.debug(`Found existing deposit addresses for currency: ${existingDepositAddresses.map(({ currencyId }) => currencyId).join(',')}`)

  if (cryptoCurrencies.length === 0) {
    cryptoCurrencies = await findCryptoCurrencies()
  }

  if (existingDepositAddresses.length < cryptoCurrencies.length) {
    const missingDepositAddresses = await createMissingDepositAddressesForAccount(accountId, existingDepositAddresses)

    logger.debug(`Created missing deposit addresses for currenciy ids: ${missingDepositAddresses.map(d => d.currencyId)}`)

    return findDepositAddressesForAccount(accountId)
  }

  return existingDepositAddresses
}

export async function findDepositAddressForId(id: number) {
  const depositAddress = await getModel<DepositAddress>('depositAddress').findOne({
    where: { id },
  })

  return !!depositAddress ? depositAddress.get() : null
}

export async function findDepositAddressesForAccount(accountId: string) {
  const depositAddresses = await getModel<DepositAddress>('depositAddress').findAll({
    where: { accountId },
  })

  return depositAddresses.map(address => address.get({ plain: true }))
}
export async function findDepositAddressesForAccountWithCurrency(accountId: string): Promise<DepositAddress[]> {
  const depositAddresses = await findDepositAddressesForAccount(accountId)
  return Promise.all(
    depositAddresses.map(
      async (depositAddress): Promise<DepositAddress> => {
        const { id, code } = await findCurrencyForId(depositAddress.currencyId)

        return {
          ...depositAddress,
          currency: { id, code },
        }
      },
    ),
  )
}

export async function storeDepositAddress(address: DepositAddress) {
  const savedAddress = await getModel<DepositAddress>('depositAddress').create(address)
  return savedAddress.get()
}

export async function updateDepositAddress(address: DepositAddress) {
  const [, [savedAddress]] = await getModel<DepositAddress>('depositAddress').update(address, { where: { id: address.id! }, returning: true })
  return savedAddress && savedAddress.get()
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

  logger.debug(`Currencies to generate: ${cryptoCurrenciesToGenerateAddressFor.map(address => JSON.stringify(address)).join(', ')}`)

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
  logger.debug(`Generated address for account ${accountId} and currency ${currencyTicker}`)
  logger.debug(`Address: ${JSON.stringify(address)}`)

  return storeDepositAddress(address)
}

export const findDepositAddressAndListenForEvents = async ({ id }: Account, currencyCode: CurrencyCode): Promise<DepositAddress> => {
  const { id: currencyId } = await findCurrencyForCode(currencyCode)
  const depositAddress = await findDepositAddress({ accountId: id, currencyId })

  if (!depositAddress) {
    throw new ValidationError(`Deposit address does not exist for currency id: ${currencyId} and account id: ${id}`)
  }

  if (depositAddress.transactionTrackingActivated) {
    logger.debug(`Deposit address transaction tracking already activated for currency id: ${currencyId} and account id: ${id}`)
    return depositAddress
  }

  const manager = new CurrencyManager(getEnvironment(), [currencyCode])

  const successfulEventCreation = await manager.getCurrencyFromTicker(currencyCode).createAddressTransactionSubscription(depositAddress)

  const updatedDepositAddress = await updateDepositAddress({ ...depositAddress, transactionTrackingActivated: successfulEventCreation })

  return updatedDepositAddress
}
