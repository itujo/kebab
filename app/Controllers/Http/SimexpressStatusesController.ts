import Application from '@ioc:Adonis/Core/Application';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Simexpress, { StatusSimexpressCsvRow } from 'App/Models/SimexpressStatus';
import parse from 'csv-parse';
import { createReadStream } from 'fs';

export default class SimexpressStatusesController {
  public async index({}: HttpContextContract) {}

  public async create({}: HttpContextContract) {}

  public async store({ request, response }: HttpContextContract) {
    const file = request.file('file', {
      extnames: ['csv'],
    });

    if (!file) {
      return response.badRequest({
        status: 'error',
        message: 'no file provided',
      });
    }

    if (file && !file?.isValid) {
      return file?.errors;
    }

    if (file) {
      try {
        await file?.move(Application.tmpPath('uploads/status'), {
          overwrite: true,
        });

        const csvData: StatusSimexpressCsvRow[] = [];

        createReadStream(file.filePath!)
          .pipe(
            parse({
              delimiter: ';',
              columns: [`id_brd`, `descricao_brd`, `id_status`, `descricao_status`],
              trim: true,
              fromLine: 2,
            })
          )
          .on('data', (row: StatusSimexpressCsvRow) => {
            csvData.push(row);
          })
          .on('end', async () => {
            await Promise.all(
              csvData.map(async (statusRow) => {
                await Simexpress.create({
                  idSimexpress: parseInt(statusRow.id_simexpress, 10),
                  descriptionSimexpress: statusRow.descricao_simexpress.toLowerCase(),
                  statusId: statusRow.id_status ? parseInt(statusRow.id_status, 10) : undefined,
                });
              })
            );
            return response.send('ok');
          });
      } catch (error) {
        console.log(error.Exception);

        return response.send(error);
      }
    }
  }

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
