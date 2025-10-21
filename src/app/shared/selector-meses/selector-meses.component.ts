import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MESES } from '../../@core/constants/meses.constants';

@Component({
  selector: 'app-selector-meses',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-wrap gap-2 mb-6">
      @for (mes of meses; track mes) {
      <button
        class="px-3 py-1 rounded-lg border text-sm font-medium cursor-pointer"
        [ngClass]="{
          'bg-blue-600 text-white border-blue-600': mes === mesSeleccionado,
          'bg-white text-gray-700 border-gray-300 hover:bg-gray-100': mes !== mesSeleccionado
        }"
        (click)="onMesSeleccionado(mes)"
      >
        {{ mes | titlecase }}
      </button>
      }
    </div>
  `,
})
export class SelectorMesesComponent {
  @Input() mesSeleccionado = MESES[new Date().getMonth()];
  @Output() mesChange = new EventEmitter<string>();

  meses = MESES;

  onMesSeleccionado(mes: string) {
    this.mesSeleccionado = mes;
    this.mesChange.emit(mes);
  }
}
