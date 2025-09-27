import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { PatrimonioService } from '../../@core/services/patrimonio.service';
import { HistorialDetalladoComponent } from '../../shared/historial-detallado/historial-detallado';
import { HistorialMensual } from '../../@core/models/patrimonio.model';

@Component({
  selector: 'app-evolucion',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, HistorialDetalladoComponent],
  templateUrl: './evolucion.component.html',
})
export class EvolucionComponent implements OnInit {
  private patrimonioService = inject(PatrimonioService);

  // vista / filtros
  vistaGrafico = 'total';
  periodoVista: 'todos' | 'ultimo-12' = 'todos';
  objetivoAnual = 100000;

  // Señales / lecturas reactivas del servicio
  historial = this.patrimonioService.historial; // Signal<HistorialMensual[]>
  patrimonioTotal = this.patrimonioService.patrimonioTotal; // computed signal

  // historialOrdenado como computed para reevaluar cuando cambie la señal
  historialOrdenado = computed(() => {
    const raw = (this.historial() || []).map((h) => normalizeHistorial(h));
    // ordenar por fecha desc (más reciente primero). Normalizamos fecha a Date para comparar.
    return raw.sort((a, b) => {
      const ta = new Date(String(a.fecha)).getTime();
      const tb = new Date(String(b.fecha)).getTime();
      return tb - ta;
    });
  });

  // Chart state
  public lineChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Evolución Patrimonio',
        fill: true,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        tension: 0.3,
      },
    ],
  };

  public lineChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  public lineChartType: ChartType = 'line';

  constructor() {
    // efecto reactivo: cuando cambie el historial, actualiza el gráfico
    effect(() => {
      // lee historialOrdenado() para crear dependencia reactiva
      const data = this.getEvolucionParaGrafico();
      this.lineChartData.labels = data.labels;
      this.lineChartData.datasets[0].data = data.data;
    });
  }

  ngOnInit(): void {
    // Si necesitas cargar datos desde JSON aquí:
    // this.patrimonioService.cargarDatosDesdeJSON().subscribe();
  }

  // ----------------------------
  // Helpers y cálculos públicos
  // ----------------------------

  // Devuelve labels/data para el gráfico basándose en historialOrdenado
  getEvolucionParaGrafico(): { labels: string[]; data: number[] } {
    const hist = this.historialOrdenado();
    const limited = this.periodoVista === 'ultimo-12' ? hist.slice(0, 12) : hist;
    // invertimos para que el gráfico muestre cronológicamente de antiguo a nuevo
    const serie = limited.slice().reverse();

    const labels = serie.map((m) => formatFechaLabel(m.fecha));
    const data = serie.map((m) => Number(m.total ?? 0));

    return { labels, data };
  }

  // Crecimiento total en % entre primer y último registro disponible
  crecimientoTotal(): number {
    const h = this.historialOrdenado();
    if (h.length < 2) return 0;
    const inicial = h[h.length - 1]?.total ?? 0; // el más antiguo
    const final = h[0]?.total ?? 0; // el más reciente
    if (inicial === 0) return 0;
    return ((final - inicial) / inicial) * 100;
  }

  crecimientoMensualPromedio(): number {
    const h = this.historialOrdenado();
    if (h.length < 2) return 0;
    let totalCrecimiento = 0;
    let count = 0;
    for (let i = 1; i < h.length; i++) {
      const anterior = h[i].total ?? 0;
      const actual = h[i - 1].total ?? 0;
      if (anterior === 0) continue; // evitar división por 0
      totalCrecimiento += (actual - anterior) / anterior;
      count++;
    }
    if (count === 0) return 0;
    return (totalCrecimiento / count) * 100;
  }

  mayorPatrimonio(): number {
    const h = this.historialOrdenado().map((m) => m.total ?? 0);
    if (!h.length) return 0;
    return Math.max(...h);
  }

  ahorroTotalAcumulado(): number {
    // si por "ahorroTotalAcumulado" quieres suma de la columna "ahorro" (ingresos-gastos),
    // calculamos eso; si quieres otra cosa, lo adaptamos.
    const h = this.historialOrdenado();
    return h.reduce((sum, mes) => sum + ((mes.ingresos ?? 0) - (mes.gastos ?? 0)), 0);
  }

  // Tendencia (simple)
  getTendenciaTexto(): string {
    const crecimiento = this.crecimientoMensualPromedio();
    if (crecimiento > 1) return 'Alcista';
    if (crecimiento < -1) return 'Bajista';
    return 'Estable';
  }

  getTendenciaColor(): string {
    const texto = this.getTendenciaTexto();
    return texto === 'Alcista'
      ? 'text-green-600'
      : texto === 'Bajista'
      ? 'text-red-600'
      : 'text-gray-600';
  }

  getVelocidadCrecimiento(): number {
    return this.crecimientoMensualPromedio();
  }

  getConsistenciaTexto(): string {
    const ultimos = this.historialOrdenado().slice(0, 3);
    if (ultimos.length < 2) return 'Media';
    const diffs = ultimos.map((m, i, arr) =>
      i === 0 ? 0 : (m.total ?? 0) - (arr[i - 1].total ?? 0)
    );
    const allPositive = diffs.slice(1).every((d) => d >= 0);
    const allNegative = diffs.slice(1).every((d) => d <= 0);
    if (allPositive) return 'Alta';
    if (allNegative) return 'Baja';
    return 'Media';
  }

  getConsistenciaColor(): string {
    const texto = this.getConsistenciaTexto();
    return texto === 'Alta'
      ? 'text-green-600'
      : texto === 'Media'
      ? 'text-yellow-600'
      : 'text-red-600';
  }

  // Proyecciones
  proyeccionConservadora(): number {
    const ultimo = this.historialOrdenado()[0]?.total ?? 0;
    const mensual = this.crecimientoMensualPromedio() / 100;
    return ultimo * Math.pow(1 + mensual, 12);
  }

  proyeccionOptimista(): number {
    const ultimo = this.historialOrdenado()[0]?.total ?? 0;
    const mensual = this.crecimientoMensualPromedio() / 100;
    return ultimo * Math.pow(1 + mensual * 1.5, 12);
  }

  // Progreso hacia objetivo anual
  getProgresoObjetivo(): number {
    const total = this.historialOrdenado()[0]?.total ?? 0;
    if (!this.objetivoAnual) return 0;
    return Math.min((total / this.objetivoAnual) * 100, 100);
  }

  // Historial - cambios por fila
  getCambioMensual(index: number): number {
    const h = this.historialOrdenado();
    if (index + 1 >= h.length) return 0;
    return (h[index].total ?? 0) - (h[index + 1].total ?? 0);
  }

  getCambioColor(index: number): string {
    const cambio = this.getCambioMensual(index);
    return cambio > 0 ? 'text-green-600' : cambio < 0 ? 'text-red-600' : 'text-gray-600';
  }

  getCrecimientoMensual(index: number): number {
    const h = this.historialOrdenado();
    const actual = h[index]?.total ?? 0;
    const anterior = h[index + 1]?.total ?? 0;
    if (anterior === 0) return 0;
    return ((actual - anterior) / anterior) * 100;
  }

  getCrecimientoColor(index: number): string {
    const crecimiento = this.getCrecimientoMensual(index);
    return crecimiento > 0 ? 'text-green-600' : crecimiento < 0 ? 'text-red-600' : 'text-gray-600';
  }

  // Export CSV robusto
  exportarHistorial(): void {
    const h = this.historialOrdenado();
    const headers = [
      'Fecha',
      'Total',
      'Cambio',
      'Crecimiento %',
      'Liquidez',
      'Cryptos',
      'Fondos Indexados',
      'Cuenta remuneradas',
      'Ingresos',
      'Gastos',
      'Ahorro',
    ];

    const rows = h.map((m, idx) => {
      const cambio = this.getCambioMensual(idx);
      const crecimiento = this.getCrecimientoMensual(idx);
      return [
        formatFechaLabel(m.fecha),
        m.total ?? 0,
        cambio,
        crecimiento,
        m.distribucion?.liquidez ?? 0,
        m.distribucion?.cryptos ?? 0,
        m.distribucion?.fondosIndexados ?? 0,
        (m.distribucion?.myInvestor ?? 0) + (m.distribucion?.tradeRepublic ?? 0),
        m.ingresos ?? 0,
        m.gastos ?? 0,
        (m.ingresos ?? 0) - (m.gastos ?? 0),
      ];
    });

    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'historial.csv');
    link.click();
    URL.revokeObjectURL(url);
  }
  updateChart() {
    let datos = [...this.historialOrdenado()];

    // 1. Filtrar por período
    if (this.periodoVista === 'ultimo-12') {
      datos = datos.slice(0, 12);
    }

    // 2. Labels
    const labels = datos.slice().reverse();

    let datasets: any[] = [];

    // 3. Selección de vista
    if (this.vistaGrafico === 'total') {
      datasets = [
        {
          data: datos
            .slice()
            .reverse()
            .map((m) => m.total ?? 0),
          label: 'Patrimonio Total',
          fill: true,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          tension: 0.3,
        },
      ];
    }

    if (this.vistaGrafico === 'categorias') {
      const serie = datos.slice().reverse();
      datasets = [
        {
          data: serie.map((m) => m.distribucion?.liquidez ?? 0),
          label: 'Liquidez',
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          fill: true,
          tension: 0.3,
        },
        {
          data: serie.map((m) => m.distribucion?.cryptos ?? 0),
          label: 'Cryptos',
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          fill: true,
          tension: 0.3,
        },
        {
          data: serie.map((m) => m.distribucion?.fondosIndexados ?? 0),
          label: 'Fondos Indexados',
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          fill: true,
          tension: 0.3,
        },
        {
          data: serie.map(
            (m) => (m.distribucion?.myInvestor ?? 0) + (m.distribucion?.tradeRepublic ?? 0)
          ),
          label: 'Cuentas Remuneradas',
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          fill: true,
          tension: 0.3,
        },
      ];
    }

    if (this.vistaGrafico === 'rentabilidad') {
      const serie = datos.slice().reverse();
      const rentabilidades = serie.map((m, i) => {
        if (i === 0) return 0;
        const anterior = serie[i - 1].total ?? 0;
        if (anterior === 0) return 0;
        return ((m.total ?? 0 - anterior) / anterior) * 100;
      });

      datasets = [
        {
          data: rentabilidades,
          label: 'Rentabilidad %',
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.3)',
          fill: true,
          tension: 0.3,
        },
      ];
    }

    // 4. Asignar
    this.lineChartData.labels = labels;
    this.lineChartData.datasets = datasets;
  }
}

/**
 * Helpers fuera de la clase
 */

function normalizeHistorial(h: any): HistorialMensual {
  // Asegura estructura mínima y tipos
  const fecha =
    h?.fecha instanceof Date ? h.fecha : tryParseFechaString(h?.fecha) ?? String(h?.fecha ?? '');
  const distribucion = h?.distribucion ?? {
    liquidez: h?.sabadell ?? 0,
    cuentasRemuneradas: h?.cuentasRemuneradas ?? 0,
    cryptos: h?.crypto ?? 0,
    fondosIndexados: h?.fondosIndexados ?? 0,
  };

  return {
    ...h,
    fecha,
    distribucion,
    total: typeof h.total === 'number' ? h.total : calculateTotalFromDistribucion(distribucion),
  } as HistorialMensual;
}

function calculateTotalFromDistribucion(dist: any): number {
  if (!dist) return 0;
  return (
    (Number(dist.liquidez) || 0) +
    (Number(dist.cuentasRemuneradas) || 0) +
    (Number(dist.cryptos) || 0) +
    (Number(dist.fondosIndexados) || 0)
  );
}

function tryParseFechaString(value: any): Date | null {
  if (!value) return null;
  // Si es formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return new Date(String(value));
  }
  // Si es string de mes como "enero", devolvemos Date con primer día del mes del año actual (opcional)
  // Aquí elegimos NO convertir "enero" en Date, y devolvemos null para mantener el string.
  return null;
}

function formatFechaLabel(fecha: Date | string): string {
  if (fecha instanceof Date) {
    return fecha.toISOString().slice(0, 10); // YYYY-MM-DD
  }
  return String(fecha);
}
