import * as Sequelize from 'sequelize'
import { currencyPrecision, currencyScale } from '@abx-types/reference-data'
import { CurrencyTransaction } from '@abx-types/order'

export interface CurrencyTransactionInstance extends Sequelize.Instance<CurrencyTransaction>, CurrencyTransaction {}

export default function(sequelize: Sequelize.Sequelize) {
  const currencyTransaction = sequelize.define<CurrencyTransactionInstance, CurrencyTransaction>(
    'currencyTransaction',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      currencyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'currency',
          key: 'id',
        },
      },
      direction: {
        type: Sequelize.ENUM('Deposit', 'Withdrawal'),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: false,
        get(this: CurrencyTransactionInstance) {
          return parseFloat(this.getDataValue('amount')) || 0
        },
      },
      accountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'account',
          key: 'id',
        },
      },
      memo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      requestId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'currency_transaction',
    },
  )

  return currencyTransaction
}
