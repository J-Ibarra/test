import { Inject, Logger } from '@nestjs/common'
import { AwsSqsQueueGateway, QUEUE_GATEWAY, CONFIG_SOURCE_TOKEN, ConfigSource } from '../../shared-components/providers'
import {
  AwsSqsNotification,
  ContisNotificationName,
  HoscCheckChangeNotification,
  GreylistCheckChangeNotification,
  TransactionRequest,
  UserStatusChangeRequest,
} from './models'
import { BackgroundCheckStatusChangeRecorder, ContisTransactionRecorder, StatusChangeRecorder } from './providers'

export class ContisNotificationQueueProcessor {
  private logger = new Logger('ContisNotificationQueueProcessor')

  constructor(
    @Inject(QUEUE_GATEWAY) sqsQueueGateway: AwsSqsQueueGateway<AwsSqsNotification>,
    @Inject(CONFIG_SOURCE_TOKEN) configSource: ConfigSource,
    private backgroundStatusChangeRecorder: BackgroundCheckStatusChangeRecorder,
    private contisTransactionRecorder: ContisTransactionRecorder,
    private statusChangeRecorder: StatusChangeRecorder,
  ) {
    sqsQueueGateway.subscribeToQueueMessages(configSource.getContisConfig().contisNotificationQueueUrl, notification =>
      this.handleNotification(notification),
    )
  }

  private handleNotification({ name, payload }: AwsSqsNotification): Promise<any> {
    this.logger.debug(`Received a ${name} notification`)

    switch (name) {
      case ContisNotificationName.hosc:
        return this.backgroundStatusChangeRecorder.recordHoscCheckChange(payload as HoscCheckChangeNotification)
      case ContisNotificationName.greylist:
        return this.backgroundStatusChangeRecorder.recordGreylistCheckChange(payload as GreylistCheckChangeNotification)
      case ContisNotificationName.transaction:
        return this.contisTransactionRecorder.recordTransaction(payload as TransactionRequest)
      case ContisNotificationName.userStatusChange:
        return this.statusChangeRecorder.updateUserStatusChange(payload as UserStatusChangeRequest)
      default:
        throw new Error(`Notification ${name} not supported`)
    }
  }
}
