import { expect } from 'chai'
import { calculateMidPrice } from '../market-data/mid_price_calculator'

const symbolId = 'KAU_USD'

describe('mid_price_calc_utils', () => {
  it('should return top of bid if ask depth empty', () => {
    const midPrice = calculateMidPrice({
      symbolId,
      sell: [],
      buy: [{ amount: 10, price: 5 }],
    })

    expect(midPrice).to.eql(5)
  })

  it('should return top of ask if bid depth empty', () => {
    const midPrice = calculateMidPrice({
      symbolId,
      sell: [{ amount: 10, price: 5 }],
      buy: [],
    })

    expect(midPrice).to.eql(5)
  })

  it('should calculate mid price properly if both ask and bid depth present', () => {
    const midPrice = calculateMidPrice({
      symbolId,
      sell: [{ amount: 10, price: 5 }],
      buy: [{ amount: 10, price: 3 }],
    })

    expect(midPrice).to.eql(4)
  })
})
