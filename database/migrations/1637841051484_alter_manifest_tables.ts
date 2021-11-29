import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class AlterManifestTables extends BaseSchema {
  protected tableName = 'manifests';

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('transporter_id').unsigned().references('transporters.id').onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('transporter_id');
    });
  }
}
