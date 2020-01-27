import { expect } from 'chai'
import sinon from 'sinon'
import { OrderDirection } from '@abx-types/order'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'
import { recordSubscriptionForAccount, emitAskDepthChange, DEPTH_UPDATE_EVENT_PREFIX } from '../depth_update_notification_dispatcher'

describe('depth_update_notification_dispatcher', () => {
  const symbolId = 'KAU_KAG'
  const socketId = '12'

  let account
  let io
  let emit
  beforeEach(async () => {
    account = await createTemporaryTestingAccount()
    emit = sinon.stub()
    recordSubscriptionForAccount(account.id, socketId)

    io = {
      to: () => ({
        emit,
      }),
      request: {
        account,
      },
    }
  })

  it('should record the personal orderAmount, no orders owned by the account', async () => {
    // await recordSubscriptionForAccount(socket)
    const orderAmount = 10
    const orderPrice = 12

    emitAskDepthChange(
      io,
      symbolId,
      [
        {
          amount: orderAmount,
          price: orderPrice,
        },
      ],
      [],
    )

    expect(
      emit.calledWith(`${DEPTH_UPDATE_EVENT_PREFIX}${symbolId}`, {
        direction: OrderDirection.sell,
        aggregateDepth: [
          {
            amount: orderAmount,
            price: orderPrice,
            ownedAmount: 0,
          },
        ],
      }),
    ).to.eql(true)
  }).timeout(60_000)

  it('should record the personal orderAmount, when an order at a given level is owned by the account', async () => {
    // await recordSubscriptionForAccount(socket)
    const personalOrderAmount = 10
    const personalOrderPrice = 12

    emitAskDepthChange(
      io,
      symbolId,
      [
        {
          amount: personalOrderAmount + 1,
          price: personalOrderPrice,
        },
      ],
      [
        {
          id: 1,
          amount: personalOrderAmount,
          remaining: personalOrderAmount,
          symbolId,
          accountId: account.id,
          limitPrice: personalOrderPrice,
          direction: OrderDirection.sell,
        } as any,
      ],
    )

    expect(
      emit.calledWith(`${DEPTH_UPDATE_EVENT_PREFIX}${symbolId}`, {
        direction: OrderDirection.sell,
        aggregateDepth: [
          {
            amount: personalOrderAmount + 1,
            price: personalOrderPrice,
            ownedAmount: personalOrderAmount,
          },
        ],
      }),
    ).to.eql(true)
  }).timeout(60_000)
})
