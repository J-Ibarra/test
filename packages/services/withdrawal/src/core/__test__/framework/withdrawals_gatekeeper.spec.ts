import { expect } from 'chai'
import moment from 'moment'
import { CurrencyCode } from '@abx-types/reference-data'
import { CryptoWithdrawalGatekeeper } from '../../framework/withdrawals_gatekeeper'
import { currencyToWithdrawalRequestsKey, withdrawalRequest } from './test-utils'

describe('withdrawal_gatekeeper', () => {
  let testGatekeeper: CryptoWithdrawalGatekeeper
  const currency = {
    id: 2,
    code: CurrencyCode.kau,
  } as any
  const withdrawalRequestWithCurrency = {
    ...withdrawalRequest,
    currency,
  }

  beforeEach(() => (testGatekeeper = new CryptoWithdrawalGatekeeper('test')))

  describe('getNewestDepositForCurrency', () => {
    it('should return null if no requests present', () => {
      const result = testGatekeeper.getLatestWithdrawalForCurrency(CurrencyCode.kau)

      expect(result).to.eql(null)
    })

    it('should return null if all requests locked', () => {
      testGatekeeper[currencyToWithdrawalRequestsKey].set(CurrencyCode.kau, [{ isLocked: true, withdrawalRequest: withdrawalRequestWithCurrency }])

      const result = testGatekeeper.getLatestWithdrawalForCurrency(CurrencyCode.kau)
      expect(result).to.eql(null)
    })

    it('should return request if a non-locked request present', () => {
      testGatekeeper[currencyToWithdrawalRequestsKey].set(CurrencyCode.kau, [{ isLocked: false, withdrawalRequest: withdrawalRequestWithCurrency }])

      const result = testGatekeeper.getLatestWithdrawalForCurrency(CurrencyCode.kau)
      expect(result!.withdrawalRequest).to.eql(withdrawalRequestWithCurrency)
    })

    it('should not return request if request lockUntil time defined and current time is before lockUntil', () => {
      testGatekeeper[currencyToWithdrawalRequestsKey].set(CurrencyCode.kau, [
        {
          isLocked: false,
          lockedUntil: moment()
            .add(10, 'minutes')
            .toDate(),
          withdrawalRequest: withdrawalRequestWithCurrency,
        },
      ])

      const result = testGatekeeper.getLatestWithdrawalForCurrency(CurrencyCode.kau)
      expect(result).to.eql(null)
    })

    it('should return request if request lockUntil time defined and current time is after lockUntil', () => {
      testGatekeeper[currencyToWithdrawalRequestsKey].set(CurrencyCode.kau, [
        {
          isLocked: false,
          lockedUntil: moment()
            .subtract(10, 'minutes')
            .toDate(),
          withdrawalRequest: withdrawalRequestWithCurrency,
        },
      ])

      const result = testGatekeeper.getLatestWithdrawalForCurrency(CurrencyCode.kau)
      expect(result!.withdrawalRequest).to.eql(withdrawalRequestWithCurrency)
    })
  })

  describe('addNewDepositsForCurrency', () => {
    it('should add request when first request for currency', () => {
      const feeRequest = { ...withdrawalRequestWithCurrency, id: 2 }
      testGatekeeper.addNewWithdrawalRequestForCurrency(CurrencyCode.kau, {
        withdrawalRequest: withdrawalRequestWithCurrency,
        feeRequest: feeRequest,
      })

      expect(testGatekeeper[currencyToWithdrawalRequestsKey].get(CurrencyCode.kau)![0].withdrawalRequest).to.eql(withdrawalRequestWithCurrency)
      expect(testGatekeeper[currencyToWithdrawalRequestsKey].get(CurrencyCode.kau)![0].feeRequest).to.eql(feeRequest)
    })

    it('should add request with initial lock time', () => {
      testGatekeeper.addNewWithdrawalRequestForCurrency(CurrencyCode.kau, { withdrawalRequest: withdrawalRequestWithCurrency }, 60)

      const requestWrapper = testGatekeeper[currencyToWithdrawalRequestsKey].get(CurrencyCode.kau)![0]
      expect(requestWrapper.withdrawalRequest).to.eql(withdrawalRequestWithCurrency)
      expect(moment(requestWrapper.lockedUntil).isAfter(moment().add(30, 'seconds'))).to.eql(true)
    })

    it('should append request to requests for currency if requests already exist', () => {
      testGatekeeper[currencyToWithdrawalRequestsKey].set(CurrencyCode.kau, [
        { isLocked: false, withdrawalRequest: { ...withdrawalRequestWithCurrency, id: 2 } },
      ])
      testGatekeeper.addNewWithdrawalRequestForCurrency(CurrencyCode.kau, { withdrawalRequest: withdrawalRequestWithCurrency })

      expect(testGatekeeper[currencyToWithdrawalRequestsKey].get(CurrencyCode.kau)!.length).to.eql(2)
    })
  })

  it('unlockRequest should set isLocked flag to false for request', () => {
    testGatekeeper[currencyToWithdrawalRequestsKey].set(CurrencyCode.kau, [{ isLocked: true, withdrawalRequest: withdrawalRequestWithCurrency }])

    testGatekeeper.unlockRequest(CurrencyCode.kau, withdrawalRequestWithCurrency.id!)

    expect(testGatekeeper[currencyToWithdrawalRequestsKey].get(CurrencyCode.kau)![0].isLocked).to.eql(false)
  })

  it('removeRequest should remove request from gatekeeper', () => {
    testGatekeeper[currencyToWithdrawalRequestsKey].set(CurrencyCode.kau, [{ isLocked: true, withdrawalRequest: withdrawalRequestWithCurrency }])

    testGatekeeper.removeRequest(CurrencyCode.kau, withdrawalRequestWithCurrency.id!)

    expect(testGatekeeper[currencyToWithdrawalRequestsKey].get(CurrencyCode.kau)!.length).to.eql(0)
  })
})
