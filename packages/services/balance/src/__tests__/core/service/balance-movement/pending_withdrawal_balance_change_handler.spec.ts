import { expect } from 'chai'
import sinon from 'sinon'
import { sequelize } from '@abx/db-connection-utils'
import { BalanceChangeParams, SourceEventType } from '@abx-types/balance'
import { PendingWithdrawalBalanceHandler, BalanceRetrievalHandler, BalanceChangeHandler } from '../../../../core'
import { createBalance } from '../../../test_utils'

const currencyId = 1
const accountId = '12314daD'

describe('PendingWithdrawalBalanceHandler', () => {
  let pendingWithdrawalBalanceHandler: PendingWithdrawalBalanceHandler

  beforeEach(() => {
    sinon.restore()
    pendingWithdrawalBalanceHandler = new PendingWithdrawalBalanceHandler()
  })

  afterEach(async () => {
    sinon.restore()
  })

  it('createPendingWithdrawal should fail when available balance less than requested withdrawal', async () => {
    const withdrawalAmount = 50
    const updatePendingWithdrawalStub = sinon.stub(BalanceChangeHandler.prototype, 'updatePendingWithdrawalBalance')
    const updateAvailableBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateAvailableBalance')

    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          availableBalance: withdrawalAmount - 20,
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
        t,
      }

      try {
        await pendingWithdrawalBalanceHandler.createPendingWithdrawal(balanceChangeParams)
      } catch (e) {
        expect(e.message).to.eql('The withdrawal request is larger than the available balance')
        updatePendingWithdrawalStub.neverCalledWith(balanceChangeParams)
        updateAvailableBalanceStub.neverCalledWith({
          ...balanceChangeParams,
          amount: -balanceChangeParams.amount,
        })
      }
    })
  })

  it('createPendingWithdrawal should move funds from available to pending withdrawal', async () => {
    const withdrawalAmount = 50
    const updatePendingWithdrawalStub = sinon.stub(BalanceChangeHandler.prototype, 'updatePendingWithdrawalBalance')
    const updateAvailableBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateAvailableBalance')

    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          availableBalance: withdrawalAmount,
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
        t,
      }

      await pendingWithdrawalBalanceHandler.createPendingWithdrawal(balanceChangeParams)

      updatePendingWithdrawalStub.calledWith(balanceChangeParams)
      updateAvailableBalanceStub.calledWith({
        ...balanceChangeParams,
        amount: -balanceChangeParams.amount,
      })
    })
  })

  it('confirmPendingWithdrawal should should fail when pending withdrawal is less than the confirmation amount', async () => {
    const withdrawalConfirmationAmount = 50
    const updatePendingWithdrawalStub = sinon.stub(BalanceChangeHandler.prototype, 'updatePendingWithdrawalBalance')
    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          pendingWithdrawalBalance: withdrawalConfirmationAmount - 20,
        }),
      ),
    )

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: withdrawalConfirmationAmount,
        t,
      }

      try {
        await pendingWithdrawalBalanceHandler.confirmPendingWithdrawal(balanceChangeParams)
      } catch (e) {
        expect(e.message).to.eql('Pending Withdrawal balance is less than the confirmation amount')
        updatePendingWithdrawalStub.neverCalledWith({
          ...balanceChangeParams,
          amount: -balanceChangeParams.amount,
        })
      }
    })
  })

  it('confirmPendingWithdrawal should deduct the pending amount from pending withdrawal balance', async () => {
    const withdrawalConfirmationAmount = 50
    const updatePendingWithdrawalStub = sinon.stub(BalanceChangeHandler.prototype, 'updatePendingWithdrawalBalance')
    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          pendingWithdrawalBalance: withdrawalConfirmationAmount,
        }),
      ),
    )

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: withdrawalConfirmationAmount,
        t,
      }

      await pendingWithdrawalBalanceHandler.confirmPendingWithdrawal(balanceChangeParams)
      updatePendingWithdrawalStub.calledWith({
        ...balanceChangeParams,
        amount: -balanceChangeParams.amount,
      })
    })
  })

  it('denyPendingWithdrawal should should fail when pending withdrawal balance is less than the denial amount', async () => {
    const withdrawalDenialAmount = 50
    const updatePendingWithdrawalStub = sinon.stub(BalanceChangeHandler.prototype, 'updatePendingWithdrawalBalance')
    const updateAvailableBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateAvailableBalance')

    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          pendingWithdrawalBalance: withdrawalDenialAmount - 20,
        }),
      ),
    )

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: withdrawalDenialAmount,
        t,
      }

      try {
        await pendingWithdrawalBalanceHandler.denyPendingWithdrawal(balanceChangeParams)
      } catch (e) {
        expect(e.message).to.eql('Pending withdrawal balance is less than the denial amount')
        updatePendingWithdrawalStub.neverCalledWith(balanceChangeParams)
        updateAvailableBalanceStub.neverCalledWith(balanceChangeParams)
      }
    })
  })

  it('denyPendingDeposit should deduct the pending amount from pending balance', async () => {
    const withdrawalDenialAmount = 50
    const updatePendingWithdrawalStub = sinon.stub(BalanceChangeHandler.prototype, 'updatePendingWithdrawalBalance')
    const updateAvailableBalanceStub = sinon.stub(BalanceChangeHandler.prototype, 'updateAvailableBalance')

    sinon.stub(BalanceRetrievalHandler.prototype, 'findBalance').callsFake(() =>
      Promise.resolve(
        createBalance({
          accountId,
          currencyId,
          pendingWithdrawalBalance: withdrawalDenialAmount,
        }),
      ),
    )

    await sequelize.transaction(async t => {
      const balanceChangeParams: BalanceChangeParams = {
        sourceEventType: SourceEventType.orderMatch,
        sourceEventId: 1,
        currencyId,
        accountId,
        amount: withdrawalDenialAmount,
        t,
      }

      await pendingWithdrawalBalanceHandler.denyPendingWithdrawal(balanceChangeParams)

      updatePendingWithdrawalStub.calledWith({
        ...balanceChangeParams,
        amount: -balanceChangeParams.amount,
      })
      updateAvailableBalanceStub.calledWith({
        ...balanceChangeParams,
        amount: -balanceChangeParams.amount,
      })
    })
  })
})
