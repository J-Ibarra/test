import sinon from 'sinon'
import { expect } from 'chai'
import { OPERATOR_ACCOUNT_ID } from './setup.utils'
import { SourceEventType } from '@abx-types/balance'

export async function verifyFeeAddedToOperatorAccount(updateAvailableStub: sinon.SinonStub, fee: number, feeCurrencyId: number) {
  let totalFeeAdded = 0
  updateAvailableStub.getCalls().find(({ args }) => {
    if (args[0].accountId === OPERATOR_ACCOUNT_ID && args[0].currencyId === feeCurrencyId && args[0].sourceEventType === SourceEventType.orderMatch) {
      totalFeeAdded += args[0].amount
    }
  })

  expect(totalFeeAdded).to.be.closeTo(fee, 0.00000000001)
}

export async function verifyReleaseReserveCall(
  releaseReserveStub: sinon.SinonStub,
  accountId: string,
  amount: number,
  currencyId: number,
  sourceEventType: SourceEventType,
) {
  const call = releaseReserveStub
    .getCalls()
    .find(
      ({ args }) =>
        args[0].accountId === accountId &&
        args[0].amount === amount &&
        args[0].currencyId === currencyId &&
        args[0].sourceEventType === sourceEventType,
    )

  expect(!!call).to.eql(true)
}

export async function verifyFinaliseReserveCall(
  finaliseReserveStub: sinon.SinonStub,
  accountId: string,
  amount: number,
  currencyId: number,
  sourceEventType: SourceEventType,
) {
  const call = finaliseReserveStub
    .getCalls()
    .find(
      ({ args }) =>
        args[0].accountId === accountId &&
        args[0].amount === amount &&
        args[0].currencyId === currencyId &&
        args[0].sourceEventType === sourceEventType,
    )

  expect(!!call).to.eql(true)
}

export async function verifyAvailableBalanceUpdateCall(balanceUpdateStub: sinon.SinonStub, accountId: string, amount: number, currencyId: number) {
  const call = balanceUpdateStub.getCalls().find(({ args }) => {
    return (
      args[0].accountId === accountId &&
      args[0].amount === amount &&
      args[0].currencyId === currencyId &&
      args[0].sourceEventType === SourceEventType.orderMatch
    )
  })

  expect(!!call).to.eql(true)
}
