import { Transaction } from 'sequelize'
import { getModel } from '@abx-utils/db-connection-utils'
import { BlockchainFollowerDetails } from '@abx-types/deposit'

export async function updateBlockchainFollowerDetailsForCurrency(currencyId: number, lastEntityProcessedIdentifier: string, t?: Transaction) {
    const [, [details]] = await getModel<BlockchainFollowerDetails>('blockchain_follower_details').update(
      { lastEntityProcessedIdentifier } as BlockchainFollowerDetails,
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
  