import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatrimonioService } from '../../@core/services/patrimonio.service';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resumen.component.html',
})
export class ResumenComponent {
  private patrimonioService = inject(PatrimonioService);
  resumen = this.patrimonioService.resumen;

  constructor() {}
}
