import { orderBy } from 'lodash'
import { Transaction } from 'sequelize'
import { sequelize, getModel, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { getAllSymbolPairSummaries } from '@abx-service-clients/reference-data'
import { FeeTier } from '@abx-types/order'
import { DefaultFeeTierInstance } from '../../model/default_execution_fee'
import { validateTiers } from './validation-utils'

export async function getAllDefaultFeeTiers(): Promise<Record<string, FeeTier[]>> {
  const symbols = await getAllSymbolPairSummaries()

  const instances = await getModel<DefaultFeeTierInstance>('defaultExecutionFee').findAll({
    order: [['tier', 'ASC']],
    where: {
      symbolId: {
        $in: symbols.map(sym => sym.id),
      },
    },
  })

  const defaultFeeTiers = instances.map(i => i.get())

  return defaultFeeTiers.reduce((symbolToFeeTiers, feeTier) => {
    const feeTiersForSymbol = symbolToFeeTiers[feeTier.symbolId] || []

    return {
      ...symbolToFeeTiers,
      [feeTier.symbolId]: orderBy(feeTiersForSymbol.concat(feeTier), 'tier'),
    }
  }, {})
}

/**
 * Retrieves the default fee tiers for a symbol, ordered by tier.
 *
 * @param symbolId the symbol id
 * @param transaction the parent transaction
 * @returns the default fee tiers
 */
export async function getDefaultFeeTiersForSymbol(symbolId: string, transaction?: Transaction): Promise<FeeTier[]> {
  const instances = await getModel<DefaultFeeTierInstance>('defaultExecutionFee').findAll({
    where: { symbolId },
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
export function setDefaultFeeTiers(tiers: FeeTier[], transaction?: Transaction) {
  return wrapInTransaction(sequelize, transaction, async t => {
    validateTiers(tiers)

    return Promise.all(tiers.map(tier => updateOrCreateDefaultTier(tier, t)))
  })
}

async function updateOrCreateDefaultTier(defaultFeeTier: FeeTier, t) {
  const { symbolId, tier, threshold, rate } = defaultFeeTier

  return sequelize.query(
    `
      insert into default_execution_fee ("symbolId", tier, threshold, rate, "createdAt", "updatedAt")
      values (
        :symbolId,
        :tier,
        :threshold,
        :rate,
        :createdAt,
        :updatedAt
      )
      on conflict on constraint default_exec_fees_per_symbol_and_tier
      do
        update
          set
            "threshold" = :threshold,
            "rate" = :rate,
            "updatedAt" = :updatedAt;
    `,
    {
      transaction: t,
      replacements: {
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
