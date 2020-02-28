import { ApiModelProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsIn } from 'class-validator'

export class KycCheckChangeNotification {
  @ApiModelProperty()
  @IsNotEmpty()
  NotificationType: string

  @ApiModelProperty()
  @IsNotEmpty()
  KYCCheckDate: string

  @ApiModelProperty()
  @IsNotEmpty()
  CardHolderId: number

  @ApiModelProperty()
  @IsNotEmpty()
  @IsIn(['03', '04', '05'])
  KYCStatus: string
}
