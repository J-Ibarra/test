import { Sequelize } from 'sequelize'

const oldOrderPriorities = [
  { code: 'KAU', priority: 1 },
  { code: 'KAG', priority: 2 },
  { code: 'KVT', priority: 4 },
  { code: 'BTC', priority: 8 },
  { code: 'ETH', priority: 3 },
  { code: 'USDT', priority: 9 },
  { code: 'USD', priority: 5 },
  { code: 'EUR', priority: 6 },
  { code: 'GBP', priority: 7 },
]

const updatedOrderPriorities = [
  { code: 'KAU', priority: 1 },
  { code: 'KAG', priority: 2 },
  { code: 'KVT', priority: 3 },
  { code: 'BTC', priority: 4 },
  { code: 'ETH', priority: 5 },
  { code: 'USDT', priority: 6 },
  { code: 'USD', priority: 7 },
  { code: 'EUR', priority: 8 },
  { code: 'GBP', priority: 9 },
]

export async function up({ sequelize }: { sequelize: Sequelize }) {
  const updateOrderPriority = updatedOrderPriorities
  .map(
    ({ code, priority }) => `
  UPDATE public.currency
  SET "currencyOrderPriority"=${priority} 
  WHERE code='${code}';
  `,
    )
    .join(' ')

  return sequelize.query(`
    ${updateOrderPriority}
  `)
}

export async function down({ sequelize }: { sequelize: Sequelize }) {
  const updateOrderPriority = oldOrderPriorities
  .map(
    ({ code, priority }) => `
  UPDATE public.currency
  SET "currencyOrderPriority"=${priority} 
  WHERE code='${code}';
  `,
    )
    .join(' ')

  return sequelize.query(`
    ${updateOrderPriority}
  `)
}
