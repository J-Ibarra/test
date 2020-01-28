import axios from 'axios'
import { expect } from 'chai'
import sinon from 'sinon'

import { getEthScanTransactionsForAddress } from './etherscan'
import { EtherscanInternalTransaction, EtherscanTransaction, EthscanTransactionType } from './interface'

const testApiKey = 'testApiKey'
const testApiDomainRoot = 'domainRoot'

describe('Etherscan integration', () => {
  let sandbox
  const testAddress = '0xddd2d4194f183f49adbd2b7516cf2d0c0e5e878b'

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    process.env.ETHERSCAN_API_DOMAIN_ROOT = testApiDomainRoot
    process.env.ETHERSCAN_API_KEY = testApiKey
  })

  afterEach(() => {
    sandbox.restore()
    sinon.restore()
  })

  it('gets normal transactions for address', async () => {
    const normalTransaction = {
      hash: 'normalTransactionHash',
      timeStamp: 1231231,
    } as any
    const axiosStub = sandbox.stub(axios, 'get').callsFake(() => Promise.resolve({ data: { status: '1', result: [normalTransaction] } }))

    const transactions = await getEthScanTransactionsForAddress<EtherscanTransaction>(testAddress)

    expect(
      axiosStub.calledWith(
        `https://${testApiDomainRoot}.etherscan.io/api?module=account&action=${
          EthscanTransactionType.transaction
        }&address=${testAddress}&startblock=0&apikey=${testApiKey}`,
      ),
    ).to.eql(true)
    expect(transactions[0]).to.eql(normalTransaction)
  })

  it('gets internal transactions for address', async () => {
    const internalTransaction = {
      hash: 'normalTransactionHash',
      timeStamp: 1231231,
    } as any
    const axiosStub = sandbox.stub(axios, 'get').callsFake(() => Promise.resolve({ data: { status: '1', result: [internalTransaction] } }))

    const transactions = await getEthScanTransactionsForAddress<EtherscanInternalTransaction>(testAddress, EthscanTransactionType.internal)

    expect(
      axiosStub.calledWith(
        `https://${testApiDomainRoot}.etherscan.io/api?module=account&action=${
          EthscanTransactionType.internal
        }&address=${testAddress}&startblock=0&apikey=${testApiKey}`,
      ),
    ).to.eql(true)
    expect(transactions[0]).to.eql(internalTransaction)
  })
})
