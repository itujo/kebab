import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Status from 'App/Models/Status';
export default class StatusesController {
  public async index({}: HttpContextContract) {}

  public async create({}: HttpContextContract) {}

  public async populate({ response }: HttpContextContract) {
    const statuses = await Status.createMany([
      {
        description: 'entregue',
      },
      {
        description: 'em rota',
      },
      {
        description: 'transferencia',
      },
      {
        description: 'entrada',
      },
      {
        description: 'sinistro',
      },
      {
        description: 'custodia',
      },
      {
        description: 'devolucao',
      },
      {
        description: 'travado',
      },
      {
        description: 'avaria',
      },
      {
        description: 'cancelado',
      },
      {
        description: 'importado',
      },
    ]);

    return response.send(statuses);
  }

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
