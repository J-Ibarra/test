import { TetherOnChainCurrencyGateway } from '../../erc20-tokens/TetherOnChainCurrencyGateway'
import { Environment } from '@abx-types/reference-data'

describe.only('TetherOnChainCurrencyGateway', () => {
  it('load test tokens', async () => {
    const foo = new TetherOnChainCurrencyGateway(Environment.development)

    try {
      await foo.topUpTestnetAccount()
    } catch (e) {
      console.log(e)
    }
  })
})
