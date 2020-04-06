import { Sequelize } from 'sequelize'

export async function up({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.withdrawal_request
      ADD COLUMN "feeWithdrawalRequestId" integer REFERENCES public.withdrawal_request(id);

      UPDATE exchange_config
      SET value = '{
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
      },
      "BTC": {
        "feeCurrency": "BTC",
        "feeAmount": 0.0003,
        "minimumAmount": 0.0008
      }
    }
  }' WHERE id=3`)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  return sequelize.query(`
    ALTER TABLE public.withdrawal_request
        DROP COLUMN "feeWithdrawalRequestId";

    UPDATE exchange_config
        SET value = '{
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
    }' WHERE id=3
  `)
}
