import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm'

import { DEBIT_CARD_TABLE } from '../shared-components/models'

export class BalanceCreation1515769694450 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'balance',
        columns: [
          {
            name: 'id',
            type: 'int',
            isGenerated: true,
            isPrimary: true,
          },
          {
            name: 'amount',
            type: 'numeric',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['available', 'pending_withdrawal', 'pending_deposit'],
          },
          {
            name: 'debit_card_id',
            type: 'int',
            isNullable: false,
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
    )

    await queryRunner.createForeignKey(
      'balance',
      new TableForeignKey({
        name: 'FK_BALANCE_DEBIT_CARD_ID',
        columnNames: ['debit_card_id'],
        referencedColumnNames: ['id'],
        referencedTableName: DEBIT_CARD_TABLE,
        onDelete: 'CASCADE',
      }),
    )
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    const table = await queryRunner.getTable('balance')
    if (table) {
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('debit_card_id') !== -1) || ''
      await queryRunner.dropForeignKey(DEBIT_CARD_TABLE, foreignKey)
      await queryRunner.dropColumn('balance', 'debit_card_id')
      await queryRunner.dropTable('balance')
    }
  }
}
