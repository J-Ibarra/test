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
