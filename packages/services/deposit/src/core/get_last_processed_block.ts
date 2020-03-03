import { Transaction } from 'sequelize'
import { getModel } from '@abx-utils/db-connection-utils'
import { BlockchainFollowerDetails } from '@abx-types/deposit'

export async function getBlockchainFollowerDetailsForCurrency(currencyId: number) {
  const details = await getModel<BlockchainFollowerDetails>('blockchain_follower_details').findOne({
    where: {
      currencyId,
    },
  })

  return details ? details.get() : null
}

export async function updateBlockchainFollowerDetailsForCurrency(currencyId: number, lastBlockNumberProcessed: string, t?: Transaction) {
  const [, [details]] = await getModel<BlockchainFollowerDetails>('blockchain_follower_details').update(
    { lastBlockNumberProcessed } as BlockchainFollowerDetails,
    {
      where: {
        currencyId,
      },
      transaction: t,
      returning: true,
    },
  )

  return details.get()
}

