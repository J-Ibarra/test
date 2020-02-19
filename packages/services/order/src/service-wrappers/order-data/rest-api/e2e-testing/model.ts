import { PlaceOrderRequest } from '@abx-types/order'
import { CurrencyCode } from '@abx-types/reference-data'

export interface OrderAccountSetupScript {
  email: string
  balances: AccountSetupBalance[]
  orders: {
    buy: AccountSetupOrderDetails[]
    sell: AccountSetupOrderDetails[]
  }
}

export interface AccountSetupBalance {
  amount: number
  currencyCode: CurrencyCode
}

export type AccountSetupOrderDetails = Pick<PlaceOrderRequest, 'symbolId' | 'orderType' | 'amount' | 'limitPrice'>
