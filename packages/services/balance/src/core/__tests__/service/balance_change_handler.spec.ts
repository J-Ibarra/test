import sinon from 'sinon'
import { sequelize } from '@abx-utils/db-connection-utils'
import { BalanceChangeParams, BalanceType, RawBalance, SourceEventType } from '@abx-types/balance'
import { BalanceAdjustmentRepository, BalanceRepository, BalanceChangeHandler } from '../..'

const accountId = 'f3123f'
const currencyId = 1
const amount = 50
const sourceEventId = 12

const balance: RawBalance = {
  id: 1,
  value: 100,
  accountId,
  currencyId,
  balanceTypeId: BalanceType.available,
}

const balanceChangeHandler = new BalanceChangeHandler()

describe('BalanceChangeHandler', () => {
  afterEach(async () => {
    sinon.restore()
  })

  it('lockBalancesForAccounts should delegate to balanceRepository', async () => {
    const lockBalancesForAccountsStub = sinon.stub(BalanceRepository.prototype, 'lockBalancesForAccounts')

    await sequelize.transaction(async t => {
      balanceChangeHandler.lockBalancesForAccounts({ accountIds: [accountId], currencyIds: [currencyId], transaction: t })

      lockBalancesForAccountsStub.calledWith({ accountIds: [accountId], currencyIds: [currencyId], transaction: t })
    })
  })

  it('updatePendingDepositBalance should delegate to balanceRepository and balanceAdjustmentRepository', async () => {
    await verifyOperationDelegatedToRepositories(BalanceType.pendingDeposit, changeParams =>
      balanceChangeHandler.updatePendingDepositBalance(changeParams),
    )
  })

  it('updatePendingWithdrawalBalance should delegate to balanceRepository and balanceAdjustmentRepository', async () => {
    await verifyOperationDelegatedToRepositories(BalanceType.pendingWithdrawal, changeParams =>
      balanceChangeHandler.updatePendingWithdrawalBalance(changeParams),
    )
  })

  it('updateAvailableBalance should delegate to balanceRepository and balanceAdjustmentRepository', async () => {
    await verifyOperationDelegatedToRepositories(BalanceType.available, changeParams => balanceChangeHandler.updateAvailableBalance(changeParams))
  })

  it('updateReservedBalance should delegate to balanceRepository and balanceAdjustmentRepository', async () => {
    await verifyOperationDelegatedToRepositories(BalanceType.reserved, changeParams => balanceChangeHandler.updateReservedBalance(changeParams))
  })
})

const verifyOperationDelegatedToRepositories = async (
  balanceType: BalanceType,
  balanceChangeOperation: (changeParams: BalanceChangeParams) => void,
) => {
  const updateOrCreateBalanceStub = sinon.stub(BalanceRepository.prototype, 'updateOrCreateBalance')
  const createAdjustmentStub = sinon.stub(BalanceAdjustmentRepository.prototype, 'createAdjustment')
  updateOrCreateBalanceStub.callsFake(() => Promise.resolve(balance))

  await sequelize.transaction(async t => {
    const changeParams = {
      sourceEventType: SourceEventType.orderMatch,
      sourceEventId,
      currencyId,
      accountId,
      amount,
      t,
    }
    balanceChangeOperation(changeParams)

    updateOrCreateBalanceStub.calledWith(accountId, currencyId, amount, balanceType, t)
    createAdjustmentStub.calledWith(balance.id!, balance.value!, amount, SourceEventType.orderMatch, sourceEventId)
  })
}
