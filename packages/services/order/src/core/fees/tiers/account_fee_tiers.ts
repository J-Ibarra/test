import { every } from 'lodash'
import { Transaction } from 'sequelize'
import { sequelize, getModel, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { AccountFeeTier } from '@abx-types/order'
import { AccountFeeTierInstance } from '../../model/account_execution_fee'
import { validateTiers } from './validation-utils'

/**
 * Retrieves the account level fees for an account and symbol, ordered by tier.
 *
 * @param accountId the account id
 * @param symbolId the symbol id
 * @param transaction the parent transaction
 * @returns the account fee tiers
 */
export async function getAccountFeeTiersForSymbol(accountId: string, symbolId: string, transaction?: Transaction): Promise<AccountFeeTier[]> {
  const instances = await getModel<AccountFeeTierInstance>('accountExecutionFee').findAll({
    where: { symbolId, accountId },
    order: [['tier', 'ASC']],
    transaction,
  })

  return instances.map(i => i.get())
}

export async function getAccountFeeTiersForAllSymbols(accountId: string, transaction?: Transaction): Promise<AccountFeeTier[]> {
  const instances = await getModel<AccountFeeTierInstance>('accountExecutionFee').findAll({
    where: {
      accountId,
    },
    order: [['tier', 'ASC']],
    transaction,
  })

  return instances.map(i => i.get())
}

/**
 * Sets (creates/updates) account level fee tiers, provided the tiers are valid.
 *
 * @param tiers the tiers to upsert
 * @param transaction the parent transaction
 */
export function setAccountFeeTiers(tiers: AccountFeeTier[], transaction?: Transaction) {
  return wrapInTransaction(sequelize, transaction, async t => {
    validateTiers(tiers, [allTiersForTheSameAccount])

    return Promise.all(tiers.map(tier => updateOrCreateAccountFeeTier(tier, t)))
  })
}

function allTiersForTheSameAccount(tiers: AccountFeeTier[]): boolean {
  return every(tiers, ({ accountId }, index) => index === 0 || tiers[index - 1].accountId === accountId)
}

async function updateOrCreateAccountFeeTier({ accountId, symbolId, tier, threshold, rate }: AccountFeeTier, transaction: Transaction) {
  return sequelize.query(
    `
      insert into account_execution_fee ("accountId", "symbolId", tier, threshold, rate, "createdAt", "updatedAt")
      values (
        :accountId,
        :symbolId,
        :tier,
        :threshold,
        :rate,
        :createdAt,
        :updatedAt
      )
      on conflict on constraint account_exec_fees_per_account_symbol_and_tier
      do
        update
          set
            "threshold" = :threshold,
            "rate" = :rate,
            "updatedAt" = :updatedAt;
    `,
    {
      transaction,
      replacements: {
        accountId,
        symbolId,
        tier,
        threshold,
        rate,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  )
}
