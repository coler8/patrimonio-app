import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input, Input } from '@angular/core';
import { HistorialMensual } from '../../@core/models/patrimonio.model';
import { MESES } from '../../@core/constants/meses.constants';

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
})
export class HistorialDetalladoComponent {
  historial = input<HistorialMensual[]>();

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
    const data = this.historial() ?? [];
    if (index + 1 >= data.length) return 0;
    const actual = data[index]?.total ?? 0;
    const anterior = data[index + 1]?.total ?? 0;
    return actual - anterior;
  }

  getCambioColor(index: number): string {
    const cambio = this.getCambioMensual(index);
    return cambio > 0 ? 'text-green-600' : cambio < 0 ? 'text-red-600' : 'text-gray-600';
  }

  getCrecimientoMensual(index: number): number {
    const data = this.historial() ?? [];
    const actual = data[index]?.total ?? 0;
    const anterior = data[index + 1]?.total ?? actual;
    if (anterior === 0) return 0;
    return ((actual - anterior) / anterior) * 100;
  }

  getCrecimientoColor(index: number): string {
    const crecimiento = this.getCrecimientoMensual(index);
    return crecimiento > 0 ? 'text-green-600' : crecimiento < 0 ? 'text-red-600' : 'text-gray-600';
  }

  exportarHistorial() {
    const data = this.historial() ?? [];
    const headers = this.columnas.map((c) => c.label);
    const rows = data.map((mes, i) =>
      this.columnas.map((c) => {
        switch (c.key) {
          case 'cambio':
            return this.getCambioMensual(i);
          case 'crecimiento':
            return this.getCrecimientoMensual(i);
          case 'fecha':
            return c.format ? c.format(mes.fecha) : mes.fecha;
          default:
            return mes.distribucion;
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
