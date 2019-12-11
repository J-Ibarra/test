import { EmailOrderStatus } from './email_order_status.enum';

export interface TradeConfirmationTemplateContent {
    firstName: string
    tradePair: string
    orderType: string
    orderStatus: EmailOrderStatus
    baseOrderDirection: string
    baseQuantity: number
    baseCurrency: string
    quoteOrderDirection: string
    quoteQuantity: number
    quoteCurrency: string
    copyrightYear: string
    utcTradeDate: string
  }