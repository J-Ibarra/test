import * as Sequelize from 'sequelize'

export async function up(queryInterface) {
  await queryInterface.createTable('blockchain_follower_details', {
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
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.TIME,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.TIME,
      allowNull: false,
    },
  })

  await queryInterface.sequelize.query(
    `insert into blockchain_follower_details ("currencyId", "lastBlockNumberProcessed", "createdAt", "updatedAt") values (1, 0, now(), now())`,
  )
}

export async function down({ sequelize }) {
  return sequelize.query(`
   DROP TABLE blockchain_follower_details;
  `)
}
