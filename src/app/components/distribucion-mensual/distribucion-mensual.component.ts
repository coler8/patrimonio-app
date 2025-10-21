import { Component, OnInit, inject, effect, signal } from '@angular/core';
import { PatrimonioService } from '../../@core/services/patrimonio.service';
import { ChartConfiguration } from 'chart.js';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { HistorialDetalladoComponent } from '../../shared/historial-detallado/historial-detallado';
import { SelectorMesesComponent } from '../../shared/selector-meses/selector-meses.component';
import {
  CryptoDetail,
  CryptoWallet,
  DistribucionPatrimonio,
} from '../../@core/models/patrimonio.model';
import { MESES } from '../../@core/constants/meses.constants';
import { PatrimonioApiService } from '../../@core/services/patrimonio-api.service';

interface CategoriaPatrimonio {
  categoria: string;
  objetivo: number;
  actual: number;
  color: string;
}

interface ConceptoNomina {
  concepto: string;
  porcentaje: number;
  color: string;
}

@Component({
  selector: 'app-distribucion-mensual',
  templateUrl: './distribucion-mensual.component.html',
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective,
    HistorialDetalladoComponent,
    SelectorMesesComponent,
  ],
  standalone: true,
})
export class DistribucionMensualComponent implements OnInit {
  public patrimonioService = inject(PatrimonioService);
  public patrimonioApiService = inject(PatrimonioApiService);

  distribucionLocal!: DistribucionPatrimonio;
  porcentajes = this.patrimonioService.porcentajes;
  distribucion = this.patrimonioService.distribucion;

  objetivosPatrimonio: CategoriaPatrimonio[] = [
    { categoria: 'Liquidez', objetivo: 10, actual: 0, color: '#3B82F6' },
    { categoria: 'Fondos Indexados', objetivo: 40, actual: 0, color: '#F59E0B' },
    { categoria: 'Cryptos', objetivo: 15, actual: 0, color: '#EF4444' },
    { categoria: 'Cuentas Remuneradas', objetivo: 35, actual: 0, color: '#10B981' },
  ];

  reparticionNomina: ConceptoNomina[] = [
    { concepto: 'Ahorro/Inversión', porcentaje: 20, color: '#3b82f6' },
    { concepto: 'Vivienda', porcentaje: 30, color: '#10b981' },
    { concepto: 'Alimentación', porcentaje: 15, color: '#f59e0b' },
    { concepto: 'Transporte', porcentaje: 10, color: '#8b5cf6' },
    { concepto: 'Ocio', porcentaje: 10, color: '#ec4899' },
    { concepto: 'Servicios', porcentaje: 10, color: '#06b6d4' },
    { concepto: 'Otros', porcentaje: 5, color: '#6366f1' },
  ];

  chartDistribucionOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          generateLabels: (chart) => {
            const data = chart.data;
            const dataset = data.datasets[0].data as number[];
            const total = dataset.reduce((a: number, b: number) => a + b, 0);

            return (data.labels ?? []).map((label, i: number) => {
              const value = dataset[i] || 0;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';

              return {
                text: `${label as string}: ${value}€ (${percentage}%)`,
                fillStyle: (data.datasets[0] as any).backgroundColor[i],
                strokeStyle: (data.datasets[0] as any).backgroundColor[i],
                fontColor: '#fff', // 👈 para Chart.js < 4
                font: {
                  // 👈 para Chart.js 4.x+
                  size: 12,
                  family: 'Arial',
                  weight: 'normal',
                  style: 'normal',
                },
                hidden: false,
                index: i,
              };
            });
          },
          color: '#fff', // 👈 fallback si no respeta el font
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const dataset = context.dataset.data as number[];
            const total = dataset.reduce((a, b) => a + (b as number), 0);
            const value = context.raw as number;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${context.label}: ${value}€ (${percentage}%)`;
          },
        },
      },
    },
  };

  pluginsDistribucionOptions = [
    {
      id: 'centerText',
      afterDraw: (chart: any) => {
        const { ctx, chartArea, data } = chart;
        const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);

        ctx.save();
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `Total: ${total} €`,
          (chartArea.left + chartArea.right) / 2,
          (chartArea.top + chartArea.bottom) / 2
        );
        ctx.restore();
      },
    },
    {
      id: 'percentLabelsWithLabel',
      afterDraw: (chart: any) => {
        const { ctx, data } = chart;
        const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
        const meta = chart.getDatasetMeta(0);

        ctx.save();
        meta.data.forEach((arc: any, index: number) => {
          const value = data.datasets[0].data[index];
          const label = data.labels[index];
          const percentage = ((value / total) * 100).toFixed(1) + '%';
          const { x, y } = arc.getCenterPoint();

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.fillText(`${label} ${percentage}`, x, y);
        });
        ctx.restore();
      },
    },
  ];

  historial = this.patrimonioService.historial;
  historialOrdenado = this.historial().sort((a, b) => {
    const fechaA = typeof a.fecha === 'string' ? new Date(a.fecha) : a.fecha;
    const fechaB = typeof b.fecha === 'string' ? new Date(b.fecha) : b.fecha;
    return fechaB.getTime() - fechaA.getTime();
  });

  mesSeleccionado = MESES[new Date().getMonth()];
  meses = MESES;

  cryptoWallets: CryptoWallet[] = [
    CryptoWallet.BINANCE,
    CryptoWallet.BITGET,
    CryptoWallet.QUANTFURY,
    CryptoWallet.SIMPLEFX,
    CryptoWallet.COINBASE,
  ];

  distribucionValues = signal<number[]>([0, 0, 0, 0]);
  distribucionLabels: string[] = ['Liquidez', 'Cuenta Remunerada', 'Fondos Indexados', 'Crypto'];
  distribucionColors: string[] = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#8B5CF6'];

  constructor() {
    // Efecto que se dispara cuando cambia el mes seleccionado o la distribución
    effect(() => {
      const mesSel = this.patrimonioService.mesSeleccionado(); // señal
      this.actualizarGraficos(); // actualiza distribucionValues según mes
    });
  }

  ngOnInit() {
    this.patrimonioService.seleccionarMes(this.mesSeleccionado);
    this.cargarResumenMes(this.mesSeleccionado);
  }

  cargarResumenMes(mes: string) {
    this.mesSeleccionado = mes;
    this.patrimonioService.seleccionarMes(mes);

    const encontrado = this.historial().find((h) => h.fecha.toLowerCase() === mes.toLowerCase());

    if (encontrado) {
      this.distribucionLocal = {
        liquidez: encontrado.sabadell || 0,
        zen: encontrado.zen || 0,
        tradeRepublic: encontrado.tradeRepublic || 0,
        myInvestor: encontrado.myInvestor || 0,
        fondosIndexados: encontrado.fondosIndexados || 0,
        cryptos: { ...encontrado.cryptos },
        cuentasRemuneradas: encontrado.tradeRepublic + encontrado.myInvestor,
      };
    } else {
      this.distribucionLocal = {
        liquidez: 0,
        zen: 0,
        tradeRepublic: 0,
        myInvestor: 0,
        fondosIndexados: 0,
        cryptos: {
          binance: 0,
          bitget: 0,
          quantfury: 0,
          simplefx: 0,
          coinbase: 0,
        },
        cuentasRemuneradas: 0,
      };
    }
  }

  onDistribucionChange() {
    // Actualizar el service global
    this.patrimonioService.actualizarDistribucion(this.distribucionLocal);

    // Actualizar el historial del mes seleccionado
    const mes = this.historial().find(
      (h) => h.fecha.toLowerCase() === this.mesSeleccionado.toLowerCase()
    );
    if (mes) {
      mes.sabadell = this.distribucionLocal.liquidez ?? 0;
      mes.tradeRepublic = this.distribucionLocal.tradeRepublic ?? 0;
      mes.myInvestor = this.distribucionLocal.myInvestor ?? 0;
      mes.fondosIndexados = this.distribucionLocal.fondosIndexados ?? 0;
      mes.cryptos = { ...this.distribucionLocal.cryptos };
    }
  }

  guardarMes() {
    // Actualizar el historial local
    this.patrimonioService.guardarEnLocalStorage();

    // Preparar los datos para la API
    const patrimonioData = {
      historial: this.patrimonioService.historial(),
      objetivos: {
        liquidez:
          this.objetivosPatrimonio.find((obj) => obj.categoria === 'Efectivo/Ahorro')?.objetivo ||
          0,
        cryptos:
          this.objetivosPatrimonio.find((obj) => obj.categoria === 'Criptomonedas')?.objetivo || 0,
        fondosIndexados:
          this.objetivosPatrimonio.find((obj) => obj.categoria === 'Inversiones')?.objetivo || 0,
      },
    };

    // Enviar a la API
    this.patrimonioApiService.updatePatrimonio(patrimonioData).subscribe({
      next: () => {
        alert('Mes guardado correctamente en local y en la API');
      },
      error: (error) => {
        console.error('Error al guardar en la API:', error);
        alert('Los datos se guardaron localmente pero hubo un error al guardar en la API');
      },
    });
  }

  totalCrypto() {
    return Object.values(this.distribucionLocal.cryptos).reduce((a, b) => a + (b || 0), 0);
  }

  totalMesSeleccionado() {
    const baseTotal =
      this.distribucionLocal.liquidez +
      (this.distribucionLocal?.zen || 0) +
      this.distribucionLocal.cuentasRemuneradas +
      this.distribucionLocal.fondosIndexados;
    return baseTotal + this.totalCrypto();
  }

  get totalObjetivo(): number {
    return this.objetivosPatrimonio.reduce((acc, item) => acc + item.objetivo, 0);
  }

  get totalActual(): number {
    return this.objetivosPatrimonio.reduce((acc, item) => acc + item.actual, 0);
  }

  actualizarMonto(categoria: string, nuevoMonto: number) {
    const total = this.patrimonioService.patrimonioTotal();
    const index = this.objetivosPatrimonio.findIndex((obj) => obj.categoria === categoria);
    if (index !== -1) {
      this.objetivosPatrimonio[index].actual = nuevoMonto;
      // Actualizar el porcentaje objetivo basado en el nuevo monto
      this.objetivosPatrimonio[index].objetivo = (nuevoMonto / total) * 100;
    }
  }

  private actualizarGraficos() {
    const mesSel = this.patrimonioService.mesSeleccionado(); // señal del mes
    const historial = this.patrimonioService.historial(); // historial completo

    const registro = historial.find((h) => h.fecha.toLowerCase() === mesSel.toLowerCase());
    if (!registro) return;

    const cuentaRemunerada = (registro.myInvestor || 0) + (registro.tradeRepublic || 0);
    const liquidez = (registro.sabadell || 0) + (registro.zen || 0);
    const fondosIndexados = registro.fondosIndexados || 0;
    const crypto = this.patrimonioService.sumarCryptos(registro.cryptos);

    this.distribucionValues.set([liquidez, cuentaRemunerada, fondosIndexados, crypto]);

    // Actualizar los montos actuales en objetivosPatrimonio
    this.actualizarMontosActuales(registro);
  }

  private actualizarMontosActuales(registro: any) {
    const total = this.patrimonioService.patrimonioTotal();

    // Actualizar los montos actuales según la distribución real
    this.objetivosPatrimonio = this.objetivosPatrimonio.map((obj) => {
      let montoActual = 0;
      switch (obj.categoria) {
        case 'Inversiones':
          montoActual = registro.fondosIndexados || 0;
          break;
        case 'Criptomonedas':
          montoActual = this.patrimonioService.sumarCryptos(registro.cryptos);
          break;
        case 'Efectivo/Ahorro':
          montoActual = (registro.sabadell || 0) + (registro.zen || 0);
          break;
        case 'Propiedades':
          montoActual = (registro.tradeRepublic || 0) + (registro.myInvestor || 0);
          break;
      }
      return {
        ...obj,
        actual: montoActual,
      };
    });
  }

  calcularMontoActual(objetivo: number): number {
    const total = this.patrimonioService.patrimonioTotal();
    return (objetivo / 100) * total;
  }

  calcularPorcentajeActual(monto: number): number {
    const total = this.patrimonioService.patrimonioTotal();
    if (total === 0) return 0;
    return (monto / total) * 100;
  }

  calcularCumplimiento(objetivo: number, actual: number): string {
    if (objetivo === 0) return '0';
    return ((actual / objetivo) * 100).toFixed(1);
  }
}
