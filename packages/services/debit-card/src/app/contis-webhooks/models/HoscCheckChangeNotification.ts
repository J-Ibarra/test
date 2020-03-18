import { ApiModelProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsIn } from 'class-validator'

export class HoscCheckChangeNotification {
  @ApiModelProperty()
  @IsNotEmpty()
  NotificationType: string

  @ApiModelProperty()
  @IsNotEmpty()
  HOSCCheckDate: string

  @ApiModelProperty()
  @IsNotEmpty()
  CardHolderId: number

  @ApiModelProperty()
  @IsNotEmpty()
  @IsIn(['02', '04'])
  HOSCStatus: string
}
