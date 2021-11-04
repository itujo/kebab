import { DateTime } from 'luxon';
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import Status from './Status';

export default class StatusBrudam extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public descriptionBrd: string;

  @column()
  public idBrd: number;

  @column()
  public statusId: number;

  @belongsTo(() => Status)
  public status: BelongsTo<typeof Status>;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}

export type StatusCsvRow = {
  id_brd: string;
  descricao_brd: string;
  id_status: string;
  descricao_status: string;
};
