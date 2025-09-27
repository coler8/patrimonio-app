import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  DistribucionPatrimonio,
  ObjetivosPatrimonio,
  HistorialMensual,
  ResumenPatrimonio,
  CryptoDetail,
} from '../models/patrimonio.model';
import { HttpClient } from '@angular/common/http';
import { MESES } from '../constants/meses.constants';

const INFLACION = 2.5;

@Injectable({
  providedIn: 'root',
})
export class PatrimonioService {
  private http = inject(HttpClient);

  private _objetivos = signal<ObjetivosPatrimonio>({
    liquidez: 0,
    cuentasRemuneradas: 0,
    cryptos: 0,
    fondosIndexados: 0,
  });

  private _historial = signal<HistorialMensual[]>([]);
  private _ingresosMensuales = signal<number>(0);
  private _rentabilidadMensual = signal<number>(0);

  private _datosJSON: {
    objetivos: ObjetivosPatrimonio;
    historial: HistorialMensual[];
    ingresosMensuales: number;
    rentabilidadMensual: number;
  } | null = null;

  readonly objetivos = this._objetivos.asReadonly();
  readonly historial = this._historial.asReadonly();
  readonly rentabilidadMensual = this._rentabilidadMensual.asReadonly();

  readonly ingresosMensuales = computed(() => {
    const historial = this._historial();
    if (!historial.length) return 0;

    // obtenemos el índice del mes actual
    const mesActual = this.obtenerMesActual();
    const indexMesActual = historial.findIndex((h) => h.fecha === mesActual);

    // mes anterior
    const indexAnterior = indexMesActual > 0 ? indexMesActual - 1 : historial.length - 1;
    const registroAnterior = historial[indexAnterior];
    if (!registroAnterior) return 0;

    return registroAnterior.ingresos ?? 0;
  });

  readonly gastosMensuales = computed(() => {
    const historial = this._historial();
    if (!historial.length) return 0;

    // obtenemos el índice del mes actual
    const mesActual = this.obtenerMesActual();
    const indexMesActual = historial.findIndex((h) => h.fecha === mesActual);

    // mes anterior
    const indexAnterior = indexMesActual > 0 ? indexMesActual - 1 : historial.length - 1;
    const registroAnterior = historial[indexAnterior];
    if (!registroAnterior) return 0;

    return registroAnterior.gastos ?? 0;
  });

  // Distribución calculada dinámicamente según el mes actual
  readonly distribucion = computed<DistribucionPatrimonio>(() => {
    const historial = this._historial();
    const mesActual = this.obtenerMesActual();
    const indexMesActual = historial.findIndex((h) => h.fecha === mesActual);

    const registro = indexMesActual > 0 ? historial[indexMesActual - 1] : null;

    if (!registro) {
      return {
        liquidez: 0,
        cuentasRemuneradas: 0,
        cryptos: { binance: 0, bitget: 0, quantfury: 0, simplefx: 0, coinbase: 0 },
        fondosIndexados: 0,
        tradeRepublic: 0,
        myInvestor: 0,
      };
    }

    return {
      liquidez: registro.sabadell ?? 0,
      cuentasRemuneradas: registro.myInvestor ?? 0,
      cryptos: { ...registro.cryptos },
      fondosIndexados: registro.fondosIndexados ?? 0,
      tradeRepublic: registro.tradeRepublic ?? 0,
      myInvestor: registro.myInvestor ?? 0,
    };
  });

  // Porcentajes por categoría (suma ~100). Devuelve 0 si total = 0
  readonly porcentajes = computed(() => {
    const dist = this.distribucion();
    const total =
      dist.liquidez +
      dist.fondosIndexados +
      dist.tradeRepublic +
      dist.myInvestor +
      Object.values(dist.cryptos).reduce((sum, v) => sum + v, 0);

    if (!total) {
      return {
        liquidez: 0,
        cuentasRemuneradas: 0,
        cryptos: { binance: 0, bitget: 0, quantfury: 0, simplefx: 0, coinbase: 0 },
        fondosIndexados: 0,
        tradeRepublic: 0,
        myInvestor: 0,
      };
    }

    return {
      liquidez: (dist.liquidez / total) * 100,
      cuentasRemuneradas: (dist.tradeRepublic + dist.myInvestor / total) * 100,
      cryptos: {
        binance: (dist.cryptos.binance / total) * 100,
        bitget: (dist.cryptos.bitget / total) * 100,
        quantfury: (dist.cryptos.quantfury / total) * 100,
        simplefx: (dist.cryptos.simplefx / total) * 100,
        coinbase: (dist.cryptos.coinbase / total) * 100,
      } as CryptoDetail,
      fondosIndexados: (dist.fondosIndexados / total) * 100,
      tradeRepublic: (dist.tradeRepublic / total) * 100,
      myInvestor: (dist.myInvestor / total) * 100,
    };
  });

  readonly patrimonioTotal = computed(() => {
    const dist = this.distribucion();
    return (
      dist.liquidez +
      dist.fondosIndexados +
      dist.tradeRepublic +
      dist.myInvestor +
      Object.values(dist.cryptos).reduce((sum, v) => sum + v, 0)
    );
  });

  private _mesSeleccionado = signal<string>(MESES[new Date().getMonth()]);
  private _rentabilidadMesSeleccionado = signal<number>(0);

  readonly mesSeleccionado = this._mesSeleccionado.asReadonly();
  readonly rentabilidadMesSeleccionado = this._rentabilidadMesSeleccionado.asReadonly();

  readonly ingresosMensualesSeleccionado = computed(() => {
    const historial = this._historial();
    const mesSel = this._mesSeleccionado();

    const registro = historial.find((h) => h.fecha.toLowerCase() === mesSel.toLowerCase());
    return registro?.ingresos ?? 0;
  });

  readonly gastosMensualesSeleccionado = computed(() => {
    const historial = this._historial();
    const mesSel = this._mesSeleccionado();

    const registro = historial.find((h) => h.fecha.toLowerCase() === mesSel.toLowerCase());
    return registro?.gastos ?? 0;
  });

  readonly ahorroMensualSeleccionado = computed(() => {
    return this.ingresosMensualesSeleccionado() - this.gastosMensualesSeleccionado();
  });

  readonly resumen = computed<ResumenPatrimonio>(() => this.obtenerResumen());

  constructor() {}

  // ---- MÉTODOS ----

  private obtenerMesActual(): string {
    return MESES[new Date().getMonth()];
  }

  obtenerResumen(): ResumenPatrimonio {
    const historial = this._historial();
    const mesSel = this._mesSeleccionado();

    const registroSel = historial.find((h) => h.fecha.toLowerCase() === mesSel.toLowerCase());

    return {
      total: this.patrimonioTotal(),
      ingresosMensuales: this.ingresosMensualesSeleccionado(),
      gastosMensuales: this.gastosMensualesSeleccionado(),
      ahorroMensual: this.ahorroMensualSeleccionado(),
      rentabilidadMensual: this._rentabilidadMensual(),
    };
  }

  actualizarObjetivos(nuevos: ObjetivosPatrimonio) {
    this._objetivos.set({ ...nuevos });
  }

  guardarEnLocalStorage() {
    const payload = {
      objetivos: this._objetivos(),
      historial: this._historial().map((h) => ({
        ...h,
        fecha: h.fecha,
      })),
      ingresosMensuales: this._ingresosMensuales(),
      rentabilidadMensual: this._rentabilidadMensual(),
    };

    localStorage.setItem('patrimonio', JSON.stringify(payload));
  }

  cargarDatosDesdeJSON(): Observable<any> {
    return this.http.get('assets/datos-patrimonio.json').pipe(
      tap((data: any) => {
        this._datosJSON = data;

        if (data.objetivos) {
          this._objetivos.set({ ...this._objetivos(), ...data.objetivos });
        }
        if (Array.isArray(data.historial)) {
          this._historial.set(
            data.historial.map((h: any) => ({
              ...h,
              fecha: typeof h.fecha === 'string' ? h.fecha : new Date(h.fecha),
            }))
          );
        }
        if (typeof data.rentabilidadMensual === 'number') {
          this._rentabilidadMensual.set(data.rentabilidadMensual);
        }
      })
    );
  }

  actualizarDistribucion(nuevaDistribucion: DistribucionPatrimonio): void {
    const historial = this._historial();
    if (!historial.length) return;

    const mesActual = this.obtenerMesActual();
    const indexActual = historial.findIndex((h) => h.fecha === mesActual);

    const indexAnterior = indexActual > 0 ? indexActual - 1 : historial.length - 1;
    const registroAnterior = historial[indexAnterior];
    if (!registroAnterior) return;

    const total =
      nuevaDistribucion.liquidez +
      nuevaDistribucion.fondosIndexados +
      nuevaDistribucion.tradeRepublic +
      nuevaDistribucion.myInvestor +
      Object.values(nuevaDistribucion.cryptos).reduce((sum, v) => sum + v, 0);

    this._historial.update((prev) =>
      prev.map((h, i) =>
        i === indexAnterior
          ? {
              ...h,
              sabadell: nuevaDistribucion.liquidez,
              cuentasRemuneradas: nuevaDistribucion.myInvestor + nuevaDistribucion.tradeRepublic,
              myInvestor: nuevaDistribucion.myInvestor,
              tradeRepublic: nuevaDistribucion.tradeRepublic,
              fondosIndexados: nuevaDistribucion.fondosIndexados,
              crypto: Object.values(nuevaDistribucion.cryptos).reduce((a, b) => a + b, 0),
              distribucion: nuevaDistribucion,
              total,
            }
          : h
      )
    );
  }

  sumarCryptos(cryptos?: CryptoDetail | null): number {
    if (!cryptos) return 0;
    return Object.values(cryptos).reduce((a, b) => a + (b || 0), 0);
  }

  totalPorcentajeCryptos(): number {
    const cryptos = this.porcentajes().cryptos;
    return Object.values(cryptos).reduce((sum, v) => sum + v, 0);
  }

  calcularRentabilidadMes(mes: string): number {
    const historial = this._historial();
    const index = historial.findIndex((h) => h.fecha.toLowerCase() === mes.toLowerCase());
    if (index <= 0) return 0; // primer mes o no encontrado

    const actual = historial[index];
    const anterior = historial[index - 1];

    const totalActual =
      (actual.sabadell || 0) +
      (actual.tradeRepublic || 0) +
      (actual.myInvestor || 0) +
      (actual.fondosIndexados || 0) +
      this.sumarCryptos(actual.cryptos);

    const totalAnterior =
      (anterior.sabadell || 0) +
      (anterior.tradeRepublic || 0) +
      (anterior.myInvestor || 0) +
      (anterior.fondosIndexados || 0) +
      this.sumarCryptos(anterior.cryptos);

    if (totalAnterior === 0) return 0;

    return ((totalActual - totalAnterior) / totalAnterior) * 100;
  }

  seleccionarMes(mes: string) {
    this._mesSeleccionado.set(mes);
    const rentabilidad = this.calcularRentabilidadMes(mes);
    this._rentabilidadMesSeleccionado.set(rentabilidad);
  }
}
