import { noticeError } from 'newrelic'
import { ApiErrorPayload } from '@abx-types/error'

export async function wrapWithErrorHandling<T>(requestHandler: () => Promise<T>, statusSetter: (number) => void): Promise<T | ApiErrorPayload> {
  try {
    return await requestHandler()
  } catch (error) {
    noticeError(error)
    statusSetter(error.status || 400)
    return { message: error.message as string }
  }
}
