import { ExchangeConfigValue } from '.'

export interface IExchangeConfigEntry {
  id?: number
  value: { [P in keyof ExchangeConfigValue]?: ExchangeConfigValue[P] }
}
