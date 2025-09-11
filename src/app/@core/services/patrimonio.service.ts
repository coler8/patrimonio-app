import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  DistribucionPatrimonio,
  ObjetivosPatrimonio,
  HistorialMensual,
  ResumenPatrimonio,
  PorcentajesDistribucion,
} from '../models/patrimonio.model';

@Injectable({
  providedIn: 'root',
})
export class PatrimonioService {
  // Signals para manejo de estado reactivo
  private _distribucion = signal<DistribucionPatrimonio>({
    liquidez: 5000,
    cuentasRemuneradas: 15000,
    rentaVariable: 25000,
    rentaFija: 10000,
    cryptos: 3000,
    fondosIndexados: 20000,
  });

  private _objetivos = signal<ObjetivosPatrimonio>({
    liquidez: 15,
    cuentasRemuneradas: 20,
    rentaVariable: 30,
    rentaFija: 15,
    cryptos: 5,
    fondosIndexados: 15,
  });

  private _historial = signal<HistorialMensual[]>([
    {
      fecha: new Date(2024, 6, 1),
      distribucion: {
        liquidez: 4500,
        cuentasRemuneradas: 12000,
        rentaVariable: 20000,
        rentaFija: 8000,
        cryptos: 2500,
        fondosIndexados: 15000,
      },
      total: 62000,
      rentabilidad: 7.2,
    },
    {
      fecha: new Date(2024, 7, 1),
      distribucion: {
        liquidez: 4800,
        cuentasRemuneradas: 13500,
        rentaVariable: 22000,
        rentaFija: 9000,
        cryptos: 2800,
        fondosIndexados: 17000,
      },
      total: 69100,
      rentabilidad: 8.1,
    },
    {
      fecha: new Date(2024, 8, 1),
      distribucion: {
        liquidez: 5000,
        cuentasRemuneradas: 15000,
        rentaVariable: 25000,
        rentaFija: 10000,
        cryptos: 3000,
        fondosIndexados: 20000,
      },
      total: 78000,
      rentabilidad: 8.5,
    },
  ]);

  private _ingresosMensuales = signal(4500);
  private _rentabilidadTotal = signal(8.5);

  // Computed signals
  readonly distribucion = this._distribucion.asReadonly();
  readonly objetivos = this._objetivos.asReadonly();
  readonly historial = this._historial.asReadonly();
  readonly ingresosMensuales = this._ingresosMensuales.asReadonly();
  readonly rentabilidadTotal = this._rentabilidadTotal.asReadonly();

  readonly patrimonioTotal = computed(() => {
    const dist = this._distribucion();
    return Object.values(dist).reduce((sum, value) => sum + value, 0);
  });

  readonly porcentajes = computed((): PorcentajesDistribucion => {
    const dist = this._distribucion();
    const total = this.patrimonioTotal();

    return {
      liquidez: total > 0 ? (dist.liquidez / total) * 100 : 0,
      cuentasRemuneradas: total > 0 ? (dist.cuentasRemuneradas / total) * 100 : 0,
      rentaVariable: total > 0 ? (dist.rentaVariable / total) * 100 : 0,
      rentaFija: total > 0 ? (dist.rentaFija / total) * 100 : 0,
      cryptos: total > 0 ? (dist.cryptos / total) * 100 : 0,
      fondosIndexados: total > 0 ? (dist.fondosIndexados / total) * 100 : 0,
    };
  });

  readonly ahorroMensual = computed(() => {
    const historial = this._historial();
    const totalActual = this.patrimonioTotal();

    if (historial.length === 0) return 0;

    const ultimoMes = historial[historial.length - 1];
    return totalActual - ultimoMes.total;
  });

  readonly resumen = computed(
    (): ResumenPatrimonio => ({
      total: this.patrimonioTotal(),
      ingresosMensuales: this._ingresosMensuales(),
      ahorroMensual: this.ahorroMensual(),
      rentabilidadTotal: this._rentabilidadTotal(),
    })
  );

  // Métodos para actualizar datos
  actualizarDistribucion(distribucion: DistribucionPatrimonio): void {
    this._distribucion.set(distribucion);
  }

  actualizarObjetivos(objetivos: ObjetivosPatrimonio): void {
    this._objetivos.set(objetivos);
  }

  actualizarIngresosMensuales(ingresos: number): void {
    this._ingresosMensuales.set(ingresos);
  }

  guardarMesActual(): void {
    const nuevoRegistro: HistorialMensual = {
      fecha: new Date(),
      distribucion: { ...this._distribucion() },
      total: this.patrimonioTotal(),
      rentabilidad: this._rentabilidadTotal(),
    };

    this._historial.update((historial) => [...historial, nuevoRegistro]);
  }

  // Métodos para obtener datos formateados para gráficos
  getDistribucionParaGrafico() {
    const dist = this._distribucion();
    return {
      labels: Object.keys(dist).map((key) => this.formatearNombreCategoria(key)),
      values: Object.values(dist),
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
    };
  }

  getEvolucionParaGrafico() {
    const historial = this._historial();
    return {
      labels: historial.map((h) =>
        h.fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
      ),
      data: historial.map((h) => h.total),
    };
  }

  private formatearNombreCategoria(categoria: string): string {
    return categoria
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  // Persistencia local (opcional)
  guardarEnLocalStorage(): void {
    const data = {
      distribucion: this._distribucion(),
      objetivos: this._objetivos(),
      historial: this._historial(),
      ingresosMensuales: this._ingresosMensuales(),
      rentabilidadTotal: this._rentabilidadTotal(),
    };
    localStorage.setItem('patrimonioData', JSON.stringify(data));
  }

  cargarDeLocalStorage(): void {
    const data = localStorage.getItem('patrimonioData');
    if (data) {
      const parsed = JSON.parse(data);
      this._distribucion.set(parsed.distribucion);
      this._objetivos.set(parsed.objetivos);
      this._historial.set(
        parsed.historial.map((h: any) => ({
          ...h,
          fecha: new Date(h.fecha),
        }))
      );
      this._ingresosMensuales.set(parsed.ingresosMensuales);
      this._rentabilidadTotal.set(parsed.rentabilidadTotal);
    }
  }
}
