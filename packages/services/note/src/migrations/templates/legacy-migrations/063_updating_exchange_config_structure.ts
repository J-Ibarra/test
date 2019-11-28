import { AccountStatus } from '../../accounts'

export async function up(queryInterface) {
  return queryInterface.sequelize.query(`
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
    ]
  }');

  INSERT INTO exchange_config
  VALUES (2, '{
    "vatRate": 0.077
  }');

  INSERT INTO exchange_config
  VALUES (3, '{
    "withdrawalFees": {
      "KAU": {
        "feeCurrency": "KAU", 
        "feeAmount": 0,
        "minimumAmount": 0.1
      },
      "KAG": {
        "feeCurrency": "KAG", 
        "feeAmount": 0,
        "minimumAmount": 0.5
      },
      "ETH": {
        "feeCurrency": "ETH",
        "feeAmount": 0.01,
        "minimumAmount": 0.02
      },
      "KVT": {
        "feeCurrency": "ETH", 
        "feeAmount": 0.005,
        "minimumAmount": 1
      },
      "EUR": {
        "feeCurrency": "EUR", 
        "feeAmount": 25,
        "minimumAmount": 100
      },
      "USD": {
        "feeCurrency": "USD",
        "feeAmount": 25,
        "minimumAmount": 100
      }
    }
  }');


  INSERT INTO exchange_config
  VALUES (4, '{
    "withdrawalLimit": {
      "${AccountStatus.emailVerified}": 250,
      "${AccountStatus.kycVerified}": 800,
      "${AccountStatus.superUser}": 1500
    }
  }');

  INSERT INTO exchange_config
  VALUES (5, '{
    "featureFlags": [{
      "name": "debit_card",
      "enabled": false
    }]
  }');

  INSERT INTO exchange_config
  VALUES (6, '{
    "depositPollingFrequency": [{
      "currency": "KAU",
      "frequency": 30000
    }, {
      "currency": "KAG",
      "frequency": 30000
    }, {
      "currency": "ETH",
      "frequency": ${2 * 60_000}
    }, {
      "currency": "KVT",
      "frequency": ${2 * 60_000}
    }]
  }');

  INSERT INTO exchange_config
  VALUES (7, '{
    "transactionFeeCap": {
      "KAU": 25000,
      "KAG": 25000
    }
  }');

  INSERT INTO exchange_config
  VALUES (8, '{
    "operationsEmail": "it@abx.com.au"
  }');
  `)
}

export async function down(queryInterface) {
  return queryInterface.sequelize.query(`
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
    "withdrawalFees": {
      "KAU": {
        "feeCurrency": "KAU", 
        "feeAmount": 0,
        "minimumAmount": 0.5
      },
      "KAG": {
        "feeCurrency": "KAG", 
        "feeAmount": 0,
        "minimumAmount": 0.1
      },
      "ETH": {
        "feeCurrency": "ETH",
        "feeAmount": 0.01,
        "minimumAmount": 0.02
      },
      "KVT": {
        "feeCurrency": "ETH", 
        "feeAmount": 0.005,
        "minimumAmount": 1
      },
      "EUR": {
        "feeCurrency": "EUR", 
        "feeAmount": 25,
        "minimumAmount": 100
      },
      "USD": {
        "feeCurrency": "USD",
        "feeAmount": 25,
        "minimumAmount": 100
      }
    },
    "withdrawalLimit": {
      "${AccountStatus.emailVerified}": 250,
      "${AccountStatus.kycVerified}": 800,
      "${AccountStatus.superUser}": 1500
    },
    "featureFlags": [{
      "name": "debit_card",
      "enabled": false
    }],
    "depositPollingFrequency": [{
      "currency": "KAU",
      "frequency": 30000
    }, {
      "currency": "KAG",
      "frequency": 30000
    }, {
      "currency": "ETH",
      "frequency": ${2 * 60_000}
    }, {
      "currency": "KVT",
      "frequency": ${2 * 60_000}
    }],
    "transactionFeeCap": {
      "KAU": 25000,
      "KAG": 25000
    }
  }');
  `)
}
