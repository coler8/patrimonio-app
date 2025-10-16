import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CategoriaPatrimonio {
  categoria: string;
  objetivo: number;
  actual: number;
  color: string;
}

interface ConceptoNomina {
  concepto: string;
  porcentaje: number;
  color: string;
}

interface RegistroMensual {
  mes: string;
  anio: number;
  nomina: number;
  distribucion: ConceptoNomina[];
  patrimonioTotal: number;
  categorias: CategoriaPatrimonio[];
}

@Component({
  selector: 'app-wealth-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wealth-manager.component.html',
  styleUrls: ['./wealth-manager.component.css'],
})
export class WealthManagerComponent {
  patrimonioTotal = 50000;
  nomina = 3000;
  mesActual = '';
  anoActual = 2024;

  objetivosPatrimonio: CategoriaPatrimonio[] = [
    { categoria: 'Inversiones', objetivo: 40, actual: 35, color: '#3b82f6' },
    { categoria: 'Criptomonedas', objetivo: 15, actual: 10, color: '#f59e0b' },
    { categoria: 'Propiedades', objetivo: 30, actual: 40, color: '#10b981' },
    { categoria: 'Efectivo/Ahorro', objetivo: 10, actual: 10, color: '#8b5cf6' },
    { categoria: 'Otros Activos', objetivo: 5, actual: 5, color: '#ec4899' },
  ];

  reparticionNomina: ConceptoNomina[] = [
    { concepto: 'Ahorro/Inversión', porcentaje: 20, color: '#3b82f6' },
    { concepto: 'Vivienda', porcentaje: 30, color: '#10b981' },
    { concepto: 'Alimentación', porcentaje: 15, color: '#f59e0b' },
    { concepto: 'Transporte', porcentaje: 10, color: '#8b5cf6' },
    { concepto: 'Ocio', porcentaje: 10, color: '#ec4899' },
    { concepto: 'Servicios', porcentaje: 10, color: '#06b6d4' },
    { concepto: 'Otros', porcentaje: 5, color: '#6366f1' },
  ];

  registrosMensuales: RegistroMensual[] = [];
  mesSeleccionado: string | null = null;

  meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  constructor() {
    this.inicializarMesActual();
    this.cargarDatosGuardados();
  }

  inicializarMesActual() {
    const fecha = new Date();
    this.mesActual = this.meses[fecha.getMonth()];
    this.anoActual = fecha.getFullYear();
  }

  cargarDatosGuardados() {
    // En Angular real, esto vendría de un servicio
    const datosGuardados = this.registrosMensuales;
    if (datosGuardados.length > 0) {
      this.registrosMensuales = datosGuardados;
    }
  }

  guardarMesActual() {
    const registroExistente = this.registrosMensuales.findIndex(
      (r) => r.mes === this.mesActual && r.anio === this.anoActual
    );

    const nuevoRegistro: RegistroMensual = {
      mes: this.mesActual,
      anio: this.anoActual,
      nomina: this.nomina,
      distribucion: JSON.parse(JSON.stringify(this.reparticionNomina)),
      patrimonioTotal: this.patrimonioTotal,
      categorias: JSON.parse(JSON.stringify(this.objetivosPatrimonio)),
    };

    if (registroExistente >= 0) {
      this.registrosMensuales[registroExistente] = nuevoRegistro;
    } else {
      this.registrosMensuales.push(nuevoRegistro);
    }

    // Ordenar por anio y mes
    this.registrosMensuales.sort((a, b) => {
      if (a.anio !== b.anio) return b.anio - a.anio;
      return this.meses.indexOf(b.mes) - this.meses.indexOf(a.mes);
    });

    alert(`Datos guardados para ${this.mesActual} ${this.anoActual}`);
  }

  cargarMes(registro: RegistroMensual) {
    this.mesActual = registro.mes;
    this.anoActual = registro.anio;
    this.nomina = registro.nomina;
    this.patrimonioTotal = registro.patrimonioTotal;
    this.reparticionNomina = JSON.parse(JSON.stringify(registro.distribucion));
    this.objetivosPatrimonio = JSON.parse(JSON.stringify(registro.categorias));
    this.mesSeleccionado = `${registro.mes} ${registro.anio}`;
  }

  nuevoMes() {
    this.inicializarMesActual();
    this.mesSeleccionado = null;
  }

  eliminarMes(index: number) {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      this.registrosMensuales.splice(index, 1);
    }
  }

  calcularMontoActual(porcentaje: number): string {
    return ((porcentaje / 100) * this.patrimonioTotal).toFixed(2);
  }

  calcularMontoNomina(porcentaje: number): string {
    return ((porcentaje / 100) * this.nomina).toFixed(2);
  }

  calcularCumplimiento(objetivo: number, actual: number): string {
    if (objetivo === 0) return '0';
    return ((actual / objetivo) * 100).toFixed(1);
  }

  get totalObjetivo(): number {
    return this.objetivosPatrimonio.reduce((acc, item) => acc + item.objetivo, 0);
  }

  get totalActual(): number {
    return this.objetivosPatrimonio.reduce((acc, item) => acc + item.actual, 0);
  }

  get totalNomina(): number {
    return this.reparticionNomina.reduce((acc, item) => acc + item.porcentaje, 0);
  }

  compararMeses(mes1: string, mes2: string): any {
    const reg1 = this.registrosMensuales.find((r) => `${r.mes} ${r.anio}` === mes1);
    const reg2 = this.registrosMensuales.find((r) => `${r.mes} ${r.anio}` === mes2);

    if (!reg1 || !reg2) return null;

    return {
      diferenciaNomina: reg2.nomina - reg1.nomina,
      diferenciaPatrimonio: reg2.patrimonioTotal - reg1.patrimonioTotal,
      porcentajeCambio: (
        ((reg2.patrimonioTotal - reg1.patrimonioTotal) / reg1.patrimonioTotal) *
        100
      ).toFixed(2),
    };
  }
}
