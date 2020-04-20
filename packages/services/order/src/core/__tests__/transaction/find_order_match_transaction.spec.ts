import { expect } from 'chai'

import { findLastOrderMatchForSymbol, findLastOrderMatchForSymbols } from '../../transaction/find_order_match_transaction'
import { createTemporaryTestingAccount } from '@abx-utils/account'
import { createDumbOrder, createDumbOrderMatchTransaction } from '../utils'
import { OrderDirection } from '@abx-types/order'

describe('find_order_match_transaction', () => {
  it('findLastOrderMatchForSymbol', async () => {
    const account1 = await createTemporaryTestingAccount()
    const account2 = await createTemporaryTestingAccount()

    const order = await createDumbOrder(1, 2, account1.id, { id: 'KAU_USD' }, OrderDirection.buy)
    const orderTwo = await createDumbOrder(1, 2, account2.id, { id: 'KAU_USD' }, OrderDirection.sell)
    await createDumbOrderMatchTransaction(10, 12, account1.id, order.id, account2.id, orderTwo.id, { id: 'KAU_USD' })
    await createDumbOrderMatchTransaction(10, 14, account1.id, order.id, account2.id, orderTwo.id, { id: 'KAU_USD' })

    const lastOrderMatch = await findLastOrderMatchForSymbol('KAU_USD')

    expect(lastOrderMatch.matchPrice).to.eql(14)
  })

  it('findLastOrderMatchForSymbols', async () => {
    const account1 = await createTemporaryTestingAccount()
    const account2 = await createTemporaryTestingAccount()

    const kauUsdOrder = await createDumbOrder(1, 2, account1.id, { id: 'KAU_USD' }, OrderDirection.buy)
    const KauUsdOrderTwo = await createDumbOrder(1, 2, account2.id, { id: 'KAU_USD' }, OrderDirection.sell)
    await createDumbOrderMatchTransaction(10, 12, account1.id, kauUsdOrder.id, account2.id, KauUsdOrderTwo.id, { id: 'KAU_USD' })
    await createDumbOrderMatchTransaction(10, 14, account1.id, kauUsdOrder.id, account2.id, KauUsdOrderTwo.id, { id: 'KAU_USD' })

    const kauKagOrder = await createDumbOrder(1, 2, account1.id, { id: 'KAU_KAG' }, OrderDirection.buy)
    const kauKagOrderTwo = await createDumbOrder(1, 2, account2.id, { id: 'KAU_KAG' }, OrderDirection.sell)
    await createDumbOrderMatchTransaction(10, 12, account1.id, kauKagOrder.id, account2.id, kauKagOrderTwo.id, { id: 'KAU_KAG' })
    await createDumbOrderMatchTransaction(10, 15, account1.id, kauKagOrder.id, account2.id, kauKagOrderTwo.id, { id: 'KAU_KAG' })

    const lastOrderMatches = await findLastOrderMatchForSymbols(['KAU_USD', 'KAU_KAG'])

    expect(lastOrderMatches[0].matchPrice).to.eql(14)
    expect(lastOrderMatches[1].matchPrice).to.eql(15)
  })
})
