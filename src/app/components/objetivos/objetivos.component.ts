import { Component, computed, inject, OnInit } from '@angular/core';
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
export class ObjetivosComponent implements OnInit {
  private patrimonioService = inject(PatrimonioService);

  // referencias a las señales del servicio
  objetivos = this.patrimonioService.objetivos; // Signal<ObjetivosPatrimonio>
  porcentajes = this.patrimonioService.porcentajes; // Signal<DistribucionPatrimonio>

  // copia local para bind con ngModel (edición)
  objetivosLocal!: ObjetivosPatrimonio;

  categorias: { key: ObjetivosKeys; nombre: string }[] = [
    { key: 'liquidez', nombre: 'Liquidez' },
    { key: 'cuentasRemuneradas', nombre: 'Cuentas Remuneradas' },
    { key: 'cryptos', nombre: 'Criptomonedas' },
    { key: 'fondosIndexados', nombre: 'Fondos Indexados' },
  ];

  // total de objetivos (suma porcentajes objetivo)
  totalObjetivos = computed(() => {
    const obj = this.objetivos();
    // suma defensiva (por si algún campo es undefined)
    return (
      (obj?.liquidez ?? 0) +
      (obj?.cuentasRemuneradas ?? 0) +
      (obj?.cryptos ?? 0) +
      (obj?.fondosIndexados ?? 0)
    );
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

  // Exponer Math al template si lo necesitas
  Math = Math;

  ngOnInit(): void {
    // inicializar la copia local a partir del servicio (defensivamente)
    const obj = this.objetivos();
    this.objetivosLocal = {
      liquidez: obj?.liquidez ?? 0,
      cuentasRemuneradas: obj?.cuentasRemuneradas ?? 0,
      cryptos: obj?.cryptos ?? 0,
      fondosIndexados: obj?.fondosIndexados ?? 0,
    };
  }

  onObjetivosChange() {
    // asegurar límites 0-100 y no dejar NaN
    const clean: ObjetivosPatrimonio = {
      liquidez: Number(this.objetivosLocal.liquidez) || 0,
      cuentasRemuneradas: Number(this.objetivosLocal.cuentasRemuneradas) || 0,
      cryptos: Number(this.objetivosLocal.cryptos) || 0,
      fondosIndexados: Number(this.objetivosLocal.fondosIndexados) || 0,
    };
    // opcional: forzar entre 0 y 100
    Object.keys(clean).forEach((k) => {
      // @ts-ignore
      if (clean[k] < 0) clean[k] = 0;
      // @ts-ignore
      if (clean[k] > 100) clean[k] = 100;
    });

    this.patrimonioService.actualizarObjetivos(clean);
    this.patrimonioService.guardarEnLocalStorage();
  }

  getDiferencia(categoria: ObjetivosKeys): number {
    const porcVal = this.porcentajes()[categoria];
    let porc: number;

    if (categoria === 'cryptos' && typeof porcVal === 'object') {
      // suma todos los valores del objeto
      porc = Object.values(porcVal).reduce((sum, v) => sum + v, 0);
    } else {
      porc = (porcVal as number) ?? 0;
    }

    const obj = this.objetivos()[categoria] ?? 0;
    return porc - obj;
  }

  getDiferenciaColor(categoria: ObjetivosKeys): string {
    const diff = Math.abs(this.getDiferencia(categoria));
    if (diff <= 2) return 'text-green-600';
    if (diff <= 5) return 'text-orange-600';
    return 'text-red-600';
  }

  getEstadoColor(categoria: ObjetivosKeys): string {
    const diff = this.getDiferencia(categoria);
    if (Math.abs(diff) <= 2) return 'bg-green-400';
    if (diff > 2) return 'bg-orange-400';
    return 'bg-red-400';
  }

  getEstadoTexto(categoria: ObjetivosKeys): string {
    const diff = this.getDiferencia(categoria);
    if (Math.abs(diff) <= 2) return 'En objetivo (±2%)';
    if (diff > 2) return `Sobrepasado (+${diff.toFixed(1)}%)`;
    return `Por debajo (${diff.toFixed(1)}%)`;
  }

  getRecomendacionesPersonalizadas(): string[] {
    const recomendaciones: string[] = [];

    const diffLiquidez = this.getDiferencia('liquidez');
    if (diffLiquidez < -5) {
      recomendaciones.push(
        'Considera aumentar tu liquidez para tener un colchón de emergencia más sólido'
      );
    } else if (diffLiquidez > 10) {
      recomendaciones.push(
        'Tienes demasiado dinero en liquidez; considera invertir parte en activos más rentables'
      );
    }

    const diffCryptos = this.getDiferencia('cryptos');
    if (diffCryptos > 5) {
      recomendaciones.push(
        'El porcentaje en criptomonedas es alto; considera reducirlo para menor volatilidad'
      );
    }

    const diffFondos = this.getDiferencia('fondosIndexados');
    if (diffFondos < -5) {
      recomendaciones.push(
        'Los fondos indexados ofrecen diversificación a bajo costo; considera aumentar su peso'
      );
    }

    if (recomendaciones.length === 0) {
      recomendaciones.push('Tu distribución está bien balanceada según los objetivos establecidos');
    }

    return recomendaciones;
  }
}
