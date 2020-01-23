import { Transaction } from 'sequelize'
import { getEnvironment, CurrencyCode } from '@abx-types/reference-data'
import { Account, AccountStatus } from '@abx-types/account'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager, OnChainCurrencyGateway } from '@abx-query-libs/blockchain-currency-gateway'
import { getModel } from '@abx-utils/db-connection-utils'
import { ValidationError } from '@abx-types/error'
import { findCryptoCurrencies, isFiatCurrency } from '@abx-service-clients/reference-data'
import { DepositAddress } from '@abx-types/deposit'
import { encryptValue } from '@abx-utils/encryption'
import { groupBy } from 'lodash'

const logger = Logger.getInstance('lib', 'deposit_address')

export async function generateNewDepositAddress(accountId: string, currency: OnChainCurrencyGateway) {
  const privateKey = currency.generatePrivateKey()
  const publicKey = currency.getAddressFromPrivateKey(privateKey)
  const encryptedPrivateKey = await encryptValue(privateKey)
  const currencyId = await currency.getId()
  return {
    accountId,
    encryptedPrivateKey,
    currencyId,
    publicKey,
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
  const depositAddressForVerifiedUsers = await getModel<DepositAddress>('depositAddress').findAll({
    include: [
      {
        model: getModel<Account>('account'),
        attributes: ['id', 'type'],
        where: { status: [AccountStatus.emailVerified, AccountStatus.kycVerified] },
      },
      {
        model: getModel<CurrencyCode>('currency'),
        attributes: ['id', 'code'],
        where: { id: currencyId },
      },
    ],
    transaction,
  })

  return depositAddressForVerifiedUsers.map(address => address.get())
}

export async function findOrCreateDepositAddressesForAccount(accountId: string) {
  logger.debug(`Finding existing deposit addresses for account ${accountId}`)

  const existingDepositAddresses = await findDepositAddressesForAccount(accountId, true)

  logger.debug(`Found existing deposit addresses for currency: ${existingDepositAddresses.map(({ currencyId }) => currencyId).join(',')}`)

  const cryptoCurrencies = await findCryptoCurrencies()

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
    include: [
      {
        model: getModel<CurrencyCode>('currency'),
        attributes: ['id', 'code'],
      },
    ],
  })

  return !!depositAddress ? depositAddress.get() : null
}

export async function findDepositAddressesForAccount(accountId: string, includeCurrencyDetail: boolean = false) {
  const depositAddresses = await getModel<DepositAddress>('depositAddress').findAll({
    where: { accountId },
    include: includeCurrencyDetail
      ? [
          {
            model: getModel<CurrencyCode>('currency'),
            attributes: ['id', 'code'],
          },
        ]
      : [],
  })

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
  const cryptoCurrencies = await findCryptoCurrencies()

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
