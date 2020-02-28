import { Injectable, OnModuleInit } from '@nestjs/common'

import { CardConstraintRepository } from '../../repositories/CardConstraintsRepository'
import { CardConstraintName } from '../../models'

const intValueConstraints = [CardConstraintName.minimumTopUpAmount, CardConstraintName.withdrawalFee]

const objectValueConstraints = [CardConstraintName.balanceLimit]

@Injectable()
export class CardConstraintService implements OnModuleInit {
  private cachedConstraints: Record<CardConstraintName, string | number> = {} as any

  constructor(private cardConstraintRepository: CardConstraintRepository) {}

  async onModuleInit() {
    const constraints = await this.cardConstraintRepository.getAllCardConstraints()

    this.cachedConstraints = constraints.reduce((constraintsAcc, { name, value }) => {
      constraintsAcc[name] = this.parseConstraintValue(name, value)

      return constraintsAcc
    }, {}) as Record<CardConstraintName, string | number>
  }

  getAllCardConstraints(): Record<CardConstraintName, string | number> {
    return this.cachedConstraints
  }

  getCardConstraintValue<T>(constraint: CardConstraintName): T {
    return (this.cachedConstraints[constraint] as any) as T
  }

  private parseConstraintValue(name: CardConstraintName, value: string): number | string {
    if (intValueConstraints.includes(name)) {
      return parseInt(value, 10)
    } else if (objectValueConstraints.includes(name)) {
      return JSON.parse(value)
    }

    return value
  }
}
