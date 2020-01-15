import { expect } from 'chai'
import moment from 'moment-timezone'

import { OrderDirection, OrderType } from '@abx-types/order'
import { EmailAttachment, EmailAttachmentType, EmailOrderStatus, EmailTemplates } from '@abx-types/notification'
import { createTradeConfirmationEmail } from '../lib/trade_confirmation/create_trade_confirmation_email'

describe('createTradeConfirmationEmail', () => {
  const users = [
    {
      firstName: 'first name',
      lastName: 'last name',
      email: 'email',
    },
  ]

  const orderId = 1

  const orderDetails = {
    baseCurrency: 'USD',
    quoteCurrency: 'KAG',
    amount: 10,
    createdAt: new Date(),
    consideration: 10000,
  }

  const attachment: EmailAttachment[] = [
    {
      content: 'Trade confirmation data',
      name: 'trade_confirmation.pdf',
      type: EmailAttachmentType.pdf,
    },
  ]

  it(`should send the correct template content for buy orders`, () => {
    const emailTemplateContent = createTradeConfirmationEmail(orderDetails)({
      users,
      orderId,
      direction: OrderDirection.buy,
      attachments: attachment,
      orderType: OrderType.market,
      orderStatus: EmailOrderStatus.filled,
    })

    expect(emailTemplateContent).to.have.property('length', 1)
    expect(emailTemplateContent[0]).to.eql({
      fromName: 'Kinesis Money',
      to: users[0].email,
      subject: `Kinesis Trade Confirmation #${orderId}`,
      templateName: EmailTemplates.TradeConfirmation,
      templateContent: {
        firstName: ` ${users[0].firstName}`,
        tradePair: 'USD/KAG',
        orderType: OrderType.market,
        orderStatus: EmailOrderStatus.filled,
        baseOrderDirection: 'bought',
        baseCurrency: orderDetails.baseCurrency,
        baseQuantity: orderDetails.amount,
        quoteOrderDirection: 'sold',
        quoteCurrency: orderDetails.quoteCurrency,
        quoteQuantity: orderDetails.consideration,
        utcTradeDate: moment(orderDetails.createdAt)
          .utc()
          .format('h:mma dddd, D MMMM YYYY'),
        copyrightYear: moment().format('YYYY'),
      },
      attachments: attachment,
    })
  })

  it(`should send the correct template content for sell orders`, () => {
    const emailTemplateContent = createTradeConfirmationEmail(orderDetails)({
      users,
      orderId,
      direction: OrderDirection.sell,
      attachments: attachment,
      orderType: OrderType.limit,
      orderStatus: EmailOrderStatus.filled,
    })

    expect(emailTemplateContent).to.have.property('length', 1)
    expect(emailTemplateContent[0]).to.eql({
      fromName: 'Kinesis Money',
      to: users[0].email,
      subject: `Kinesis Trade Confirmation #${orderId}`,
      templateName: EmailTemplates.TradeConfirmation,
      templateContent: {
        firstName: ` ${users[0].firstName}`,
        tradePair: 'USD/KAG',
        orderStatus: EmailOrderStatus.filled,
        orderType: OrderType.limit,
        baseOrderDirection: 'sold',
        baseCurrency: orderDetails.baseCurrency,
        baseQuantity: orderDetails.amount,
        quoteOrderDirection: 'bought',
        quoteCurrency: orderDetails.quoteCurrency,
        quoteQuantity: orderDetails.consideration,
        utcTradeDate: moment(orderDetails.createdAt)
          .utc()
          .format('h:mma dddd, D MMMM YYYY'),
        copyrightYear: moment().format('YYYY'),
      },
      attachments: attachment,
    })
  })
})
