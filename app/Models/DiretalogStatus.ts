import { DateTime } from 'luxon';
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import Status from './Status';

export default class DiretalogStatus extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public descriptionDireta: string;

  @column()
  public idDireta: number;

  @column()
  public statusId: number;

  @belongsTo(() => Status)
  public status: BelongsTo<typeof Status>;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}

export type StatusDiretaCsvRow = {
  id_direta: string;
  descricao_direta: string;
  id_status: string;
  descricao_status: string;
};
