import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { CARD_ORDER_REQUEST_TABLE } from '../shared-components/models'

export class CardOrderRequestDeleteColumns1615769694441 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn(CARD_ORDER_REQUEST_TABLE, 'passport_number')
    await queryRunner.dropColumn(CARD_ORDER_REQUEST_TABLE, 'passport_expiry_date')
    await queryRunner.dropColumn(CARD_ORDER_REQUEST_TABLE, 'address_history')
    await queryRunner.dropColumn(CARD_ORDER_REQUEST_TABLE, 'initial_deposit')

    await queryRunner.addColumn(
      CARD_ORDER_REQUEST_TABLE,
      new TableColumn({
        name: 'present_address',
        type: 'jsonb',
      }),
    )
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.addColumns(CARD_ORDER_REQUEST_TABLE, [
      new TableColumn({
        name: 'passport_number',
        type: 'text',
      }),
      new TableColumn({
        name: 'passport_expiry_date',
        type: 'text',
      }),
      new TableColumn({
        name: 'address_history',
        type: 'jsonb',
      }),
      new TableColumn({
        name: 'initial_deposit',
        type: 'jsonumericnb',
      }),
    ])

    await queryRunner.dropColumn(CARD_ORDER_REQUEST_TABLE, 'present_address')
  }
}
