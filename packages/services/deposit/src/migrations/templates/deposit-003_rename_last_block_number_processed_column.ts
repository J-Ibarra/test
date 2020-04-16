import { QueryInterface, Sequelize } from 'sequelize'

export async function up(queryInterface: QueryInterface, sequelize: Sequelize) {
	await queryInterface.renameColumn(
		'blockchain_follower_details', 
		'lastBlockNumberProcessed', 
		'lastEntityProcessedIdentifier'
	)

  await sequelize.query(
    `ALTER TABLE public.blockchain_follower_details
      ALTER COLUMN "lastEntityProcessedIdentifier" TYPE character varying(200);`
  )
	// 	'blockchain_follower_details', 
	// 	'lastEntityProcessedIdentifier', {
  //   type: sequelize.Sequelize.TEXT,
  // })
}

export async function down(queryInterface: QueryInterface, sequelize: Sequelize) {
	await queryInterface.renameColumn(
		'blockchain_follower_details', 
		'lastEntityProcessedIdentifier', 
		'lastBlockNumberProcessed'
  )
  
  return sequelize.query(
    `ALTER TABLE public.blockchain_follower_details
      ALTER COLUMN "lastBlockNumberProcessed" TYPE numeric;`
  )

  // return queryInterface.changeColumn(
	// 	'blockchain_follower_details', 
	// 	'lastBlockNumberProcessed', {
  //   type: sequelize.Sequelize.INTEGER,
  // })
}

