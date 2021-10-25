import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Movements extends BaseSchema {
  protected tableName = 'movements';

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();
      table.string('minuta').unique().notNullable();
      table.string('nf').notNullable();
      table.timestamp('data_emissao', { useTz: true }).notNullable();
      table.text('obs').nullable(), table.string('status').defaultTo('importado');
      table.string('recebedor').nullable();
      table.timestamp('data_recebimento', { useTz: true }).nullable();
      table
        .integer('sender_id')
        .unsigned()
        .references('senders.id')
        .notNullable()
        .onDelete('CASCADE');
      table
        .integer('transporter_id')
        .unsigned()
        .references('transporters.id')
        .notNullable()
        .onDelete('CASCADE');
      table.boolean('closed').defaultTo(false);

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
