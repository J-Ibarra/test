import { sequelize } from '@abx/db-connection-utils'
import { BalanceChangeParams, SourceEventType } from '@abx-types/balance'
import * as referenceDataClientOperations from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'

import { expect } from 'chai'
import sinon from 'sinon'
import { ReserveBalanceHandler, BalanceChangeHandler, BalanceRetrievalHandler } from '../../../../core'
import { createBalance } from '../../../test_utils'

const currencyId = 1
const accountId = '12314daD'

describe('ReserveBalanceHandler', () => {
  let reserveBalanceHandler: ReserveBalanceHandler

  beforeEach(async () => {
    reserveBalanceHandler = new ReserveBalanceHandler()
    sinon.stub(referenceDataClientOperations, 'getCurrencyCode').resolves(CurrencyCode.kau)
    sinon.stub(referenceDataClientOperations, 'findBoundaryForCurrency').resolves({ maxDecimals: 10 })
  })

  afterEach(async () => {
    sinon.restore()
  })

  it('createReserve should fail when available balance less than requested amouunt', async () => {
    const reserveAmount = 50
    const updateReserveStub = sinon.stub(BalanceChangeHandler.prototype, 'updateReservedBalance')
    const updateAvailableBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateAvailableBalance')

    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          availableBalance: reserveAmount - 20,
        }),
      ),
    )

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: reserveAmount,
        t,
      }

      try {
        await reserveBalanceHandler.createReserve(balanceChangeParams)
      } catch (e) {
        expect(e.message).to.eql(
          `Available balance is less than the reserve value. createReserveAmount: ${reserveAmount} . db reserved balance: ${reserveAmount - 20}`,
        )
        updateReserveStub.neverCalledWith(balanceChangeParams)
        updateAvailableBalanceStub.neverCalledWith({
          ...balanceChangeParams,
          amount: -balanceChangeParams.amount,
        })
      }
    })
  })

  it('createReserve should move funds from available to reserve', async () => {
    const reserveAmount = 50
    const updateReserveBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateReservedBalance')
    const updateAvailableBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateAvailableBalance')

    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          pendingDepositBalance: reserveAmount,
        }),
      ),
    )

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: reserveAmount,
        t,
      }

      await reserveBalanceHandler.createReserve(balanceChangeParams)

      updateReserveBalanceStub.calledWith(balanceChangeParams)
      updateAvailableBalanceStub.calledWith({
        ...balanceChangeParams,
        amount: -balanceChangeParams.amount,
      })
    })
  })

  it('releaseReserve should should fail when reserved amount is less than the release amount', async () => {
    const releaseAmount = 50
    const updateReservedBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateReservedBalance')
    const updateAvailableBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateAvailableBalance')

    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          reservedBalance: releaseAmount - 20,
        }),
      ),
    )

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: releaseAmount,
        t,
      }

      try {
        await reserveBalanceHandler.releaseReserve(balanceChangeParams)
      } catch (e) {
        expect(e.message).to.eql(
          `Reserved balance is less than the release amount. releaseReserveAmount: ${releaseAmount} . db reserved balance: ${releaseAmount - 20}`,
        )
        updateReservedBalanceStub.neverCalledWith({
          ...balanceChangeParams,
          amount: -balanceChangeParams.amount,
        })
        updateAvailableBalanceStub.neverCalledWith(balanceChangeParams)
      }
    })
  })

  it('releaseReserve should deduct the release amount from reserved balance and add it to the available balance', async () => {
    const releaseAmount = 50
    const updateReservedBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateReservedBalance')
    const updateAvailableBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateAvailableBalance')

    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          reservedBalance: releaseAmount,
        }),
      ),
    )

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: releaseAmount,
        t,
      }

      await reserveBalanceHandler.releaseReserve(balanceChangeParams)
      updateReservedBalanceStub.neverCalledWith({
        ...balanceChangeParams,
        amount: -balanceChangeParams.amount,
      })
      updateAvailableBalanceStub.neverCalledWith(balanceChangeParams)
    })
  })

  it('finaliseReserve should fail when reserved balance is less than the initial reserve amount', async () => {
    const initialReserveAmount = 50
    const updateReserveBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateReservedBalance')
    const updateAvailableBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateAvailableBalance')

    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          reservedBalance: initialReserveAmount - 20,
        }),
      ),
    )

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: 50,
        initialReserve: initialReserveAmount,
        t,
      }

      try {
        await reserveBalanceHandler.finaliseReserve(balanceChangeParams)
      } catch (e) {
        expect(e.message).to.eql(
          `Reserved balance is less than the calculated initial reserve. initialReserve: ${initialReserveAmount} . db reserved balance: ${initialReserveAmount -
            20}`,
        )
        updateReserveBalanceStub.neverCalledWith({
          ...balanceChangeParams,
          amount: -balanceChangeParams.amount,
        })
        updateAvailableBalanceStub.neverCalledWith(balanceChangeParams)
      }
    })
  })

  it('finaliseReserve should fail when amount is bigger than the initial reserve', async () => {
    const updateReserveBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateReservedBalance')
    const updateAvailableBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateAvailableBalance')

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: 50,
        initialReserve: 30,
        t,
      }

      try {
        await reserveBalanceHandler.finaliseReserve(balanceChangeParams)
      } catch (e) {
        expect(e.message).to.eql('Release amount is bigger than the initial reserve. Trade amount 50 and reserve: 30 and transaction 1')
        updateReserveBalanceStub.calledWith(balanceChangeParams)
        updateAvailableBalanceStub.calledWith(balanceChangeParams)
      }
    })
  })

  it('finaliseReserve should rebate the surplus (initial reserve - amount) to available balance and deduct initial reserve from reserved balance', async () => {
    const initialReserve = 50
    const amount = 45
    const updateReserveBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateReservedBalance')
    const updateAvailableBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateAvailableBalance')

    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          reservedBalance: initialReserve,
        }),
      ),
    )

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount,
        initialReserve,
        t,
      }

      await reserveBalanceHandler.finaliseReserve(balanceChangeParams)
      updateReserveBalanceStub.calledWith({
        ...balanceChangeParams,
        amount: -balanceChangeParams.initialReserve!,
      })
      updateAvailableBalanceStub.calledWith({
        ...balanceChangeParams,
        amount: initialReserve - amount,
      })
    })
  })
})
