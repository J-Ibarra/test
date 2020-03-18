import { Logger, Injectable } from '@nestjs/common'

import { CardRepository } from '../../../shared-components/repositories'
import { DebitCardStatus, ContisAccountDetails } from '../../../shared-components/models'
import { HoscCheckChangeNotification } from '../models/HoscCheckChangeNotification'
import { GreylistCheckChangeNotification } from '../models/GreylistCheckChangeNotification'

@Injectable()
export class BackgroundCheckStatusChangeRecorder {
  private logger = new Logger('BackgroundCheckStatusChangeRecorder')

  private readonly postcodeFromGreyArea = 1

  constructor(private cardRepository: CardRepository) {}

  public async recordHoscCheckChange({ CardHolderId, HOSCStatus }: HoscCheckChangeNotification) {
    this.logger.log(`Recording HOSC check failure for contis consumer ${CardHolderId}, status received ${HOSCStatus}`)

    await this.cardRepository.updateCardStatus(
      { consumerId: CardHolderId } as ContisAccountDetails,
      DebitCardStatus.hoscCheckFailure,
    )
  }

  public async recordGreylistCheckChange({ CardHolderId, IsGreyAreaPostcode }: GreylistCheckChangeNotification) {
    if (IsGreyAreaPostcode === this.postcodeFromGreyArea) {
      this.logger.log(`Recording Greylist check failure for contis consumer ${CardHolderId}`)

      await this.cardRepository.updateCardStatus(
        { consumerId: CardHolderId } as ContisAccountDetails,
        DebitCardStatus.greylistCheckFailure,
      )
    }
  }
}
