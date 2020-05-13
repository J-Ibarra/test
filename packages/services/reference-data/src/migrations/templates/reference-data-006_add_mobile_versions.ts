import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    INSERT INTO exchange_config
    VALUES (11, '{
      "mobileVersions": {
        "android": "1.0.94",
        "ios": "1.0.3",
        "forceVersionUpdate": true
      }
    }');
 `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`DELETE FROM exchange_config WHERE id=11;`)
}
