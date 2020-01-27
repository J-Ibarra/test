import { expect } from 'chai'
import * as sinon from 'sinon'
import { TestCurrencyManager } from '@abx-query-libs/blockchain-currency-gateway'
import { CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import { DepositRequestStatus } from '@abx-types/deposit'
import * as depositAddressOperations from '../../../../core/deposit_address'
import * as depositRequestOperations from '../../../../core/deposit_request'
import * as potentialDepositRequestOperations from '../deposit_transactions_fetcher'
import { checkForNewDepositsForCurrency } from '../framework/new_deposits_poller'
import { DepositGatekeeper } from '../framework'

describe('new_deposits_poller', () => {
  let testCurrencyManager: TestCurrencyManager
  let pendingHoldingsTransferGatekeeper: DepositGatekeeper

  beforeEach(async () => {
    testCurrencyManager = new TestCurrencyManager()
    pendingHoldingsTransferGatekeeper = new DepositGatekeeper('test')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should not retrieve the current pending deposit requests if no new potential deposit requests', async () => {
    sinon.stub(potentialDepositRequestOperations, 'getPotentialDepositRequests').resolves([])
    sinon.stub(depositAddressOperations, 'findKycOrEmailVerifiedDepositAddresses').resolves([])

    const getDepositRequestsStub = sinon.stub(depositRequestOperations, 'getPendingDepositRequests')

    await checkForNewDepositsForCurrency(pendingHoldingsTransferGatekeeper, CurrencyCode.kau, testCurrencyManager)

    expect(getDepositRequestsStub.getCalls().length).to.eql(1)
  })

  it('should retrieve the current pending deposit requests and persist all new potential deposit requests + add them to gatekeeper', async () => {
    const newDeposit = {
      id: 1,
      depositAddress: 1,
      amount: 100,
      depositTxHash: 'depositHash',
      from: 'foo',
      status: DepositRequestStatus.pendingHoldingsTransaction,
      fiatConversion: 100,
      fiatCurrencyCode: FiatCurrency.usd,
    }
    sinon.stub(potentialDepositRequestOperations, 'getPotentialDepositRequests').resolves([newDeposit])

    sinon.stub(depositAddressOperations, 'findKycOrEmailVerifiedDepositAddresses').resolves([
      {
        id: 1,
        accountId: 'accId',
        currencyId: 1,
        encryptedPrivateKey: '123',
        publicKey: 'publicKey',
      },
    ])
    sinon.stub(depositRequestOperations, 'getPendingDepositRequests').resolves([])
    const storeDepositRequestsStub = sinon.stub(depositRequestOperations, 'storeDepositRequests').resolves([newDeposit])

    await checkForNewDepositsForCurrency(pendingHoldingsTransferGatekeeper, CurrencyCode.kau, testCurrencyManager)

    expect(storeDepositRequestsStub.getCall(0).args[0]).to.eql([newDeposit])

    const newDepositRequest = pendingHoldingsTransferGatekeeper.getNewestDepositForCurrency(CurrencyCode.kau)
    expect(newDepositRequest).to.eql(newDeposit)
  }).timeout(60_000)
})
