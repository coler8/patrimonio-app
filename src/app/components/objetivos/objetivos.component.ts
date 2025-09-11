import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatrimonioService } from '../../@core/services/patrimonio.service';
import { ObjetivosKeys, ObjetivosPatrimonio } from '../../@core/models/patrimonio.model';

@Component({
  selector: 'app-objetivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './objetivos.component.html',
})
export class ObjetivosComponent {
  private patrimonioService = inject(PatrimonioService);

  objetivosLocal!: ObjetivosPatrimonio;

  objetivos = this.patrimonioService.objetivos;
  porcentajes = this.patrimonioService.porcentajes;

  categorias: { key: ObjetivosKeys; nombre: string }[] = [
    { key: 'liquidez', nombre: 'Liquidez' },
    { key: 'cuentasRemuneradas', nombre: 'Cuentas Remuneradas' },
    { key: 'rentaVariable', nombre: 'Renta Variable' },
    { key: 'rentaFija', nombre: 'Renta Fija' },
    { key: 'cryptos', nombre: 'Criptomonedas' },
    { key: 'fondosIndexados', nombre: 'Fondos Indexados' },
  ];
  totalObjetivos = computed(() => {
    const obj = this.objetivos();
    return Object.values(obj).reduce((sum, value) => sum + value, 0);
  });

  categoriasEnObjetivo = computed(() => {
    return this.categorias.filter((cat) => Math.abs(this.getDiferencia(cat.key)) <= 2).length;
  });

  categoriasSobreObjetivo = computed(() => {
    return this.categorias.filter((cat) => this.getDiferencia(cat.key) > 2).length;
  });

  categoriasBajoObjetivo = computed(() => {
    return this.categorias.filter((cat) => this.getDiferencia(cat.key) < -2).length;
  });

  constructor() {
    this.objetivosLocal = { ...this.objetivos() };
  }

  onObjetivosChange() {
    this.patrimonioService.actualizarObjetivos(this.objetivosLocal);
    this.patrimonioService.guardarEnLocalStorage();
  }

  getDiferencia(categoria: keyof ObjetivosPatrimonio): number {
    return this.porcentajes()[categoria] - this.objetivos()[categoria];
  }

  getDiferenciaColor(categoria: keyof ObjetivosPatrimonio): string {
    const diff = Math.abs(this.getDiferencia(categoria));
    if (diff <= 2) return 'text-green-600';
    if (diff <= 5) return 'text-orange-600';
    return 'text-red-600';
  }

  getEstadoColor(categoria: keyof ObjetivosPatrimonio): string {
    const diff = this.getDiferencia(categoria);
    if (Math.abs(diff) <= 2) return 'bg-green-400';
    if (diff > 2) return 'bg-orange-400';
    return 'bg-red-400';
  }

  getEstadoTexto(categoria: keyof ObjetivosPatrimonio): string {
    const diff = this.getDiferencia(categoria);
    if (Math.abs(diff) <= 2) return 'En objetivo (±2%)';
    if (diff > 2) return `Sobrepasado (+${diff.toFixed(1)}%)`;
    return `Por debajo (${diff.toFixed(1)}%)`;
  }

  getRecomendacionesPersonalizadas(): string[] {
    const recomendaciones: string[] = [];

    // Análisis de liquidez
    const diffLiquidez = this.getDiferencia('liquidez');
    if (diffLiquidez < -5) {
      recomendaciones.push(
        'Considera aumentar tu liquidez para tener un colchón de emergencia más sólido'
      );
    } else if (diffLiquidez > 10) {
      recomendaciones.push(
        'Tienes demasiado dinero en liquidez, considera invertir parte en activos más rentables'
      );
    }

    // Análisis de criptomonedas
    const diffCryptos = this.getDiferencia('cryptos');
    if (diffCryptos > 5) {
      recomendaciones.push(
        'El porcentaje en criptomonedas es alto, considera reducirlo para menor volatilidad'
      );
    }

    // Análisis de renta variable
    const diffRentaVariable = this.getDiferencia('rentaVariable');
    if (diffRentaVariable < -10) {
      recomendaciones.push(
        'Considera aumentar tu exposición a renta variable para mayor potencial de crecimiento'
      );
    }

    // Análisis de fondos indexados
    const diffFondos = this.getDiferencia('fondosIndexados');
    if (diffFondos < -5) {
      recomendaciones.push(
        'Los fondos indexados ofrecen diversificación a bajo costo, considera aumentar su peso'
      );
    }

    if (recomendaciones.length === 0) {
      recomendaciones.push('Tu distribución está bien balanceada según los objetivos establecidos');
    }

    return recomendaciones;
  }

  // Método auxiliar para Math en el template
  Math = Math;
}
