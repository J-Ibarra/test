import sinon from 'sinon'
import { expect } from 'chai'

import * as coreOperations from '..'
import { DepositAmountCalculator } from '../DepositAmountCalculator'

describe('DepositAmountCalculator', () => {
  const depositAmountCalculator = new DepositAmountCalculator()
  const depositRequest = {
    id: 1,
    amount: 0.007,
  } as any

  afterEach(() => sinon.restore())

  it('should add up all insufficient balance requests', async () => {
    const insufficientBalanceRequests = [
      {
        id: 2,
        amount: 0.001,
      },
      {
        id: 2,
        amount: 0.002,
      },
    ]
    sinon.stub(coreOperations, 'findDepositRequestsWithInsufficientAmount').resolves(insufficientBalanceRequests)

    const { totalAmount, depositsRequestsWithInsufficientStatus } = await depositAmountCalculator.computeTotalAmountToTransfer([depositRequest])

    expect(totalAmount).to.eql(0.01)
    expect(depositsRequestsWithInsufficientStatus).to.eql(insufficientBalanceRequests)
  })
})
