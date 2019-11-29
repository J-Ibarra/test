import * as Sequelize from 'sequelize'

export async function up(queryInterface) {
  await queryInterface.createTable('withdrawal_kinesis_coin_emission', {
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
    },
    currency: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
    },
    updatedAt: {
      type: Sequelize.DATE,
    },
  })
}

export async function down({ sequelize }) {
  return sequelize.query(`
   DROP TABLE withdrawal_kinesis_coin_emission;
  `)
}
