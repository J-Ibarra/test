import { bootstrapRestApi } from '..'
import request from 'supertest'
import sinon from 'sinon'
import { expect } from 'chai'
import { Server } from 'http'
import { DEPOSIT_API_PORT } from '@abx-service-clients/deposit'
import * as referenceClientOperations from '@abx-service-clients/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { createAccountAndSession } from '../../../../../../../libs/util/account/src'
import * as blockchainUtils from '@abx-utils/blockchain-currency-gateway'
import { storeDepositAddress, findDepositAddresses } from '../../../../core'

describe('wallet_controller', () => {
  let app: Server

  beforeEach(async () => {
    sinon.stub(referenceClientOperations, 'findCurrencyForCode').resolves({
      id: 1,
      code: CurrencyCode.bitcoin,
    })

    app = bootstrapRestApi().listen(DEPOSIT_API_PORT)
  })

  afterEach(async () => {
    await app.close()
  })

  it('activateWalletAddressForAccount should only call createAddressTransactionSubscription once, even when called multiple times', async () => {
    const { account, cookie } = await createAccountAndSession()

    await storeDepositAddress({
      accountId: account.id,
      currencyId: 1,
      encryptedPrivateKey: 'foo',
      publicKey: 'bar',
      address: 'addr',
      transactionTrackingActivated: false,
    })

    const createAddressTransactionSubscriptionStub = sinon.stub()

    sinon.stub(blockchainUtils.CurrencyManager.prototype, 'getCurrencyFromTicker').returns({
      createAddressTransactionSubscription: createAddressTransactionSubscriptionStub.resolves(true),
    } as any)

    await Promise.all([
      request(app).post(`/api/wallets/address/activation`).set('Cookie', cookie).send({ currencyCode: CurrencyCode.bitcoin }),
      request(app).post(`/api/wallets/address/activation`).set('Cookie', cookie).send({ currencyCode: CurrencyCode.bitcoin }),
      request(app).post(`/api/wallets/address/activation`).set('Cookie', cookie).send({ currencyCode: CurrencyCode.bitcoin }),
    ])

    expect(createAddressTransactionSubscriptionStub.calledOnce).to.eql(true)

    const [depositAddress] = await findDepositAddresses({
      accountId: account.id!,
      currencyId: 1,
    })

    expect(depositAddress.transactionTrackingActivated).to.eql(true)
  })
})
