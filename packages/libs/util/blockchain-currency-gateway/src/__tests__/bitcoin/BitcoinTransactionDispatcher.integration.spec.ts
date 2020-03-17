import { ENetworkTypes, BtcCryptoApisProviderProxy } from '../../api-provider/crypto-apis'
import { CurrencyCode } from '@abx-types/reference-data'
import { BitcoinTransactionDispatcher } from '../../bitcoin/BitcoinTransactionDispatcher'

// Only enable when you want to do an e2e testnet transaction test
describe.skip('BitcoinTransactionDispatcher:integration', () => {
  const senderAddressDetails = {
    privateKey: '6b9360cb64ea88aa86debe1619a3f4e87db3d36dc8f5f9334699d08c82fdd835',
    publicKey: '031e3223791b02c17feda3b01ec6852b4bfb710d86c2109eaa4744715bfc98be3e',
    address: 'mjvjfsa6WxTuKsEHk1je2KXQZQZSaUXLze',
    wif: 'cRBpD2LC4AzQ3iUoK9R5D96GHPcgT1iXQxyR8cnHfiqMDiBUnYuM',
  }

  const receiverAddressDetails = {
    privateKey: '453f259731087740a1301507801f6a54d14641392fcfd0e40745e32708036165',
    publicKey: '039b0c14922a6b5663b0d5aa57b4df0821af91a5453358e7c7cd3d2a7b8771618a',
    address: 'mjcu3s6NwJdKT9t7JP4qpBF7iFSqFtYbgb',
    wif: 'cPuJpkC7Evsk1zpBwSqXbCoCc4d218zHdxTKJ1gafYpsAZT32uEX',
  }

  it('createTransaction', async () => {
    try {
      const cryptoApiProxy = new BtcCryptoApisProviderProxy(CurrencyCode.bitcoin, ENetworkTypes.BTC_TESTNET, 'xxx-INSERT-CRYPTO-API-TOKEN-HERE-xxxx')
      const bitcoinTransactionDispatcher = new BitcoinTransactionDispatcher(cryptoApiProxy)

      const result = await bitcoinTransactionDispatcher.createTransaction({
        senderAddress: senderAddressDetails,
        receiverAddress: receiverAddressDetails.address,
        amount: 0.000003,
      })

      console.log(result)
    } catch (e) {
      console.log(e)
    }
  })
})
