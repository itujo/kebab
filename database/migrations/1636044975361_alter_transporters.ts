import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class AlterTransporters extends BaseSchema {
  protected tableName = 'transporters';

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('status_table').nullable();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status_table');
    });
  }
}
