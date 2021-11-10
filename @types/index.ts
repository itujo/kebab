export interface BrdRes {
  data: {
    data: {
      access_key: string;
    };
  };
}

export interface BrudamResponse {
  message: string;
  status: number;
  data: Datum[];
}

export interface Datum {
  status: number;
  message: string;
  documento: string;
  dados: { [key: string]: null | string }[];
  prev_entrega: string;
  dias_entrega: string;
}

export interface SimexpressApiReturn {
  Retorno: string;
  Mensagem: string;
  consumidor: {
    pedidoCliente: string;
    destinatario: string;
    cidade: string;
    PrevisaoEntrega: string;
  };
  frete: {
    vlrPeso: string;
    vlrAdvalorem: string;
    vlrGRIS: string;
    vlrTotal: string;
    classificacao: string;
  };
  documentoOriginal: {
    'chave': string;
    'numero': string;
    'serie': string;
    'valor declarado': string;
  };
  tracking: [
    {
      tentativaEntrega: string;
      data: string;
      situacao: string;
      codigoInterno: string;
    }
  ];
}
