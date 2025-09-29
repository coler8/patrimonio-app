import { Component, OnInit, inject, effect, signal } from '@angular/core';
import { PatrimonioService } from '../../@core/services/patrimonio.service';
import { ChartConfiguration } from 'chart.js';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { HistorialDetalladoComponent } from '../../shared/historial-detallado/historial-detallado';
import {
  CryptoDetail,
  CryptoWallet,
  DistribucionPatrimonio,
} from '../../@core/models/patrimonio.model';
import { MESES } from '../../@core/constants/meses.constants';

@Component({
  selector: 'app-distribucion-mensual',
  templateUrl: './distribucion-mensual.component.html',
  imports: [CommonModule, FormsModule, BaseChartDirective, HistorialDetalladoComponent],
  standalone: true,
})
export class DistribucionMensualComponent implements OnInit {
  public patrimonioService = inject(PatrimonioService);

  distribucionLocal!: DistribucionPatrimonio;
  porcentajes = this.patrimonioService.porcentajes;
  distribucion = this.patrimonioService.distribucion;

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
    this.patrimonioService.guardarEnLocalStorage();
    alert('Mes guardado correctamente');
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
  }
}
