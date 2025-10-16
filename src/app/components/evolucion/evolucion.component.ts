import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { PatrimonioService } from '../../@core/services/patrimonio.service';

@Component({
  selector: 'app-evolucion',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './evolucion.component.html',
})
export class EvolucionComponent implements OnInit {
  private patrimonioService = inject(PatrimonioService);

  // vista / filtros
  vistaGrafico = 'total';
  periodoVista: 'todos' | 'ultimo-12' | '6' = 'todos';
  objetivoAnual = 100000;

  // Señales / lecturas reactivas del servicio
  historial = this.patrimonioService.historial; // Signal<HistorialMensual[]>
  patrimonioTotal = this.patrimonioService.patrimonioTotal; // computed signal

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
    effect(() => {
      const data = this.getEvolucionParaGrafico();
      this.lineChartData.labels = data.labels;
      this.lineChartData.datasets[0].data = data.data;
    });
  }

  ngOnInit(): void {}

  // Devuelve labels/data para el gráfico basándose en historialOrdenado
  getEvolucionParaGrafico(): { labels: string[]; data: number[] } {
    const hist = this.historial();
    let datos = hist;
    // Filtrar por periodo
    if (this.periodoVista === 'ultimo-12') {
      datos = datos.slice(-12);
    } else if (this.periodoVista === '6') {
      datos = datos.slice(-6);
    }
    // Ordenar cronológicamente de antiguo a nuevo
    const serie = datos.slice();
    const labels: string[] = [];
    const data: number[] = [];
    for (const m of serie) {
      labels.push(m.fecha);
      // Calcular patrimonio total localmente, igual que el getter del servicio
      const total =
        (m.sabadell || 0) +
        (m.zen || 0) +
        (m.tradeRepublic || 0) +
        (m.myInvestor || 0) +
        (m.fondosIndexados || 0) +
        (m.cryptos ? Object.values(m.cryptos).reduce((a, b) => a + (b || 0), 0) : 0);
      data.push(total);
    }
    return { labels, data };
  }
}
