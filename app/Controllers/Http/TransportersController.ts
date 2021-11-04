import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Transporter from 'App/Models/Transporter';

export default class TransportersController {
  public async index({ response }: HttpContextContract) {
    const transporters = await Transporter.all();
    transporters.forEach((transporter) => {
      console.log(transporter.brdUser);
    });
    return response.ok(transporters);
  }

  public async create({}: HttpContextContract) {}

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
