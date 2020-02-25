import { WithdrawalRequest } from '@abx-types/withdrawal'
import { updateWithdrawalRequest } from '../lib'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { expect } from 'chai'
import * as referenceDataOperations from '@abx-service-clients/reference-data'
import * as balanceOperations from '@abx-service-clients/balance'
import * as accountOperatons from '@abx-service-clients/account'

import { Account } from '@abx-types/account'

import sinon from 'sinon'
import { CurrencyCode } from '@abx-types/reference-data'
import { AccountStatus } from '@abx-types/account'
import { createTemporaryTestingAccount } from '@abx-utils/account'

export const updateDumbWithdrawalRequest = ({
  accountId,
  address,
  amount,
  currencyId,
  memo,
  state,
  txHash,
  updatedAt,
  createdAt,
  id,
  account,
  fiatConversion,
  fiatCurrencyCode,
  kauConversion,
}: WithdrawalRequest) => {
  return wrapInTransaction(sequelize, null, async transaction => {
    return updateWithdrawalRequest(
      {
        accountId,
        address,
        amount,
        currencyId,
        memo,
        state,
        txHash,
        updatedAt,
        createdAt,
        id,
        account,
        fiatConversion,
        fiatCurrencyCode,
        kauConversion,
      },
      transaction,
    )
  })
}

export function validatePartialMatch(expected, actual) {
  Object.entries(expected).forEach(([key, expectedValue]) => {
    expect(actual[key]).to.equal(expectedValue)
  })
}

export function stubFindCurrencyForCodesCall(withdrawnCurrencyCode: CurrencyCode, feeCurrencyCode?: CurrencyCode) {
  sinon.stub(referenceDataOperations, 'findCurrencyForCodes').resolves([
    {
      code: withdrawnCurrencyCode,
      id: 1,
    },
    {
      code: feeCurrencyCode || withdrawnCurrencyCode,
      id: 1,
    },
  ])
}

export function stubFindCurrencyBalancesCall(
  withdrawalCurrency: CurrencyCode,
  withdrawnCurrencyBalance: number,
  feeCurrency?: CurrencyCode,
  feeCurrencyBalance?: number,
) {
  sinon.stub(balanceOperations, 'findCurrencyAvailableBalances').resolves(
    feeCurrency
      ? {
          [withdrawalCurrency]: withdrawnCurrencyBalance,
          [feeCurrency]:  feeCurrencyBalance || withdrawnCurrencyBalance,
      }
      : { [withdrawalCurrency]: withdrawnCurrencyBalance },
  )
}

export const USD = {
  id: 5,
  code: CurrencyCode.usd,
}

export const KAU = {
  id: 2,
  code: CurrencyCode.kau,
}

export const stubAccountCreation = async (status: AccountStatus = AccountStatus.kycVerified): Promise<Account> => {
  const account = await createTemporaryTestingAccount()
  sinon.stub(accountOperatons, 'findAccountsByIdWithUserDetails').resolves({ ...account, status })

  return account
}
