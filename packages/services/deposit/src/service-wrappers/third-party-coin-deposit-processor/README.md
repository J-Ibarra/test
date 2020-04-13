# Houses the logic for processing third party cryptos.

## coins added to date: BTC and USDT

## WorkFlow

1. Bootstrap initiated in `service_starter.ts`. Here we create two SQS endpoints, that when called follow a set of instructions
2. The first endpoint is called using: `new DepositAddressNewTransactionQueuePoller().bootstrapPoller()` that when called externally will run the function `processDepositAddressTransaction`
3. The second endpoint is called using: `new DepositTransactionConfirmationQueuePoller().bootstrapPoller()` that when called externally will run the function `processDepositAddressTransaction`

//TODO: convert back to functional modules.
