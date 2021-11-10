import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class SimexpressStatuses extends BaseSchema {
  protected tableName = 'simexpress_statuses';

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');

      table.string('description_simexpress').notNullable();

      table.string('id_simexpress').unique().notNullable();

      table.integer('status_brudam_id').unsigned().nullable();

      table
        .integer('status_id')
        .unsigned()
        .nullable()
        .references('statuses.id')
        .onDelete('CASCADE');

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
