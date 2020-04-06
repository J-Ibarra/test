# CryptoApis.io usage

The cryptoapis sdk does not provide any typings. I have created a class with all the calls we currently use.
If you find that your request call isn't in, you can add it. The types/interface are added in the model folder
underneath the request type specified on the website. i.e `addresses/` `webhooks/`

Ensure that you export new interfaces through the respective index.ts file.

There is an interface for the `request body` we provide

There is an interface for the `response body` that is returned. These are usually wrapped in a payload. See the docs.

Here is the skeleton code for implementing a new interface:

```ts
interface IAddressDetailsRequest {}
interface IAddressDetailsResponse extends PayloadWrapper<IAddressDetails> {}
interface IAddressDetails {}
```

## How to use crypto apis class

1. initialise the instance:
   ```ts
   const cryptoApiInstance = new CryptoApisProviderProxy(CurrencyCode.bitcoin, ENetworkTypes.ROPSTEN, 'my-token-key')
   ```
2. Generate a random address:
   ```ts
    const newRandomAddress = cryptoApiInstance.generateAddress()
    console.log(newRandomAddress)
    ---------------------------------
    {
        publicKey: 'KEWFJBIU235235623KNFDSKNF',
        privateKey: 'DKLWOIFNWOEINFIO23NN2K3N6KN2KLNVKLNSDKL',
        address: 'WKLFJWEFNEWKNF324234',
        wif: 'SDFLKSNDKJFNSDKJFN'
    }
   ```
