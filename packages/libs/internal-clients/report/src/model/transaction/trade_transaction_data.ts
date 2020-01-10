import { CurrencyCode } from '@abx-types/reference-data'

export interface TradeTransactionData {
    direction: string
    orderId: number
    tradeTransactionId: number
    utcTime: string
    baseCurrency: CurrencyCode
    quoteCurrency: CurrencyCode
    amount: number
    matchPrice: string
    consideration: string
    totalReceived: string
    totalPaid: string
    tradingParty: string
}