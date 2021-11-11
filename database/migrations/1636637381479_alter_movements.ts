import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class AlterMovements extends BaseSchema {
  protected tableName = 'movements';

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('manifest_id')
        .unsigned()
        .nullable()
        .references('manifests.id')
        .onDelete('CASCADE');

      table.timestamp('data_status', { useTz: true }).nullable();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('manifest_id');
      table.dropColumn('data_status');
    });
  }
}
