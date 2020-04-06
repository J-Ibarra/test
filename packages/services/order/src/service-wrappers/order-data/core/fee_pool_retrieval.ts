import { Transaction } from 'sequelize'
import { sequelize } from '@abx-utils/db-connection-utils'
import { FeePool } from '@abx-types/order'

export async function findAllFeePools(transaction?: Transaction): Promise<FeePool[]> {
  const [feeSum] = await sequelize.query(
    `
      SELECT c.code, CAST(SUM(fee) AS FLOAT) AS pool
      FROM trade_transaction tt
      JOIN currency c ON c.id = tt."feeCurrencyId"
      GROUP BY c.code;
    `,
    {
      transaction,
    },
  )

  return feeSum
}

export async function findFeePool(currencyCode: string, transaction?: Transaction): Promise<FeePool> {
  let response = await sequelize.query(
    `
      SELECT c.code, CAST(SUM(fee) AS FLOAT) AS pool
      FROM trade_transaction tt
      JOIN currency c ON c.id = tt."feeCurrencyId"
      WHERE c.code = :currencyCode
      GROUP BY c.code;
    `,
    {
      transaction,
      plain: true,
      replacements: {
        currencyCode,
      },
    },
  )

  if (!response) {
    response = {
      code: currencyCode,
      pool: 0,
    }
  }

  return response
}
