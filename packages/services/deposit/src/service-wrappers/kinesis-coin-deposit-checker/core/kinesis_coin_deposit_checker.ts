import { Environment, KinesisCurrencies } from '@abx-types/reference-data'
import { Kinesis } from '@abx-utils/blockchain-currency-gateway'


export function checkForNewDeposits(env: Environment, metal: KinesisCurrencies) {
  const kinesisCurrencyGateway = new Kinesis(env, metal)

  kinesisCurrencyGateway.subscribeForNewDepositRequests((message) => {
		console.log('A new message received')
		console.log(message)
	})
}
