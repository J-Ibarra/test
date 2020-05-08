import { Transaction } from 'sequelize'
import { getModel, sequelize } from '@abx-utils/db-connection-utils'
import { findCurrencyForId } from '@abx-service-clients/reference-data'
import { DepositAddress } from '@abx-types/deposit'
import { getAllKycOrEmailVerifiedAccountIds } from '@abx-service-clients/account'

const KYC_ACCOUNTS_CACHE_EXPIRY_3_MINUTES_IN_SECONDS = 3 * 60

export async function findDepositAddressesForPublicKeysAndCurrency(publicKeys: string[], currencyId: number, transaction?: Transaction) {
  const depositAddresses = await getModel<DepositAddress>('depositAddress').findAll({
    where: {
      publicKey: { $in: publicKeys },
      currencyId,
    },
    transaction,
  })
  return depositAddresses.map((address) => address.get())
}

export async function findDepositAddresses(query: Partial<DepositAddress>, transaction?: Transaction) {
  const depositAddresses = await getModel<DepositAddress>('depositAddress').findAll({
    where: query as any,
    transaction,
  })
  return depositAddresses.map((address) => address.get())
}

/**
 * Does a deposit_address lookup based on the search criteria requested.
 * The {@code usePessimisticLock} flag can be used if the client wants to create
 * a pessimistic lock on the retrieved records, releasing the lock once the transaction completes.
 *
 * @param param contains the DB query to use + optional DB transaction
 */
export async function findDepositAddress({
  query,
  transaction,
  usePessimisticLock,
}: {
  query: Partial<DepositAddress>
  transaction?: Transaction
  usePessimisticLock?: boolean
}): Promise<DepositAddress | null> {
  const depositAddressInstance = await getModel<DepositAddress>('depositAddress').findOne({
    where: query as any,
    transaction,
    lock: usePessimisticLock ? Transaction.LOCK.UPDATE : undefined,
  })

  return depositAddressInstance ? depositAddressInstance.get() : null
}

export async function findDepositAddressByAddressOrPublicKey(publicKey: string, transaction?: Transaction): Promise<DepositAddress | null> {
  const depositAddressInstance = await getModel<DepositAddress>('depositAddress').findOne({
    where: {
      $or: [
        { address: sequelize.where(sequelize.fn('LOWER', sequelize.col('address')), 'LIKE', `%${publicKey.toLowerCase()}%`) },
        { publicKey: sequelize.where(sequelize.fn('LOWER', sequelize.col('publicKey')), 'LIKE', `%${publicKey.toLowerCase()}%`) },
      ],
    },
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
  const depositAddresses = depositAddressInstances.map((depositAddressInstance) => depositAddressInstance.get())

  return depositAddresses.filter(({ accountId }) => kycVerifiedAccounts.has(accountId))
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

  return depositAddresses.map((address) => address.get({ plain: true }))
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
