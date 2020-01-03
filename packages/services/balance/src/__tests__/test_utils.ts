import { Transaction } from 'sequelize'
import { getModel } from '@abx/db-connection-utils'
import { BalanceType, RawBalance } from '@abx-types/balance'

export const createAvailableBalance = async (
  accountId: string,
  balance: number,
  currencyId: number,
  transaction?: Transaction,
): Promise<RawBalance> => {
  return (
    await getModel<RawBalance>('balance').create(
      {
        accountId,
        currencyId,
        balanceTypeId: BalanceType.available,
        value: balance,
      },
      { transaction },
    )
  ).get()
}

export const createReservedBalance = async (accountId: string, balance: number, currencyId: number, transaction?: Transaction) => {
  return (
    await getModel<RawBalance>('balance').create(
      {
        accountId,
        currencyId,
        balanceTypeId: BalanceType.reserved,
        value: balance,
      },
      { transaction },
    )
  ).get()
}

export const createBalance = ({
  currencyId,
  accountId,
  pendingDepositBalance = 100,
  availableBalance = 100,
  reservedBalance = 100,
  pendingWithdrawalBalance = 100,
  pendingRedemptionBalance = 100,
  pendingDebitCardTopUpBalance = 100,
  currency = undefined,
}) => ({
  accountId,
  currencyId,
  currency,
  pendingDeposit: {
    value: pendingDepositBalance,
  },
  available: {
    value: availableBalance,
  },
  reserved: {
    value: reservedBalance,
  },
  pendingWithdrawal: {
    value: pendingWithdrawalBalance,
  },
  pendingRedemption: {
    value: pendingRedemptionBalance,
  },
  pendingDebitCardTopUp: {
    value: pendingDebitCardTopUpBalance,
  },
})
