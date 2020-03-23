import { Injectable, Logger } from '@nestjs/common'
import { ContisAccountDetails } from '../../../shared-components/models'
import { CardRepository } from '../../../shared-components/repositories'
import { DebitCardStatus } from '../../../shared-components/models/card/DebitCardStatus.enum'
import { UserStatusChangeRequest } from '../models'

@Injectable()
export class StatusChangeRecorder {
  private logger = new Logger('StatusChangeRecorder')

  constructor(private readonly cardRepository: CardRepository) {}

  public async updateUserStatusChange({
    CardHolderID: consumerId,
    NewStatus: status,
  }: UserStatusChangeRequest): Promise<void> {
    const details = { consumerId }

    const newStatus = this.mapUserStatusToDebitCardStatus(status)
    await this.cardRepository.updateCardStatus(details as ContisAccountDetails, newStatus)

    this.logger.log(`Updated status for contis consumer ${consumerId} to ${newStatus}`)
  }

  private mapUserStatusToDebitCardStatus(status: string): DebitCardStatus {
    switch (status) {
      case '01':
        return DebitCardStatus.active
      case '02':
        return DebitCardStatus.inactive
      case '07':
        return DebitCardStatus.declined
      case '12':
        return DebitCardStatus.lockedOut
      case '13':
        return DebitCardStatus.suspended
      default:
        return DebitCardStatus.active
    }
  }
}
