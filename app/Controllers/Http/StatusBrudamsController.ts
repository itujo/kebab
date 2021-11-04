import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Application from '@ioc:Adonis/Core/Application';
import parse from 'csv-parse';
import { createReadStream } from 'fs';
import StatusBrudam, { StatusCsvRow } from 'App/Models/StatusBrudam';

export default class StatusBrudamsController {
  public async index({}: HttpContextContract) {
    const brdStatuses = await StatusBrudam.query().preload('status');

    return brdStatuses;
  }

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

        const csvData: StatusCsvRow[] = [];

        createReadStream(file.filePath!)
          .pipe(
            parse({
              delimiter: ';',
              columns: [`id_brd`, `descricao_brd`, `id_status`, `descricao_status`],
              trim: true,
              fromLine: 2,
            })
          )
          .on('data', (row: StatusCsvRow) => {
            csvData.push(row);
          })
          .on('end', async () => {
            await Promise.all(
              csvData.map(async (statusRow) => {
                await StatusBrudam.create({
                  idBrd: parseInt(statusRow.id_brd, 10),
                  descriptionBrd: statusRow.descricao_brd.toLowerCase(),
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
