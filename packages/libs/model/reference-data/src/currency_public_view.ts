import { Currency } from './currency';

export interface CurrencyPublicView extends Currency {
  iconUrl?: string
  isFiat?: boolean 
}
