# The 'deposit flow' services

## Service Descriptions

### Deposit-entry-processor

This service is used to interact with the front end. this will generate wallet addresses and activate the addresses so that we start listening on chain for events related to them.

### Eth-deposit-poller

This service was introduced to find lost or missed transactions

### kinesis-and-eth-coin-deposit-processor

This service wrapper handles all the coins - [KAU, KAG, KVT and ETH]
This uses our own logic to check on the above coins blockchain's and update the respective deposit requests.

### third-party-coin-deposit-processor

This service wrapper handles all the coins - [BTC]
This uses crypto apis sdk to interface with the blockchain and process all the deposits.
