import { expect } from 'chai'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'
import { sequelize, getModel, wrapInTransaction } from '@abx/db-connection-utils'
import { BalanceType, RawBalance } from '@abx-types/balance'
import { createAvailableBalance, createReservedBalance } from '../test_utils'
import { BalanceRepository } from '../..'

const currencyId = 1

describe('BalanceRepository', () => {
  const balanceRepository = BalanceRepository.getInstance()
  let accountId

  beforeEach(async () => {
    // await truncateTables()
    const { id } = await createTemporaryTestingAccount()

    accountId = id
  })

  it('findRawBalances should find balance for currency and account', async () => {
    const availableBalance = await createAvailableBalance(accountId, 150, currencyId)
    const reservedBalance = await createReservedBalance(accountId, 200, currencyId)

    const balances = await balanceRepository.findRawBalances({ accountId, currencyId })
    expect(balances.length).to.eql(2)
    expect(balances.find(balance => balance.balanceTypeId === BalanceType.reserved)).to.eql({
      ...reservedBalance,
    })
    expect(balances.find(balance => balance.balanceTypeId === BalanceType.available)).to.eql({
      ...availableBalance,
    })
  })

  it('findRawBalances should retrieve all balances for account', async () => {
    const availableBalanceCurrency1 = await createAvailableBalance(accountId, 150, currencyId)
    const availableBalanceCurrency2 = await createAvailableBalance(accountId, 200, 2)

    const balances = await balanceRepository.findRawBalances({ accountId })
    expect(balances.length).to.eql(2)
    expect(balances.find(balance => balance.currencyId === currencyId)).to.eql({
      ...availableBalanceCurrency1,
    })
    expect(balances.find(balance => balance.currencyId === 2)).to.eql(availableBalanceCurrency2)
  })

  it('updateOrCreateBalanceWithAdjustment creates a new balance if it doesnt exist', async () => {
    const balanceCreated = await balanceRepository.updateOrCreateBalance(accountId, 1, 150, BalanceType.available)
    const balanceRetrievedFromDb = (await getModel<RawBalance>('balance').findOne({
      where: { currencyId, accountId, balanceTypeId: BalanceType.available },
    }))!.get()

    expect(balanceRetrievedFromDb).to.eql(balanceCreated)
  })

  it('updateOrCreateBalanceWithAdjustment updates an existing balance', async () => {
    const initialBalance = 150
    const balanceIncrement = 100
    await createAvailableBalance(accountId, initialBalance, currencyId)
    await balanceRepository.updateOrCreateBalance(accountId, 1, balanceIncrement, BalanceType.available)

    const updatedBalance = (await getModel<RawBalance>('balance').findOne({
      where: { currencyId, accountId, balanceTypeId: BalanceType.available },
    }))!.get()

    expect(updatedBalance.value).to.eql(initialBalance + balanceIncrement)
  })

  it('lockBalancesForAccounts should lock all balance for accounts, blocking updates from any other transactions', async () => {
    await createAvailableBalance(accountId, 150, currencyId)
    await createReservedBalance(accountId, 100, currencyId)

    await sequelize.transaction(async transaction => {
      await balanceRepository.lockBalancesForAccounts({ accountIds: [accountId], currencyIds: [currencyId], transaction })

      const waitPromise = new Promise(resolve => {
        const wait = setTimeout(() => {
          clearTimeout(wait)
          resolve('PromiseB')
        }, 400)
      })

      await Promise.race([waitPromise, balanceRepository.updateOrCreateBalance(accountId, currencyId, 100, BalanceType.available)]).then(result =>
        expect(result).to.eql('PromiseB'),
      )
    })
  })

  it('lockBalancesForAccounts should lock all balance for accounts, returning false after the timeout if lock could not be acquired', async () => {
    await createAvailableBalance(accountId, 150, currencyId)

    await wrapInTransaction(sequelize, null, async t => {
      const lockAcquiredFirstTransaction = await balanceRepository.lockBalancesForAccounts({
        accountIds: [accountId],
        currencyIds: [currencyId],
        transaction: t,
      })
      expect(lockAcquiredFirstTransaction).to.eql(true)

      await sequelize.transaction({ autocommit: true }).then(async t1 => {
        const lockAcquiredSecondTransaction = await balanceRepository.lockBalancesForAccounts({
          accountIds: [accountId],
          currencyIds: [currencyId],
          transaction: t1,
          timeout: 500,
        })

        expect(lockAcquiredSecondTransaction).to.eql(false)
        t1.rollback()
      })
    })

    // Should be able to acquire lock after first transaction has completed
    await wrapInTransaction(sequelize, null, async t => {
      const lockAcquiredThirdTransaction = await balanceRepository.lockBalancesForAccounts({
        accountIds: [accountId],
        currencyIds: [currencyId],
        transaction: t,
      })
      expect(lockAcquiredThirdTransaction).to.eql(true)
    })
  })
})
