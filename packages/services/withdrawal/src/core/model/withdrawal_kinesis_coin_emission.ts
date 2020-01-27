import * as Sequelize from 'sequelize'
import { WithdrawalKinesisCoinEmission } from '@abx-types/withdrawal'

export interface WithdrawalKinesisCoinEmissionInstance extends Sequelize.Instance<WithdrawalKinesisCoinEmission>, WithdrawalKinesisCoinEmission {}

export function withdrawalEmissionRequestModel(sequelize: Sequelize.Sequelize) {
  return sequelize.define<WithdrawalKinesisCoinEmissionInstance, WithdrawalKinesisCoinEmission>(
    'withdrawalKinesisCoinEmission',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      withdrawalRequestId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'withdrawal_request',
          key: 'id',
        },
        unique: true,
      },
      txEnvelope: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      sequence: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: 'currency_sequence',
        get(this: Sequelize.Instance<WithdrawalKinesisCoinEmission>) {
          return this.getDataValue('sequence') || 0
        },
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'withdrawal_kinesis_coin_emission',
    },
  )
}
