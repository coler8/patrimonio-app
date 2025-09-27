import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';

interface Columna {
  key: string;
  label: string;
  className?: string;
  format?: (valor: any) => string;
}

@Component({
  selector: 'app-historial-detallado',
  templateUrl: './historial-detallado.html',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
})
export class HistorialDetalladoComponent {
  @Input() historial: any[] = [];

  // Configuración dinámica de columnas
  columnas: Columna[] = [
    {
      key: 'fecha',
      label: 'Mes',
      format: (v: Date) => v.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
    },
    { key: 'total', label: 'Total', format: (v: number) => `€${v.toLocaleString()}` },
    {
      key: 'cambio',
      label: 'Cambio',
      format: (v: number) => `€${v.toLocaleString()}`,
    },
    {
      key: 'crecimiento',
      label: 'Crecimiento %',
      format: (v: number) => v.toFixed(1) + '%',
    },
    { key: 'liquidez', label: 'Liquidez', format: (v: number) => `€${v.toLocaleString()}` },
    { key: 'cryptos', label: 'Cryptos', format: (v: number) => `€${v.toLocaleString()}` },
    { key: 'fondosIndexados', label: 'Fondos', format: (v: number) => `€${v.toLocaleString()}` },
    {
      key: 'cuentasRemuneradas',
      label: 'C. Remuneradas',
      format: (v: number) => `€${v.toLocaleString()}`,
    },
  ];

  getCambioMensual(index: number): number {
    if (index + 1 >= this.historial.length) return 0;
    return this.historial[index].total - this.historial[index + 1].total;
  }

  getCambioColor(index: number): string {
    const cambio = this.getCambioMensual(index);
    return cambio > 0 ? 'text-green-600' : cambio < 0 ? 'text-red-600' : 'text-gray-600';
  }

  getCrecimientoMensual(index: number): number {
    const actual = this.historial[index].total;
    const anterior = this.historial[index + 1]?.total || actual;
    if (anterior === 0) return 0;
    return ((actual - anterior) / anterior) * 100;
  }

  getCrecimientoColor(index: number): string {
    const crecimiento = this.getCrecimientoMensual(index);
    return crecimiento > 0 ? 'text-green-600' : crecimiento < 0 ? 'text-red-600' : 'text-gray-600';
  }

  exportarHistorial() {
    const headers = this.columnas.map((c) => c.label);
    const rows = this.historial.map((mes, i) =>
      this.columnas.map((c) => {
        switch (c.key) {
          case 'cambio':
            return this.getCambioMensual(i);
          case 'crecimiento':
            return this.getCrecimientoMensual(i);
          case 'fecha':
            return c.format ? c.format(mes.fecha) : mes.fecha;
          default:
            return c.format
              ? c.format(mes.distribucion?.[c.key] ?? mes[c.key])
              : mes.distribucion?.[c.key] ?? mes[c.key];
        }
      })
    );
    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'historial.csv';
    link.click();
  }
}
