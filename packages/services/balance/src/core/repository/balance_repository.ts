import { Transaction } from 'sequelize'

import { getModel, sequelize } from '@abx/db-connection-utils'
import { RawBalance } from '@abx-types/balance'
import { BalanceLockParams } from '../balance_movement_facade'

/** The gateway used to fetch {@link RawBalance} from persistent storage */
export class BalanceRepository {
  private static instance: BalanceRepository

  public static getInstance(): BalanceRepository {
    if (!this.instance) {
      this.instance = new BalanceRepository()
    }

    return this.instance
  }

  public async findRawBalances({
    accountId,
    currencyId,
    transaction,
  }: {
    accountId: string
    currencyId?: number
    transaction?: Transaction
  }): Promise<RawBalance[]> {
    const balances = await getModel<RawBalance>('balance').findAll({
      where: !!currencyId ? { currencyId, accountId } : { accountId },
      transaction,
    })

    return balances.map(b => {
      const balance = b.get()

      return {
        ...balance,
      }
    })
  }

  /**
   * Creates a balance of a given type and currency for a user.
   * If an account of that type and currency already exists for the account, the increment is added to the account.
   *
   * @param accountId the account ID
   * @param currencyId the currency ID
   * @param balanceIncrement the balance increment
   * @param balanceTypeId defines the balance type
   * @param transaction the transaction to reuse
   */
  public async updateOrCreateBalance(
    accountId: string,
    currencyId: number,
    balanceIncrement: number,
    balanceTypeId: number,
    transaction?: Transaction,
  ): Promise<RawBalance> {
    await sequelize.query(
      `
          insert into balance ("balanceTypeId", "accountId", "currencyId", "value", "createdAt", "updatedAt")
          values (
            :balanceTypeId,
            :accountId,
            :currencyId,
            :balanceIncrement,
            :createdAt,
            :updatedAt
          )
          on conflict on constraint account_balance
          do
            update
              set "value" = balance."value" + :balanceIncrement, "updatedAt" = :updatedAt;
        `,
      {
        transaction,
        replacements: {
          balanceIncrement,
          accountId,
          currencyId,
          balanceTypeId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    return getModel<RawBalance>('balance')
      .findOne({
        where: { accountId, currencyId, balanceTypeId },
        transaction,
      })
      .then(balanceInstance => balanceInstance!.get())
  }

  public async lockBalancesForAccounts({ accountIds, currencyIds, transaction, timeout = 30_000 }: BalanceLockParams): Promise<boolean> {
    const result = await Promise.race([
      getModel<RawBalance>('balance')
        .findAll({
          where: { accountId: { $in: accountIds }, currencyId: { $in: currencyIds } },
          transaction,
          lock: transaction.LOCK.UPDATE,
        })
        .then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), timeout)),
    ])

    return result as boolean
  }
}
