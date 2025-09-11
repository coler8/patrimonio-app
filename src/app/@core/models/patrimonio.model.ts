export interface DistribucionPatrimonio {
  liquidez: number;
  cuentasRemuneradas: number;
  rentaVariable: number;
  rentaFija: number;
  cryptos: number;
  fondosIndexados: number;
}

export interface ObjetivosPatrimonio {
  liquidez: number;
  cuentasRemuneradas: number;
  rentaVariable: number;
  rentaFija: number;
  cryptos: number;
  fondosIndexados: number;
}

export interface HistorialMensual {
  fecha: Date;
  distribucion: DistribucionPatrimonio;
  total: number;
  rentabilidad?: number;
}

export interface ResumenPatrimonio {
  total: number;
  ingresosMensuales: number;
  ahorroMensual: number;
  rentabilidadTotal: number;
}

export type PorcentajesDistribucion = Record<keyof ObjetivosPatrimonio, number>;

export type ObjetivosKeys = keyof ObjetivosPatrimonio;
