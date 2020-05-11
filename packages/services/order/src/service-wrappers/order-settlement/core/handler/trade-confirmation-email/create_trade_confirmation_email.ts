import moment from 'moment-timezone'
import { UserDetails } from '@abx-types/account'
import { OrderDirection, OrderType } from '@abx-types/order'
import { Email, EmailAttachment, EmailOrderStatus, EmailTemplates, TradeConfirmationTemplateContent } from '@abx-types/notification'
import { scientificToDecimal } from '@abx-service-clients/reference-data'

interface OrderDetails {
  baseCurrency: string
  quoteCurrency: string
  amount: number
  createdAt: Date
  consideration: number
}

interface TraderDetails {
  users: UserDetails[]
  orderId: number
  direction: OrderDirection
  attachments: EmailAttachment[]
  orderType: OrderType
  orderStatus: EmailOrderStatus
}

export const createTradeConfirmationEmail = ({ baseCurrency, quoteCurrency, amount, createdAt, consideration }: OrderDetails) => {
  return ({ users, orderId, attachments, orderType, direction, orderStatus }: TraderDetails) => {
    return users.map(({ firstName, email }: UserDetails) => {
      const templateContent: TradeConfirmationTemplateContent = {
        firstName: firstName ? ` ${firstName}` : '',
        tradePair: `${baseCurrency}/${quoteCurrency}`,
        orderType,
        orderStatus,
        baseOrderDirection: direction === OrderDirection.buy ? 'bought' : 'sold',
        baseCurrency,
        baseQuantity: scientificToDecimal(`${amount}`),
        quoteOrderDirection: direction === OrderDirection.buy ? 'sold' : 'bought',
        quoteQuantity: scientificToDecimal(`${consideration}`),
        quoteCurrency,
        utcTradeDate: moment(createdAt).utc().format('h:mma dddd, D MMMM YYYY'),
        copyrightYear: moment().format('YYYY'),
      }

      const emailRequest: Email = {
        to: email,
        fromName: 'Kinesis Money',
        subject: `Kinesis Trade Confirmation #${orderId}`,
        templateName: EmailTemplates.TradeConfirmation,
        templateContent,
        attachments,
      }

      return emailRequest
    })
  }
}
