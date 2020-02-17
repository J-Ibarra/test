import * as Sequelize from 'sequelize'

import { FiatCurrency, currencyPrecision, currencyScale } from '@abx-types/reference-data'
import { DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { DepositAddressInstance } from './deposit_address'

export interface DepositRequestInstance extends Sequelize.Instance<DepositRequest>, DepositRequest {
  getAddress: Sequelize.BelongsToGetAssociationMixin<DepositAddressInstance>
}

export default function depositRequestModel(sequelize: Sequelize.Sequelize) {
  return sequelize.define(
    'depositRequest',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      depositAddressId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'deposit_address',
          key: 'id',
        },
        allowNull: false,
      },
      amount: {
        type: Sequelize['DOUBLE PRECISION'],
        allowNull: false,
        get(this: DepositRequestInstance) {
          return parseFloat(this.getDataValue('amount')) || 0
        },
      },
      depositTxHash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      holdingsTxHash: {
        type: Sequelize.STRING,
      },
      holdingsTxFee: {
        type: Sequelize['DOUBLE PRECISION'],
        get(this: DepositRequestInstance) {
          return parseFloat(this.getDataValue('holdingsTxFee')) || 0
        },
      },
      from: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM({
          values: Object.values(DepositRequestStatus),
        }),
      },
      fiatConversion: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: false,
        get(this: DepositRequestInstance) {
          return parseFloat(this.getDataValue('fiatConversion')) || 0
        },
      },
      fiatCurrencyCode: {
        type: Sequelize.ENUM({
          values: Object.values(FiatCurrency),
        } as any),
        allowNull: false,
      },
    },
    {
      tableName: 'deposit_request',
    },
  )
}
