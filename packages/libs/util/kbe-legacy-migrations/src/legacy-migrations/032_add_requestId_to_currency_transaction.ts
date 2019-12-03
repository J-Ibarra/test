import { QueryInterface } from 'sequelize'

export async function up(queryInterface: QueryInterface, Sequelize) {
  return queryInterface.addColumn('currency_transaction', 'requestId', {
    type: Sequelize.INTEGER,
    allowNull: true,
  })
}

export async function down(queryInterface: QueryInterface) {
  return queryInterface.removeColumn('currency_transaction', 'requestId')
}
