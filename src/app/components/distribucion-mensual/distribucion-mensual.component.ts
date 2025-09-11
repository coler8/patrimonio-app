import { Component, OnInit, ViewChild, ElementRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { DistribucionPatrimonio } from '../../@core/models/patrimonio.model';
import { PatrimonioService } from '../../@core/services/patrimonio.service';

@Component({
  selector: 'app-distribucion-mensual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './distribucion-mensual.component.html',
})
export class DistribucionMensualComponent implements OnInit {
  private patrimonioService = inject(PatrimonioService);

  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  distribucionLocal!: DistribucionPatrimonio;
  private chart?: Chart;

  distribucion = this.patrimonioService.distribucion;
  porcentajes = this.patrimonioService.porcentajes;

  constructor() {
    // Effect para actualizar el gráfico cuando cambien los datos
    effect(() => {
      this.updateChart();
    });
  }

  ngOnInit() {
    this.distribucionLocal = { ...this.distribucion() };
    this.initChart();
  }

  onDistribucionChange() {
    this.patrimonioService.actualizarDistribucion(this.distribucionLocal);
  }

  guardarMes() {
    this.patrimonioService.guardarMesActual();
    this.patrimonioService.guardarEnLocalStorage();
    alert('Mes guardado correctamente');
  }

  private initChart() {
    const data = this.patrimonioService.getDistribucionParaGrafico();

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: data.colors,
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
            },
          },
        },
      },
    };

    // this.chart = new Chart(this.chartCanvas.nativeElement, config);
  }

  private updateChart() {
    if (!this.chart) return;

    const data = this.patrimonioService.getDistribucionParaGrafico();
    this.chart.data.labels = data.labels;
    this.chart.data.datasets[0].data = data.values;
    this.chart.update();
  }
}
