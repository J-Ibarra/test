import * as Sequelize from 'sequelize'

import * as constants from '@abx-types/reference-data'
import { WithdrawalRequest, WithdrawalRequestType, WithdrawalState } from '@abx-types/withdrawal'

export interface WithdrawalRequestInstance extends Sequelize.Instance<WithdrawalRequest>, WithdrawalRequest {}

export default function withdrawalRequestModel(sequelize: Sequelize.Sequelize) {
  return sequelize.define<WithdrawalRequestInstance, WithdrawalRequest>(
    'withdrawalRequest',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(constants.currencyPrecision, constants.currencyScale),
        allowNull: false,
        get(this: WithdrawalRequestInstance) {
          return parseFloat(this.getDataValue('amount')) || 0
        },
      },
      txHash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      state: {
        type: Sequelize.ENUM,
        values: Object.keys(WithdrawalState),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM,
        values: Object.keys(WithdrawalRequestType),
        allowNull: false,
      },
      currencyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      accountId: {
        type: Sequelize.UUID,
      },
      memo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fiatConversion: {
        type: Sequelize.DECIMAL(constants.currencyPrecision, constants.currencyScale),
        allowNull: false,
        get(this: WithdrawalRequestInstance) {
          return parseFloat(this.getDataValue('fiatConversion')) || 0
        },
      },
      fiatCurrencyCode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      kauConversion: {
        type: Sequelize.DECIMAL(constants.currencyPrecision, constants.currencyScale),
        allowNull: false,
        get(this: WithdrawalRequestInstance) {
          return parseFloat(this.getDataValue('kauConversion')) || 0
        },
      },
      kinesisCoveredOnChainFee: {
        type: Sequelize.DECIMAL(constants.currencyPrecision, constants.currencyScale),
        defaultValue: 0,
        get(this: WithdrawalRequestInstance) {
          return parseFloat(this.getDataValue('kinesisCoveredOnChainFee')) || 0
        },
      },
      adminRequestId: {
        type: Sequelize.INTEGER,
      },
    },
    {
      tableName: 'withdrawal_request',
    },
  )
}
