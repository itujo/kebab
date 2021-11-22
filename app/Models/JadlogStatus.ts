import { DateTime } from 'luxon';
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import StatusBrudam from './StatusBrudam';

export default class JadlogStatus extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public descriptionJadlog: string;

  @column()
  public statusBrudamId: number;

  @belongsTo(() => StatusBrudam)
  public statusBrudam: BelongsTo<typeof StatusBrudam>;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}
