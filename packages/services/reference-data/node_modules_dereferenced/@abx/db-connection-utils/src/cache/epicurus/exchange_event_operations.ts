import { RuntimeError } from '@abx-types/error'
import { ExchangeEvents } from './exchange_event.model'
import { getModel } from '../../sequelize-setup'

export async function createExchangeEvent(event: ExchangeEvents): Promise<any> {
  try {
    const savedExchangeEvent = await getModel<ExchangeEvents>('exchangeEvents').create(event)
    return savedExchangeEvent
  } catch (e) {
    throw new RuntimeError('Unable to write exchange event to the database', {
      context: {
        error: e.stack,
        event: event.eventName,
      },
    })
  }
}
