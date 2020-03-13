export async function up(queryInterface) {
  return queryInterface.sequelize.query(`
  UPDATE exchange_config
  SET value='{
    "depositPollingFrequency": [{
      "currency": "KAU",
      "frequency": 30000
    }, {
      "currency": "KAG",
      "frequency": 30000
    }]
  }'
  WHERE id=6;
  `)
}

export async function down(queryInterface) {
  return queryInterface.sequelize.query(`
  DELETE FROM exchange_config WHERE id=6;

  INSERT INTO exchange_config
  VALUES (6, '{
    "depositPollingFrequency": [{
      "currency": "KAU",
      "frequency": 30000
    }, {
      "currency": "KAG",
      "frequency": 30000
    }, {
      "currency": "KVT",
      "frequency": ${2 * 60_000}
    }]
  }');
  `)
}
