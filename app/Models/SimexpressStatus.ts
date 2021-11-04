import { DateTime } from 'luxon';
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import Status from './Status';

export default class SimexpressStatus extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public descriptionSimexpress: string;

  @column()
  public idSimexpress: number;

  @column()
  public statusId: number;

  @belongsTo(() => Status)
  public status: BelongsTo<typeof Status>;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}

export type StatusSimexpressCsvRow = {
  id_simexpress: string;
  descricao_simexpress: string;
  id_status: string;
  descricao_status: string;
};
