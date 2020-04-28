import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    INSERT INTO exchange_config
    VALUES (10, '{"depositMinimumAmounts":{
      "ETH": 0.00042,
      "KAU": 0.00001,
      "KAG": 0.00001,
      "KVT": 1,
      "BTC": 0.0002,
      "USDT": 0.5
    }}');
 `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DELETE FROM exchange_config WHERE id=10;`)
}
