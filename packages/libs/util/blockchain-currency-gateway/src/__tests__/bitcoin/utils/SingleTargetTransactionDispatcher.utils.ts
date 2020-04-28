import sinon from 'sinon'

export const withdrawalAmount = 10
export const bitcoinConfirmationBlocks = 3
export const average = '0.00003620'
export const average_fee_per_byte = '0.00000010'
export const tx_size_bytes = 100
export const transactionId = 'txid1'
export const transactionHex = 'txHex'
export const signedTransactionHex = 'signedTxHex'

export const singleTargetCreateTransactionPayload = (subtractFeeFromAmountSent = true) => {
  return {
    senderAddress: {
      privateKey: 'pk',
      address: 'address',
      wif: 'wif',
    },
    receiverAddress: '',
    amount: withdrawalAmount,
    memo: 'foo',
    feeLimit: 12,
    subtractFeeFromAmountSent
  }
}

export let getTransactionsFeeStub = sinon.stub()
export let getTransactionSizeStub = sinon.stub()
export let createTransactionStub = sinon.stub()
export let signTransactionStub = sinon.stub()
export let broadcastTransactionStub = sinon.stub()
export let createConfirmedTransactionEventSubscriptionStub = sinon.stub()

export const cryptoApiClient = {
  getTransactionsFee: getTransactionsFeeStub,
  getTransactionSize: getTransactionSizeStub,
  createTransaction: createTransactionStub,
  signTransaction: signTransactionStub,
  broadcastTransaction: broadcastTransactionStub,
  createConfirmedTransactionEventSubscription: createConfirmedTransactionEventSubscriptionStub,
} as any

export function resetStubs() {
  getTransactionsFeeStub = sinon.stub()
  getTransactionSizeStub = sinon.stub()
  createTransactionStub = sinon.stub()
  createConfirmedTransactionEventSubscriptionStub = sinon.stub()
  signTransactionStub = sinon.stub()
  broadcastTransactionStub = sinon.stub()
}
