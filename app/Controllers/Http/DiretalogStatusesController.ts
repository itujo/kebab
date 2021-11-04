import Application from '@ioc:Adonis/Core/Application';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import DiretalogStatus, { StatusDiretaCsvRow } from 'App/Models/DiretalogStatus';
import parse from 'csv-parse';
import { createReadStream } from 'fs';

export default class DiretalogStatusesController {
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

        const csvData: StatusDiretaCsvRow[] = [];

        createReadStream(file.filePath!)
          .pipe(
            parse({
              delimiter: ';',
              columns: [`id_brd`, `descricao_brd`, `id_status`, `descricao_status`],
              trim: true,
              fromLine: 2,
            })
          )
          .on('data', (row: StatusDiretaCsvRow) => {
            csvData.push(row);
          })
          .on('end', async () => {
            await Promise.all(
              csvData.map(async (statusRow) => {
                await DiretalogStatus.create({
                  idDireta: parseInt(statusRow.id_direta, 10),
                  descriptionDireta: statusRow.descricao_direta.toLowerCase(),
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
