import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm'

import { TOP_UP_REQUEST_TABLE, DEBIT_CARD_TABLE } from '../shared-components/models'

export class TopUpRequestCreation1515769694450 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: TOP_UP_REQUEST_TABLE,
        columns: [
          {
            name: 'id',
            type: 'int',
            isGenerated: true,
            isPrimary: true,
          },
          {
            name: 'debit_card_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'order_id',
            type: 'numeric',
          },
          {
            name: 'sold_currency_amount',
            type: 'numeric',
          },
          {
            name: 'sold_currency',
            type: 'varchar',
            length: '3',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '30',
          },
          {
            name: 'amount_to_top_up',
            type: 'numeric',
            isNullable: false,
            default: 0,
          },
          {
            name: 'amount_filled',
            type: 'numeric',
            isNullable: false,
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
      true,
      false,
    )

    await queryRunner.createForeignKey(
      TOP_UP_REQUEST_TABLE,
      new TableForeignKey({
        name: 'FK_TOP_UP_REQUEST_DEBIT_CARD_ID',
        columnNames: ['debit_card_id'],
        referencedColumnNames: ['id'],
        referencedTableName: DEBIT_CARD_TABLE,
        onDelete: 'CASCADE',
      }),
    )
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    const table = await queryRunner.getTable(TOP_UP_REQUEST_TABLE)
    if (table) {
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('debit_card_id') !== -1) || ''
      await queryRunner.dropForeignKey(DEBIT_CARD_TABLE, foreignKey)
      await queryRunner.dropColumn(TOP_UP_REQUEST_TABLE, 'debit_card_id')
      await queryRunner.dropTable(TOP_UP_REQUEST_TABLE)
    }
  }
}
