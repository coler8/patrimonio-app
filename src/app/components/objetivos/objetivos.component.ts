import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatrimonioService } from '../../@core/services/patrimonio.service';

@Component({
  selector: 'app-objetivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './objetivos.component.html',
})
export class ObjetivosComponent {
  private patrimonioService = inject(PatrimonioService);
  resumen = this.patrimonioService.resumen;
}
