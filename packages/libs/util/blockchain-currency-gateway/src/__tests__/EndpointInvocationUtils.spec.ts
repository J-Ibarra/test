import { EndpointInvocationUtils } from '../api-provider/EndpointInvocationUtils'
import sinon from 'sinon'
import { expect } from 'chai'

const endpointName = 'ep-name'

describe('EndpointInvocationUtils', () => {
  afterEach(() => sinon.restore())

  describe('invokeEndpointWithProgressiveRetry', () => {
    it('should retry when endpointInvoker fails', async () => {
      const invokerStub = sinon.stub().throws('Foo')

      try {
        await EndpointInvocationUtils.invokeEndpointWithProgressiveRetry({
          name: endpointName,
          endpointInvoker: invokerStub,
          maxAttempts: 2,
        })
      } catch (e) {
        expect(invokerStub.calledTwice).to.eql(true)
        expect(e.name).to.eql('ApiProviderError')
      }
    })
  })
})
