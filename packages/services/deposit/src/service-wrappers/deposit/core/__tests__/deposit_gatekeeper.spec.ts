import { expect } from 'chai'
import moment from 'moment'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositGatekeeper } from '../framework/deposit_gatekeeper'
import { currencyToDepositRequests, depositRequest } from './data.helper'

describe('deposit_gatekeeper', () => {
  let testGatekeeper: DepositGatekeeper

  beforeEach(() => (testGatekeeper = new DepositGatekeeper('test')))

  describe('getNewestDepositForCurrency', () => {
    it('should return null if no requests present', () => {
      const result = testGatekeeper.getNewestDepositForCurrency(CurrencyCode.kau)

      expect(result).to.eql(null)
    })

    it('should return null if all requests locked', () => {
      testGatekeeper[currencyToDepositRequests].set(CurrencyCode.kau, [{ isLocked: true, request: depositRequest }])

      const result = testGatekeeper.getNewestDepositForCurrency(CurrencyCode.kau)
      expect(result).to.eql(null)
    })

    it('should return request if a non-locked request present', () => {
      testGatekeeper[currencyToDepositRequests].set(CurrencyCode.kau, [{ isLocked: false, request: depositRequest }])

      const result = testGatekeeper.getNewestDepositForCurrency(CurrencyCode.kau)
      expect(result).to.eql(depositRequest)
    })

    it('should not return request if request lockUntil time defined and current time is before lockUntil', () => {
      testGatekeeper[currencyToDepositRequests].set(CurrencyCode.kau, [
        {
          isLocked: false,
          lockedUntil: moment()
            .add(10, 'minutes')
            .toDate(),
          request: depositRequest,
        },
      ])

      const result = testGatekeeper.getNewestDepositForCurrency(CurrencyCode.kau)
      expect(result).to.eql(null)
    })

    it('should return request if request lockUntil time defined and current time is after lockUntil', () => {
      testGatekeeper[currencyToDepositRequests].set(CurrencyCode.kau, [
        {
          isLocked: false,
          lockedUntil: moment()
            .subtract(10, 'minutes')
            .toDate(),
          request: depositRequest,
        },
      ])

      const result = testGatekeeper.getNewestDepositForCurrency(CurrencyCode.kau)
      expect(result).to.eql(depositRequest)
    })
  })

  describe('addNewDepositsForCurrency', () => {
    it('should add request when first request for currency', () => {
      testGatekeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])

      expect(testGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)![0].request).to.eql(depositRequest)
    })

    it('should add request with initial lock time', () => {
      testGatekeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest], 60)

      const requestWrapper = testGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)![0]
      expect(requestWrapper.request).to.eql(depositRequest)
      expect(moment(requestWrapper.lockedUntil).isAfter(moment().add(30, 'seconds'))).to.eql(true)
    })

    it('should append request to requests for currency if requests already exist', () => {
      testGatekeeper[currencyToDepositRequests].set(CurrencyCode.kau, [{ isLocked: false, request: { ...depositRequest, id: 2 } }])
      testGatekeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])

      expect(testGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)!.length).to.eql(2)
    })
  })

  it('unlockRequest should set isLocked flag to false for request', () => {
    testGatekeeper[currencyToDepositRequests].set(CurrencyCode.kau, [{ isLocked: true, request: depositRequest }])

    testGatekeeper.unlockRequest(CurrencyCode.kau, depositRequest.id!)

    expect(testGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)![0].isLocked).to.eql(false)
  })

  it('removeRequest should remove request from gatekeeper', () => {
    testGatekeeper[currencyToDepositRequests].set(CurrencyCode.kau, [{ isLocked: true, request: depositRequest }])

    testGatekeeper.removeRequest(CurrencyCode.kau, depositRequest.id!)

    expect(testGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau)!.length).to.eql(0)
  })
})
