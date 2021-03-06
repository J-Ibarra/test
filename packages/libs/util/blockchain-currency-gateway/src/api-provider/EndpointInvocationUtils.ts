import { Logger } from '@abx-utils/logging'
import { ApiProviderError } from '../model'

interface EndpointProgressiveRetry<T> {
  /** Used for logging purposes. */
  name: string
  /** Contains the API endpoint invocation logic. */
  endpointInvoker: () => Promise<T>
  /** The maximum attempts to conduct before failing, defaults to 5. */
  maxAttempts?: number
  /** The predicate which asserts if a certain condition is met. */
  resultPredicate?: (result) => boolean
}

export class EndpointInvocationUtils {
  private static readonly LOGGER = Logger.getInstance('blockchain-currency-gateway', 'BlockchainFacadeUtils')
  private static readonly PROGRESSIVE_WAIT_SECONDS = [1, 3, 5, 8, 13]

  /**
   * Attempts to invoke an endpoint {@code maxAttempts} number fo times,
   * until it succeeds. A progressive wait is applied after each invocation failure.
   * If there is no success after {@code maxAttempts}, an {@link ApiProviderError} is thrown.
   */
  public static async invokeEndpointWithProgressiveRetry<T>(
    { name, endpointInvoker, maxAttempts = 5 }: EndpointProgressiveRetry<T>,
    retryAttempt = 0,
  ): Promise<T> {
    try {
      const result = await endpointInvoker()

      return result
    } catch (e) {
      this.LOGGER.error(`Error ocurred while trying to invoke ${name}, attempt: ${retryAttempt} of ${maxAttempts}`)
      if (retryAttempt === maxAttempts - 1) {
        throw new ApiProviderError(e)
      }

      await new Promise(resolve => setTimeout(() => resolve(), this.PROGRESSIVE_WAIT_SECONDS[retryAttempt] * 1000))

      return EndpointInvocationUtils.invokeEndpointWithProgressiveRetry(
        {
          name,
          endpointInvoker,
          maxAttempts,
        },
        retryAttempt + 1,
      )
    }
  }

    /**
   * Attempts to invoke an endpoint {@code maxAttempts} number fo times,
   * until the passed predicate returns true. A progressive wait is applied 
   * after each invocation failure. If there is no success after {@code maxAttempts},
   *  an {@link ApiProviderError} is thrown.
   */
  public static async invokeEndpointWithProgressiveRetryAndResultAssert<T>(
    { 
      name, 
      endpointInvoker, 
      maxAttempts = 5,
      resultPredicate,
    }: EndpointProgressiveRetry<T>,
    retryAttempt = 0,
  ): Promise<T> {
    try {
      const result = await endpointInvoker()

      if (resultPredicate && !resultPredicate(result)) {
        const errorMessage = `Condition not met while trying to invoke ${name}, attempt: ${retryAttempt} of ${maxAttempts}`
        this.LOGGER.error(errorMessage)
        if (retryAttempt === maxAttempts - 1) {
          throw new ApiProviderError(errorMessage)
        }

        await new Promise(resolve => setTimeout(() => resolve(), this.PROGRESSIVE_WAIT_SECONDS[retryAttempt] * 1000))

        return EndpointInvocationUtils.invokeEndpointWithProgressiveRetryAndResultAssert(
          {
            name,
            endpointInvoker,
            maxAttempts,
            resultPredicate,
          },
          retryAttempt + 1,
        )
      }

      return result
    } catch (e) {
      this.LOGGER.error(`Error ocurred while trying to invoke ${name}, attempt: ${retryAttempt} of ${maxAttempts}`)
      if (retryAttempt === maxAttempts - 1) {
        throw new ApiProviderError(e)
      }

      await new Promise(resolve => setTimeout(() => resolve(), this.PROGRESSIVE_WAIT_SECONDS[retryAttempt] * 1000))

      return EndpointInvocationUtils.invokeEndpointWithProgressiveRetryAndResultAssert(
        {
          name,
          endpointInvoker,
          maxAttempts,
          resultPredicate,
        },
        retryAttempt + 1,
      )
    }
  }
}
