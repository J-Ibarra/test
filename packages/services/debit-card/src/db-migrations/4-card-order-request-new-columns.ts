import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { CARD_ORDER_REQUEST_TABLE } from '../shared-components/models'

export class CardOrderRequestNewColumns1515769694449
  implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.addColumns(
      CARD_ORDER_REQUEST_TABLE,
      [
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
      ],
    )
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn(
      CARD_ORDER_REQUEST_TABLE,
      'passport_number',
    )

    await queryRunner.dropColumn(
      CARD_ORDER_REQUEST_TABLE,
      'passport_expiry_date',
    )

    await queryRunner.dropColumn(
      CARD_ORDER_REQUEST_TABLE,
      'address_history',
    )
  }
}
