import { expect } from 'chai'
import * as sinon from 'sinon'
import { createTemporaryTestingAccount } from '@abx-query-libs/account'
import { CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import { DepositAddress, DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { storeDepositAddress } from '../deposit_address'
import { findDepositRequestById, getPendingDepositRequests, loadAllPendingDepositRequestsAboveMinimumAmount, storeDepositRequests } from '..'
import { getMinimumDepositAmountForCurrency } from '../../service-wrappers/deposit-processor/core/framework/deposit_amount_validator'
import { truncateTables } from '@abx-utils/db-connection-utils'
import * as referenceDataOperations from '@abx-service-clients/reference-data'

describe('Deposit Request module', () => {
  const TEST_ACCOUNT_ID = 'test-acc-id'
  const TEST_PRIVATE_KEY = 'test_private_key'
  const TEST_ADDRESS = 'test_address'

  let TEST_CURRENCY_ID = 9
  const TEST_DEPOSIT_ADDRESS = {
    accountId: TEST_ACCOUNT_ID,
    currencyId: TEST_CURRENCY_ID,
    encryptedPrivateKey: TEST_PRIVATE_KEY,
    publicKey: TEST_ADDRESS,
  }
  const kauId = 2
  const ethId = 3

  afterEach(() => {
    sinon.restore()
  })

  describe('depositRequest model tests', () => {
    let SAVED_TEST_ACCOUNT_ID: string
    let SAVED_TEST_DEPOSIT_ADDRESS: DepositAddress

    beforeEach(async () => {
      await truncateTables()
      const account = await createTemporaryTestingAccount()
      SAVED_TEST_ACCOUNT_ID = account.id
      SAVED_TEST_DEPOSIT_ADDRESS = await storeDepositAddress({
        ...TEST_DEPOSIT_ADDRESS,
        accountId: SAVED_TEST_ACCOUNT_ID,
      })
    })

    it('stores a valid deposit_request', async () => {
      const newDepositRequest: DepositRequest = {
        depositAddress: SAVED_TEST_DEPOSIT_ADDRESS,
        amount: 100,
        depositTxHash: '',
        from: '',
        status: DepositRequestStatus.pendingHoldingsTransaction,
        fiatConversion: 3000,
        fiatCurrencyCode: FiatCurrency.usd,
      }

      await storeDepositRequests([newDepositRequest])
    })

    it('gets all pending deposit_requests', async () => {
      const confirmedDepositRequest: DepositRequest = {
        depositAddress: SAVED_TEST_DEPOSIT_ADDRESS,
        amount: 100,
        depositTxHash: '',
        from: '',
        status: DepositRequestStatus.pendingHoldingsTransaction,
        fiatConversion: 3000,
        fiatCurrencyCode: FiatCurrency.usd,
      }

      const pendingDepositRequest: DepositRequest = {
        ...confirmedDepositRequest,
        status: DepositRequestStatus.pendingHoldingsTransaction,
      }

      await storeDepositRequests([confirmedDepositRequest])
      await storeDepositRequests([pendingDepositRequest])

      const allPendingDepositRequests = await getPendingDepositRequests(TEST_CURRENCY_ID)
      expect(allPendingDepositRequests.length).to.eql(2)
    })

    it('get the deposit request for a given Id', async () => {
      const confirmedDepositRequest: DepositRequest = {
        depositAddress: SAVED_TEST_DEPOSIT_ADDRESS,
        amount: 100,
        depositTxHash: '',
        from: '',
        status: DepositRequestStatus.completed,
        fiatConversion: 3000,
        fiatCurrencyCode: FiatCurrency.usd,
      }

      const pendingDepositRequest: DepositRequest = {
        ...confirmedDepositRequest,
        status: DepositRequestStatus.pendingHoldingsTransaction,
      }

      await storeDepositRequests([confirmedDepositRequest])
      await storeDepositRequests([pendingDepositRequest])

      const result = await findDepositRequestById(1)
      expect(result!.status).to.eql(DepositRequestStatus.completed)
      expect(result!.depositAddress).to.eql(confirmedDepositRequest.depositAddress)
    })
  })

  describe('loadAllPendingDepositRequestsAboveMinimumAmount', () => {
    let SAVED_TEST_ACCOUNT_ID: string
    let SAVED_KAU_DEPOSIT_ADDRESS: DepositAddress
    let SAVED_ETH_DEPOSIT_ADDRESS: DepositAddress

    beforeEach(async () => {
      await truncateTables()

      const account = await createTemporaryTestingAccount()
      SAVED_TEST_ACCOUNT_ID = account.id
      SAVED_KAU_DEPOSIT_ADDRESS = await storeDepositAddress({
        currencyId: kauId,
        encryptedPrivateKey: TEST_PRIVATE_KEY,
        publicKey: TEST_ADDRESS,
        accountId: SAVED_TEST_ACCOUNT_ID,
      })
      SAVED_ETH_DEPOSIT_ADDRESS = await storeDepositAddress({
        currencyId: ethId,
        encryptedPrivateKey: TEST_PRIVATE_KEY,
        publicKey: TEST_ADDRESS,
        accountId: SAVED_TEST_ACCOUNT_ID,
      })
    })

    it('should load all pending deposit requests above the minimum for the currency', async () => {
      const pendingKauDepositRequest: DepositRequest = {
        depositAddress: SAVED_KAU_DEPOSIT_ADDRESS,
        amount: 100,
        depositTxHash: '',
        from: '',
        fiatConversion: 3000,
        fiatCurrencyCode: FiatCurrency.usd,
        status: DepositRequestStatus.pendingHoldingsTransaction,
      }

      const pendingEthDepositRequest: DepositRequest = {
        depositAddress: SAVED_ETH_DEPOSIT_ADDRESS,
        amount: 100,
        depositTxHash: '',
        from: '',
        fiatConversion: 3000,
        fiatCurrencyCode: FiatCurrency.usd,
        status: DepositRequestStatus.pendingHoldingsTransaction,
      }

      sinon.stub(referenceDataOperations, 'findCurrencyForCodes').resolves([
        {
          id: ethId,
          code: CurrencyCode.ethereum,
        },
        {
          id: kauId,
          code: CurrencyCode.kau,
        },
      ])

      await storeDepositRequests([pendingKauDepositRequest, pendingEthDepositRequest])
      const depositRequests = await loadAllPendingDepositRequestsAboveMinimumAmount()

      expect(depositRequests.length).to.eql(2)
    })

    it('should not load all pending deposit requests below the minimum for the currency', async () => {
      const pendingKauDepositRequest: DepositRequest = {
        depositAddress: SAVED_KAU_DEPOSIT_ADDRESS,
        amount: getMinimumDepositAmountForCurrency(CurrencyCode.kau) - 0.1,
        depositTxHash: '',
        from: '',
        fiatConversion: 3000,
        fiatCurrencyCode: FiatCurrency.usd,
        status: DepositRequestStatus.pendingHoldingsTransaction,
      }

      const pendingEthDepositRequest: DepositRequest = {
        depositAddress: SAVED_ETH_DEPOSIT_ADDRESS,
        amount: 100,
        depositTxHash: '',
        from: '',
        fiatConversion: 3000,
        fiatCurrencyCode: FiatCurrency.usd,
        status: DepositRequestStatus.pendingHoldingsTransaction,
      }

      sinon.stub(referenceDataOperations, 'findCurrencyForCodes').resolves([
        {
          id: ethId,
          code: CurrencyCode.ethereum,
        },
        {
          id: kauId,
          code: CurrencyCode.kau,
        },
      ])

      await storeDepositRequests([pendingKauDepositRequest, pendingEthDepositRequest])
      const depositRequests = await loadAllPendingDepositRequestsAboveMinimumAmount()

      expect(depositRequests.length).to.eql(1)
    })
  })
})
