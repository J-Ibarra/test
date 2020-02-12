import { ExchangeEvents } from './exchange_event.model'
import { getModel } from '../../sequelize-setup'

export async function createExchangeEvent(event: ExchangeEvents): Promise<any> {
  const savedExchangeEvent = await getModel<ExchangeEvents>('exchangeEvents').create(event)
  return savedExchangeEvent
}
