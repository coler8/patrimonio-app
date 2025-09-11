import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResumenComponent } from './components/resumen/resumen.component';
import { PatrimonioService } from './@core/services/patrimonio.service';
import { DistribucionMensualComponent } from './components/distribucion-mensual/distribucion-mensual.component';
import { ObjetivosComponent } from './components/objetivos/objetivos.component';
import { EvolucionComponent } from './components/evolucion/evolucion.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ResumenComponent,
    DistribucionMensualComponent,
    ObjetivosComponent,
    EvolucionComponent,
  ],
  templateUrl: './app.html',
})
export class AppComponent implements OnInit {
  activeTab = signal('mensual');

  tabs = [
    { id: 'mensual', label: 'Distribución Mensual' },
    { id: 'objetivos', label: 'Objetivos' },
    { id: 'evolucion', label: 'Evolución' },
  ];

  constructor(private patrimonioService: PatrimonioService) {}

  ngOnInit() {
    this.patrimonioService.cargarDeLocalStorage();
  }
}
