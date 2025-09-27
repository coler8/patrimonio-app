import { Component, OnInit, inject, effect } from '@angular/core';
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

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
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

  pluginsOptions = []; // opcional: tus plugins personalizados

  distribucionLabels: string[] = [];
  distribucionValues: number[] = [];
  distribucionColors: string[] = [];

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

  constructor() {
    effect(() => {
      const dist = this.patrimonioService.distribucion();
      this.distribucionLabels = Object.keys(dist);
      this.distribucionValues = Object.values(dist);
      this.distribucionColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#8B5CF6'];
    });
  }

  ngOnInit() {
    this.patrimonioService.seleccionarMes(this.mesSeleccionado);
  }

  cargarResumenMes(mes: string) {
    this.mesSeleccionado = mes;
    this.patrimonioService.seleccionarMes(mes);

    const encontrado = this.historial().find((h) => h.fecha.toLowerCase() === mes.toLowerCase());

    if (encontrado) {
      this.distribucionLocal = {
        liquidez: encontrado.sabadell || 0,
        tradeRepublic: encontrado.tradeRepublic || 0,
        myInvestor: encontrado.myInvestor || 0,
        fondosIndexados: encontrado.fondosIndexados || 0,
        cryptos: { ...encontrado.cryptos },
      };
    } else {
      this.distribucionLocal = {
        liquidez: 0,
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
      mes.sabadell = this.distribucionLocal.liquidez;
      mes.tradeRepublic = this.distribucionLocal.tradeRepublic;
      mes.myInvestor = this.distribucionLocal.myInvestor;
      mes.fondosIndexados = this.distribucionLocal.fondosIndexados;
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
      this.distribucionLocal.tradeRepublic +
      this.distribucionLocal.myInvestor +
      this.distribucionLocal.fondosIndexados;
    return baseTotal + this.totalCrypto();
  }
}
