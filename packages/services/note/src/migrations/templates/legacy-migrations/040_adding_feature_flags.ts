import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
  DELETE FROM exchange_config;

  INSERT INTO exchange_config
  VALUES (1, '{
    "exchangeHoldingsWallets": [
      {
        "currency": "KAU",
        "publicKey": "GBLUOO2O2UWEFMAJ2RVH4NPZ37M3OKSDNGXLZC5LUI2BESLC7B6JMAHH"
      },
      {
        "currency": "KAG",
        "publicKey": "GCLH44WUYX6XSYTEUDNLYZ5ROJRFF32EUDUFRPO3VRIJG6B2O6XPCQAM"
      },
      {
        "currency": "ETH",
        "publicKey": "0x0e6AD58d278308E8793E20A52793A2d9c70987A2"
      },
      {
        "currency": "KVT",
        "publicKey": "0xCB92DD702aC0Ab7D6e3774f7CE329b6000E9D271"
      }
    ],
    "vatRate": 0.077,
    "featureFlags": [{
      "name": "debit_card",
      "enabled": false
    }]
  }');
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query('TRUNCATE public.exchange_config')
}
