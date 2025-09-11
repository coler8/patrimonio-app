import { Component, effect, inject } from '@angular/core';
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
export class EvolucionComponent {
  private patrimonioService = inject(PatrimonioService);

  vistaGrafico = 'total';
  periodoVista = 'todos';
  objetivoAnual = 100000;

  historial = this.patrimonioService.historial;
  patrimonioTotal = this.patrimonioService.patrimonioTotal;
  historialOrdenado = this.historial().sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  // Configuración inicial del gráfico
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
      this.updateChart();
    });
  }

  updateChart() {
    const data = this.patrimonioService.getEvolucionParaGrafico();
    this.lineChartData.labels = data.labels;
    this.lineChartData.datasets[0].data = data.data; // values
  }
}
