import * as Sequelize from 'sequelize'
import { TradeTransaction } from '@abx-types/order'
import { currencyPrecision, currencyScale, taxPrecision, taxScale } from '@abx-types/config'

export interface TradeTransactionInstance extends Sequelize.Instance<TradeTransaction>, TradeTransaction {
  getCounterTrade: Sequelize.BelongsToGetAssociationMixin<TradeTransactionInstance>
}

export default function(sequelize: Sequelize.Sequelize) {
  const options = {
    tableName: 'trade_transaction',
  }

  const tradeTransaction = sequelize.define<TradeTransactionInstance, TradeTransaction>(
    'tradeTransaction',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      counterTradeTransactionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'trade_transaction',
          key: 'id',
          deferrable: Sequelize.Deferrable,
        },
      },
      direction: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      symbolId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'symbol',
          key: 'id',
        },
      },
      accountId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'order',
          key: 'id',
        },
      },
      amount: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: false,
        get(this: TradeTransactionInstance) {
          return parseFloat(this.getDataValue('amount')) || 0
        },
      },
      matchPrice: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: false,
        get(this: TradeTransactionInstance) {
          return parseFloat(this.getDataValue('matchPrice')) || 0
        },
      },
      quoteFiatConversion: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: false,
        get(this: TradeTransactionInstance) {
          return parseFloat(this.getDataValue('quoteFiatConversion')) || 0
        },
      },
      baseFiatConversion: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: false,
        get(this: TradeTransactionInstance) {
          return parseFloat(this.getDataValue('baseFiatConversion')) || 0
        },
      },
      fiatCurrencyCode: {
        type: Sequelize.STRING,
        references: {
          model: 'currency',
          key: 'code',
        },
        allowNull: false,
      },
      fee: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: true,
        get(this: TradeTransactionInstance) {
          return parseFloat(this.getDataValue('fee')) || 0
        },
      },
      feeCurrencyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'currency',
          key: 'id',
        },
      },
      feeRate: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: true,
        get(this: TradeTransactionInstance) {
          return parseFloat(this.getDataValue('feeRate')) || 0
        },
      },
      taxRate: {
        type: Sequelize.DECIMAL(currencyPrecision, currencyScale),
        allowNull: true,
        get(this: TradeTransactionInstance) {
          return parseFloat(this.getDataValue('taxRate')) || 0
        },
      },
      taxAmountCHF: {
        type: Sequelize.DECIMAL(taxPrecision, taxScale),
        allowNull: true,
        get(this: TradeTransactionInstance) {
          return parseFloat(this.getDataValue('taxAmountCHF')) || 0
        },
      },
      taxAmountFeeCurrency: {
        type: Sequelize.DECIMAL(taxPrecision, taxScale),
        allowNull: true,
        get(this: TradeTransactionInstance) {
          return parseFloat(this.getDataValue('taxAmountFeeCurrency')) || 0
        },
      },
    },
    options,
  )

  return tradeTransaction
}
