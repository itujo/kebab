import { BrdRes } from '@types';
import Transporter from 'App/Models/Transporter';
import axios from 'axios';

class Brudam {
  protected transporterId: number;
  protected apiUrl = `https://gruposplog.brudam.com.br/api/v1`;

  constructor(transporterId: number) {
    this.transporterId = transporterId;
  }

  /**
   * getTransporterId: returns transporter id
   */
  public getTransporterId() {
    return this.transporterId;
  }

  /**
   * getBrdAuth: get user and pass from DB to use with Brudam
   */
  private getBrdAuth = async (transporterId: number) => {
    const data = await Transporter.find(transporterId);

    return {
      usuario: data!.brdUser!,
      senha: data!.brdPwd!,
    };
  };

  /**
   * createBrdAxios: creates and returns an axios instace with Brudam configs
   */
  public async createBrdAxios() {
    const brdRes: BrdRes = await axios.post(
      `${this.apiUrl}/acesso/auth/login`,
      await this.getBrdAuth(this.transporterId)
    );

    const tokenBrd = brdRes.data.data.access_key;

    return axios.create({
      baseURL: this.apiUrl,
      headers: {
        Authorization: `Bearer ${tokenBrd}`,
      },
    });
  }
}

class DiretaCfg {
  protected transporterId: number;

  constructor(transporterId: number) {
    this.transporterId = transporterId;
  }

  /**
   * getTransporterId: returns transporter id
   */
  public getTransporterId() {
    return this.transporterId;
  }

  /**
   * createBrdAxios: creates and returns an axios instace with transporter configs
   */
  public async createAxios() {
    const data = await Transporter.find(this.transporterId);

    const { apiToken } = data!;

    return axios.create({
      baseURL: `http://service.simexpress.com.br/diretalog/endpoint`,
      headers: {
        Authorization: `${apiToken}`,
      },
    });
  }
}

class JadLogCfg {
  protected transporterId: number;

  constructor(transporterId: number) {
    this.transporterId = transporterId;
  }

  /**
   * getTransporterId: returns transporter id
   */
  public getTransporterId() {
    return this.transporterId;
  }

  /**
   * createBrdAxios: creates and returns an axios instace with transporter configs
   */
  public async createAxios() {
    const data = await Transporter.find(this.transporterId);

    const { apiToken } = data!;

    return axios.create({
      baseURL: `http://www.jadlog.com.br/embarcador/api`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });
  }
}

export { Brudam, DiretaCfg, JadLogCfg };
