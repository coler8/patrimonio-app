export interface DistribucionPatrimonio {
  liquidez: number;
  fondosIndexados: number;
  tradeRepublic: number;
  myInvestor: number;
  cryptos: CryptoDetail;
}

export interface ObjetivosPatrimonio {
  liquidez: number;
  cuentasRemuneradas: number;
  cryptos: number;
  fondosIndexados: number;
}

export interface HistorialMensual {
  fecha: string;
  ingresos: number;
  gastos: number;

  // Distribución en cuentas
  sabadell: number;
  myInvestor: number;
  fondosIndexados: number;
  tradeRepublic: number;
  zen: number;

  // Criptos
  cryptos: CryptoDetail;

  // 🔥 Campos calculados para Evolución
  total?: number;
  distribucion?: DistribucionPatrimonio;
  rentabilidad: number;
}

export interface ResumenPatrimonio {
  total: number;
  ingresosMensuales: number;
  gastosMensuales: number;
  ahorroMensual: number;
  rentabilidadMensual: number;
}

export type PorcentajesDistribucion = Record<keyof ObjetivosPatrimonio, number>;

export type ObjetivosKeys = keyof ObjetivosPatrimonio;

export interface CryptoDetail {
  [CryptoWallet.BINANCE]: number;
  [CryptoWallet.BITGET]: number;
  [CryptoWallet.QUANTFURY]: number;
  [CryptoWallet.SIMPLEFX]: number;
  [CryptoWallet.COINBASE]: number;
}

export interface MesHistorial {
  ingresos: number;
  gastos: number;
  sabadell: number;
  myInvestor: number;
  fondosIndexados: number;
  tradeRepublic: number;
  zen: number;
  cryptos: CryptoDetail;
}

export type Historial = Record<string, MesHistorial>;

export enum CryptoWallet {
  BINANCE = 'binance',
  BITGET = 'bitget',
  QUANTFURY = 'quantfury',
  SIMPLEFX = 'simplefx',
  COINBASE = 'coinbase',
}
