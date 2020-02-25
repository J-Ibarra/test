export async function up(queryInterface) {
  return queryInterface.sequelize.query(`
  DELETE FROM exchange_config WHERE id=3;
  INSERT INTO exchange_config
  VALUES (3, '{
    "withdrawalFees": {
      "USDT": {
        "feeCurrency": "USDT",
        "feeAmount": 0.000001,
        "minimumAmount": 0.000001
      },
      "BTC": {
        "feeCurrency": "BTC",
        "feeAmount": 0.00000001,
        "minimumAmount": 0.00000001
      },
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
  
  DELETE FROM exchange_config WHERE id=1;
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
      },
      {
        "currency": "BTC",
        "publicKey": "0"
      },
      {
        "currency": "USDT",
        "publicKey": "0"
      }
    ]
  }');`)
}

export async function down(queryInterface) {
  return queryInterface.sequelize.query(`
    DELETE FROM exchange_config WHERE id=3;
    INSERT INTO exchange_config
    VALUES (3, '{
        "withdrawalFees": {
            "USDT": {
              "feeCurrency": "USDT",
              "feeAmount": 0.000001,
              "minimumAmount": 0.000001
            },
            "BTC": {
                "feeCurrency": "BTC", 
                "feeAmount": 0.00000001,
                "minimumAmount": 0.00000001
            },
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
    DELETE FROM exchange_config WHERE id=1;
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
   
    `)
}
