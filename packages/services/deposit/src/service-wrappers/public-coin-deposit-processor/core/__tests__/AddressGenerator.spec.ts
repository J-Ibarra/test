import sinon from 'sinon'
import { expect } from 'chai'

import * as depositAddressOperations from '../../../../core'

import { AddressGenerator } from '../address-generation/AddressGenerator'
import { CurrencyCode } from '@abx-types/reference-data'
import { EWebhookEvents, BlockchainFacade } from '@abx-utils/blockchain-currency-gateway'
import * as referenceDataOperations from '@abx-service-clients/reference-data'

describe('AddressGenerator', () => {
  const addressGenerator = new AddressGenerator()
  const accountId = 'acc-id'
  const currency = {
    id: 1,
    code: CurrencyCode.ethereum,
  }

  const blockchainFacade = {
    generateAddress: sinon.stub(),
    subscribeToAddressTransactionEvents: sinon.stub(),
  } as any

  beforeEach(() => {
    sinon.restore()
  })

  describe('addAddressTransactionListener', () => {
    it('addressDetails not found', async () => {
      sinon.stub(depositAddressOperations, 'findDepositAddress').resolves(null)

      try {
        await addressGenerator.addAddressTransactionListener(accountId, currency)
      } catch (e) {
        expect(e.message).to.eql(`Currency address not not found: ${currency.code}`)
      }
    })

    it('addressDetails does not have a wif (e.g. KAU/KAG/KVT)', async () => {
      sinon.stub(depositAddressOperations, 'findDepositAddress').resolves({
        id: 1,
      })

      try {
        await addressGenerator.addAddressTransactionListener(accountId, currency)
      } catch (e) {
        expect(e.message).to.eql(`Address transaction subscriptions no supported for ${currency.code}`)
      }
    })

    it('addressDetails is a valid crypto address, subscription created', async () => {
      const depositAddress = {
        id: 1,
        encryptedWif: 'encr-wif',
        address: 'address',
      }

      sinon.stub(depositAddressOperations, 'findDepositAddress').resolves(depositAddress)

      const eventPayload = {
        uid: '1',
        event: EWebhookEvents.ADDRESS,
        confirmations: 1,
        address: 'address',
        url: 'address-transaction-url',
        created: new Date().toString(),
        active: true,
      }

      blockchainFacade.subscribeToAddressTransactionEvents.resolves(eventPayload)
      sinon.stub(BlockchainFacade, 'getInstance').returns(blockchainFacade)

      const addressTransactionEvent = await addressGenerator.addAddressTransactionListener(accountId, currency)
      expect(addressTransactionEvent)
    })
  })

  describe('generateDepositAddress', () => {
    it('should not generate a new address if address already exists', async () => {
      const currencyId = 1
      const depositAddress = {
        id: 1,
        currencyId,
      }

      sinon.stub(depositAddressOperations, 'findDepositAddressesForAccount').resolves([depositAddress])
      sinon.stub(referenceDataOperations, 'findCurrencyForCode').resolves({
        id: currencyId,
      })

      sinon.stub(BlockchainFacade, 'getInstance').returns(blockchainFacade)

      const depositAddressRetrieved = await addressGenerator.generateDepositAddress(accountId, CurrencyCode.bitcoin)
      expect(blockchainFacade.generateAddress.calledOnce).to.eql(false)
      expect(depositAddressRetrieved).to.eql(depositAddress)
    })

    it('should generate a new address if address does not exist', async () => {
      const currencyId = 1
      const depositAddress = {
        id: 1,
        currencyId: 2,
      }

      sinon.stub(depositAddressOperations, 'findDepositAddressesForAccount').resolves([depositAddress])
      sinon.stub(referenceDataOperations, 'findCurrencyForCode').resolves({
        id: currencyId,
      })

      const generatedAddress = {
        privateKey: 'PK1',
        publicKey: 'PB2',
        wif: 'wif',
        address: 'address',
      }

      blockchainFacade.generateAddress.resolves(generatedAddress)
      const generateAddressStub = sinon.stub(BlockchainFacade, 'getInstance').returns(blockchainFacade)

      const storedDepositAddress = {
        id: 2,
      }
      sinon.stub(depositAddressOperations, 'storeDepositAddress').resolves(storedDepositAddress)
      const depositAddressRetrieved = await addressGenerator.generateDepositAddress(accountId, CurrencyCode.bitcoin)

      expect(generateAddressStub.calledOnce).to.eql(true)
      expect(depositAddressRetrieved).to.eql(storedDepositAddress)
    })
  })
})
