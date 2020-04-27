import { expect } from 'chai'
import * as sinon from 'sinon'
import { CurrencyCode } from '@abx-types/reference-data'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { DepositRequestStatus } from '@abx-types/deposit'
import * as depositRequestOperations from '../../../../../core'
import { 
  processPendingHoldingsTransactionDepositRequestsForCurrency 
} from '../../kinesis/pending_holdings_transaction_processor/pending_holdings_transaction_deposit_processor'
import { currencyToDepositRequests, depositRequest } from '../data.helper'
import { DepositGatekeeper } from '../../framework'

const holdingsTxHash = 'holdingsTxHash'
const transactionFee = 0
const balanceAtAddress = 100

describe('pending_holdings_transaction_deposit_processor', () => {
  let completedPendingHoldingsTransactionGatekeeper: DepositGatekeeper
  let pendingHoldingsTransactionConfirmationGatekeeper: DepositGatekeeper

  beforeEach(async () => {
    completedPendingHoldingsTransactionGatekeeper = new DepositGatekeeper('completedPendingHoldingsTransactionGatekeeper')
    pendingHoldingsTransactionConfirmationGatekeeper = new DepositGatekeeper('pendingHoldingsTransactionConfirmationGatekeeper')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should not execute any logic when no new requests in completedPendingHoldingsTransactionGatekeeper', async () => {
    const updateDepositRequestStub = sinon.stub(depositRequestOperations, 'updateDepositRequest')

    await triggerProcessor(new CurrencyManager())

    expect(updateDepositRequestStub.getCalls().length).to.eql(0)
  })

  it('should transfer amount into holdings wallet if these is a new request', async () => {
    completedPendingHoldingsTransactionGatekeeper.addNewDepositsForCurrency(CurrencyCode.kau, [depositRequest])
    const transferToExchangeHoldingsFromStub = sinon.mock().resolves({
      txHash: holdingsTxHash,
      transactionFee
    })
    const currencyGateway = {
      balanceAt: sinon.mock().resolves(balanceAtAddress),
      transferToExchangeHoldingsFrom: transferToExchangeHoldingsFromStub,
    }
    const currencyManager = {
      getCurrencyFromId: sinon.mock().resolves(currencyGateway)
    }

    const updateDepositRequestStub = sinon.stub(depositRequestOperations, 'updateDepositRequest')

    await triggerProcessor(currencyManager)

    expect(transferToExchangeHoldingsFromStub.getCalls().length).to.eql(1)

    expect(updateDepositRequestStub.getCalls().length).to.eql(1)
    expect(updateDepositRequestStub.getCalls()[0].args[0]).to.eql(depositRequest.id!)
    expect(updateDepositRequestStub.getCalls()[0].args[1]).to.eql({
      holdingsTxHash,
      status: DepositRequestStatus.pendingHoldingsTransactionConfirmation,
      holdingsTxFee: Number(transactionFee),
    })

    expect(completedPendingHoldingsTransactionGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau).length).to.eql(0)
    expect(pendingHoldingsTransactionConfirmationGatekeeper[currencyToDepositRequests].get(CurrencyCode.kau).length).to.eql(1)
  })

  async function triggerProcessor(currencyGateway) {
    await processPendingHoldingsTransactionDepositRequestsForCurrency(
      completedPendingHoldingsTransactionGatekeeper,
      pendingHoldingsTransactionConfirmationGatekeeper,
      CurrencyCode.kau,
      currencyGateway as any,
    )
  }
})



