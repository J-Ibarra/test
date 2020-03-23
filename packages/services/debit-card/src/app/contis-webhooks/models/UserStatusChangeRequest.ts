import { IsNotEmpty } from 'class-validator'
import { ApiModelProperty } from '@nestjs/swagger'

export class UserStatusChangeRequest {
  @ApiModelProperty()
  @IsNotEmpty()
  NotificationType: string

  @ApiModelProperty()
  @IsNotEmpty()
  CardHolderID: number

  @ApiModelProperty()
  @IsNotEmpty()
  OldStatus: string

  @ApiModelProperty()
  @IsNotEmpty()
  NewStatus: string

  @ApiModelProperty()
  @IsNotEmpty()
  StatusChangeDate: string
}
