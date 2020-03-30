import { ApiModelProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsIn, IsNumber } from 'class-validator'

export class GreylistCheckChangeNotification {
  @ApiModelProperty()
  @IsNotEmpty()
  NotificationType: string

  @ApiModelProperty()
  @IsNotEmpty()
  GreyListCheckDate: string

  @ApiModelProperty()
  @IsNotEmpty()
  CardHolderId: number

  @ApiModelProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsIn([1, 0])
  IsGreyAreaPostcode: number
}
