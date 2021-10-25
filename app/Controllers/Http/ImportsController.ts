import Application from '@ioc:Adonis/Core/Application';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import parse from 'csv-parse';
import { createReadStream } from 'fs';

export default class ImportsController {
  public async import({ request, response }: HttpContextContract) {
    const parser = parse({
      delimiter: ';',
      autoParse: true,
    });
    const file = request.file('file', {
      extnames: ['csv'],
    });

    if (!file?.isValid) {
      return file?.errors;
    }

    if (file) {
      const dir = 'upload/';

      try {
        await file?.move(Application.tmpPath('uploads'), {
          overwrite: false,
        });

        const csvData: any[] = [];
        const errorArr: any[] = [];
        // console.log(file);

        createReadStream(file.filePath!)
          .pipe(
            parse({
              delimiter: ';',
              columns: [
                'minuta',
                'data',
                'notas',
                'cliente',
                'cnpjCliente',
                'remetente',
                'cnpjRemetente',
                'destinatario',
                'cnpjDestinatario',
                'totalFrete',
                'obs',
              ],
              trim: true,
              fromLine: 2,
            })
          )
          .on('data', (row) => {
            // console.log(row);
            csvData.push(row);
          })
          .on('end', () => {
            console.log(csvData);

            // return response.send(csvData);
          });
      } catch (error) {
        console.log(error);

        return response.send(error);
      }
    }
  }
}
