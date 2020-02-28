export interface ContisLogin {
  username: string
  password: string
}

export interface ContisConfiguration {
  apiRoot: string
  cardOrderFee: number
  /** The IP/IPs of the web service that Contis would be pushing notifications from. */
  webhookWhitelistedIP: string
  /**
   * The timeframe (in minutes) that Contis is obliged to validate new debit card orders in.
   * In the case of a debit card order failing one of the validations ran by Contis, they will push
   * a card status update notification to us withing that timeframe. If that doesn't happen we can safely
   * assume that the card application was successful.
   */
  cardOrderValidationSLAInMinutes: number
  /** The full URL of the SQS queue where Contis notifications will land. */
  contisNotificationQueueUrl: string
}
