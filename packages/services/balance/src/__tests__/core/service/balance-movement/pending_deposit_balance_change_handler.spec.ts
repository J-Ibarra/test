import { expect } from 'chai'
import sinon from 'sinon'
import { sequelize } from '@abx/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { BalanceChangeParams, SourceEventType } from '@abx-types/balance'
import * as referenceDataClientOperations from '@abx-service-clients/reference-data'
import { PendingDepositBalanceHandler, BalanceChangeHandler, BalanceRetrievalHandler } from '../../../../core'
import { createBalance } from '../../../test_utils'

const currencyId = 1
const accountId = '12314daD'

describe('PendingDepositBalanceHandler', () => {
  let pendingDepositBalanceHandler: PendingDepositBalanceHandler

  beforeEach(() => {
    pendingDepositBalanceHandler = new PendingDepositBalanceHandler()
    sinon.stub(referenceDataClientOperations, 'getCurrencyCode').resolves(CurrencyCode.kau)
  })

  afterEach(async () => {
    sinon.restore()
  })

  it('createPendingDeposit should use balanceChangeHandler to update pending deposit balance', async () => {
    const updatePendingDepositStub = sinon.stub(BalanceChangeHandler.prototype, 'updatePendingDepositBalance')
    updatePendingDepositStub.callsFake(() => Promise.resolve())

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: 50,
        t,
      }

      pendingDepositBalanceHandler.createPendingDeposit(balanceChangeParams)
      updatePendingDepositStub.calledWith(balanceChangeParams)
    })
  })

  it('confirmPendingDeposit should should fail when pending deposit balance is less than the confirmation amount', async () => {
    const confirmationAmount = 50
    const updatePendingDepositStub = sinon.stub(BalanceChangeHandler.prototype, 'updatePendingDepositBalance')
    const updateAvailableBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateAvailableBalance')
    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          pendingDepositBalance: confirmationAmount - 20,
        }),
      ),
    )

    updatePendingDepositStub.callsFake(() => Promise.resolve())

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: confirmationAmount,
        t,
      }

      try {
        await pendingDepositBalanceHandler.confirmPendingDeposit(balanceChangeParams)
      } catch (e) {
        expect(e.message).to.eql('Pending Deposit balance is less than the confirmation amount')
        updatePendingDepositStub.neverCalledWith({ ...balanceChangeParams, amount: -balanceChangeParams.amount })
        updateAvailableBalanceStub.neverCalledWith(balanceChangeParams)
      }
    })
  })

  it('confirmPendingDeposit should deduct the pending amount from pending balance and add it to available balance', async () => {
    const confirmationAmount = 50
    const updatePendingDepositStub = sinon.stub(BalanceChangeHandler.prototype, 'updatePendingDepositBalance')
    const updateAvailableBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateAvailableBalance')
    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          currencyId,
          accountId,
          pendingDepositBalance: confirmationAmount,
        }),
      ),
    )

    updatePendingDepositStub.callsFake(() => Promise.resolve())

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: confirmationAmount,
        t,
      }

      await pendingDepositBalanceHandler.confirmPendingDeposit(balanceChangeParams)
      updatePendingDepositStub.calledWith({ ...balanceChangeParams, amount: -balanceChangeParams.amount })
      updateAvailableBalanceStub.calledWith(balanceChangeParams)
    })
  })

  it('denyPendingDeposit should should fail when pending deposit balance is less than the denial amount', async () => {
    const confirmationAmount = 50
    const updatePendingDepositStub = sinon.stub(BalanceChangeHandler.prototype, 'updatePendingDepositBalance')
    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          pendingDepositBalance: confirmationAmount - 20,
        }),
      ),
    )

    updatePendingDepositStub.callsFake(() => Promise.resolve())

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: confirmationAmount,
        t,
      }

      try {
        await pendingDepositBalanceHandler.denyPendingDeposit(balanceChangeParams)
      } catch (e) {
        expect(e.message).to.eql('Pending deposit balance is less than the denial amount')
        updatePendingDepositStub.neverCalledWith({ ...balanceChangeParams, amount: -balanceChangeParams.amount })
      }
    })
  })

  it('denyPendingDeposit should deduct the pending amount from pending balance', async () => {
    const confirmationAmount = 50
    const updatePendingDepositStub = sinon.stub(BalanceChangeHandler.prototype, 'updatePendingDepositBalance')
    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          pendingDepositBalance: confirmationAmount,
        }),
      ),
    )

    updatePendingDepositStub.callsFake(() => Promise.resolve())

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: confirmationAmount,
        t,
      }

      await pendingDepositBalanceHandler.denyPendingDeposit(balanceChangeParams)
      updatePendingDepositStub.calledWith({ ...balanceChangeParams, amount: -balanceChangeParams.amount })
    })
  })
})
