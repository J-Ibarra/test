import * as Sequelize from 'sequelize'
import { BlockchainFollowerDetails } from '@abx-types/deposit'

export interface BlockchainFollowerDetailsInstance extends Sequelize.Instance<BlockchainFollowerDetails>, BlockchainFollowerDetails {}

export default function(sequelize: Sequelize.Sequelize) {
  const blockchainFollowerDetails = sequelize.define<BlockchainFollowerDetailsInstance, BlockchainFollowerDetails>('blockchain_follower_details', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    currencyId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'currency',
        key: 'id',
      },
      unique: true,
    },
    lastBlockNumberProcessed: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  })

  return blockchainFollowerDetails
}
