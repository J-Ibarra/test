import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
        DELETE FROM default_execution_fee
        WHERE tier != 1;
        
        UPDATE default_execution_fee
        SET rate = 0.0022
    `)
}

export async function down() {
  console.log('No down applicable for "Update Fee Rates to 0.22%"')
}
