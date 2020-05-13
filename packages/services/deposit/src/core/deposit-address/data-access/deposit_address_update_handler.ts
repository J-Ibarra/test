import { getModel } from '@abx-utils/db-connection-utils'
import { DepositAddress } from '@abx-types/deposit'
import { Transaction } from 'sequelize'

export async function storeDepositAddress(address: DepositAddress) {
  const savedAddress = await getModel<DepositAddress>('depositAddress').create(address)
  return savedAddress.get()
}

export async function updateDepositAddress(address: DepositAddress, transaction?: Transaction) {
  const [, [savedAddress]] = await getModel<DepositAddress>('depositAddress').update(address, {
    where: { id: address.id! },
    returning: true,
    transaction,
  })

  return savedAddress && savedAddress.get()
}
