import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Transaction {
  id: number;
  month: string;
  category: string;
  subcategory: string;
  detail: string;
  amount: number;
  type: 'gasto' | 'gasto_fijo' | 'ingreso' | 'inversion';
}

interface Category {
  name: string;
  type: 'gasto' | 'gasto_fijo' | 'ingreso' | 'inversion';
  subcategories: string[];
}

@Component({
  selector: 'app-finance-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-tracker.component.html',
  styleUrls: ['./finance-tracker.component.css'],
})
export class FinanceTrackerComponent {
  currentMonth = signal('OCTUBRE');

  months = [
    'ENERO',
    'FEBRERO',
    'MARZO',
    'ABRIL',
    'MAYO',
    'JUNIO',
    'JULIO',
    'AGOSTO',
    'SEPTIEMBRE',
    'OCTUBRE',
    'NOVIEMBRE',
    'DICIEMBRE',
  ];

  transactions = signal<Transaction[]>([
    {
      id: 1,
      month: 'OCTUBRE',
      category: 'Inversiones',
      subcategory: 'myinvestor',
      detail: 'msci world',
      amount: 500.0,
      type: 'inversion',
    },
    {
      id: 2,
      month: 'OCTUBRE',
      category: 'Inversiones',
      subcategory: 'myinvestor',
      detail: 'msci emerging',
      amount: 250.0,
      type: 'inversion',
    },
    {
      id: 3,
      month: 'OCTUBRE',
      category: 'Tiendas',
      subcategory: 'S - Otros',
      detail: 'gel lima',
      amount: 2.0,
      type: 'gasto',
    },
    {
      id: 4,
      month: 'OCTUBRE',
      category: 'Ocio',
      subcategory: 'Restaurantes',
      detail: 'menu leon',
      amount: 17.5,
      type: 'gasto',
    },
    {
      id: 5,
      month: 'OCTUBRE',
      category: 'Salario',
      subcategory: 'Nómina',
      detail: 'pago mensual',
      amount: 2500.0,
      type: 'ingreso',
    },
    {
      id: 6,
      month: 'OCTUBRE',
      category: 'Vivienda',
      subcategory: 'Alquiler',
      detail: 'piso',
      amount: 800.0,
      type: 'gasto_fijo',
    },
    {
      id: 7,
      month: 'OCTUBRE',
      category: 'Vivienda',
      subcategory: 'Luz',
      detail: 'factura luz',
      amount: 65.0,
      type: 'gasto_fijo',
    },
    {
      id: 8,
      month: 'NOVIEMBRE',
      category: 'Ocio',
      subcategory: 'Cine',
      detail: 'entradas',
      amount: 20.0,
      type: 'gasto',
    },
  ]);

  categories = signal<Category[]>([
    { name: 'Inversiones', type: 'inversion', subcategories: ['myinvestor', 'degiro', 'crypto'] },
    { name: 'Tiendas', type: 'gasto', subcategories: ['S - Otros', 'Alimentación', 'Ropa'] },
    { name: 'Ocio', type: 'gasto', subcategories: ['Restaurantes', 'Bares', 'Cine'] },
    {
      name: 'Transporte',
      type: 'gasto',
      subcategories: ['Combustible', 'Taxi/Bus/Tren', 'Parking'],
    },
    {
      name: 'Vivienda',
      type: 'gasto_fijo',
      subcategories: ['Alquiler', 'Luz', 'Agua', 'Gas', 'Internet'],
    },
    {
      name: 'Suscripciones',
      type: 'gasto_fijo',
      subcategories: ['Netflix', 'Spotify', 'Gimnasio'],
    },
    { name: 'Salud', type: 'gasto', subcategories: ['Farmacia', 'Médico', 'Seguro'] },
    { name: 'Salario', type: 'ingreso', subcategories: ['Nómina', 'Bonus', 'Extra'] },
    { name: 'Freelance', type: 'ingreso', subcategories: ['Proyectos', 'Consultoría'] },
  ]);

  newRowType = signal<'gasto' | 'gasto_fijo' | 'ingreso' | 'inversion'>('gasto');
  newRowCategory = signal('');
  newRowSubcategory = signal('');
  newRowDetail = signal('');
  newRowAmount = signal(0);

  constructor() {
    this.loadData();
  }

  filteredTransactions = computed(() => {
    return this.transactions().filter((t) => t.month === this.currentMonth());
  });

  filteredCategories = computed(() => {
    return this.categories().filter((cat) => cat.type === this.newRowType());
  });

  selectedSubcategories = computed(() => {
    const categoryName = this.newRowCategory();
    if (!categoryName) return [];
    const cat = this.categories().find((c) => c.name === categoryName);
    return cat?.subcategories || [];
  });

  // Gastos fijos: solo transacciones tipo 'gasto_fijo'
  currentMonthGastosFijos = computed(() => {
    return this.filteredTransactions()
      .filter((t) => t.type === 'gasto_fijo')
      .reduce((sum, t) => sum + t.amount, 0)
      .toFixed(2);
  });

  // Gastos variables: solo transacciones tipo 'gasto'
  currentMonthGastosVariables = computed(() => {
    return this.filteredTransactions()
      .filter((t) => t.type === 'gasto')
      .reduce((sum, t) => sum + t.amount, 0)
      .toFixed(2);
  });

  // Gastos totales: suma de gastos + gastos_fijos
  currentMonthGastosTotal = computed(() => {
    return (
      parseFloat(this.currentMonthGastosVariables()) + parseFloat(this.currentMonthGastosFijos())
    ).toFixed(2);
  });

  currentMonthIngresos = computed(() => {
    return this.filteredTransactions()
      .filter((t) => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0)
      .toFixed(2);
  });

  currentMonthInversion = computed(() => {
    return this.filteredTransactions()
      .filter((t) => t.type === 'inversion')
      .reduce((sum, t) => sum + t.amount, 0)
      .toFixed(2);
  });

  totalBalance = computed(() => {
    const ingresos = parseFloat(this.currentMonthIngresos());
    const gastosTotal = parseFloat(this.currentMonthGastosTotal());
    const inversiones = parseFloat(this.currentMonthInversion());

    return (ingresos - gastosTotal - inversiones).toFixed(2);
  });

  gastoMaximo = computed(() => {
    const gastos = this.filteredTransactions().filter(
      (t) => t.type === 'gasto' || t.type === 'gasto_fijo'
    );
    if (gastos.length === 0) return '0.00';
    return Math.max(...gastos.map((t) => t.amount)).toFixed(2);
  });

  gastoMinimo = computed(() => {
    const gastos = this.filteredTransactions().filter(
      (t) => t.type === 'gasto' || t.type === 'gasto_fijo'
    );
    if (gastos.length === 0) return '0.00';
    return Math.min(...gastos.map((t) => t.amount)).toFixed(2);
  });

  categoryReportByType(type: 'gasto' | 'gasto_fijo' | 'ingreso' | 'inversion') {
    const report: { [key: string]: number } = {};

    this.filteredTransactions()
      .filter((t) => t.type === type)
      .forEach((t) => {
        const key = `${t.category} - ${t.subcategory}`;
        if (!report[key]) {
          report[key] = 0;
        }
        report[key] += t.amount;
      });

    return Object.entries(report)
      .map(([category, amount]) => ({
        category,
        amount: amount.toFixed(2),
      }))
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
  }

  onTypeChange() {
    this.newRowCategory.set('');
    this.newRowSubcategory.set('');
  }

  onCategoryChange() {
    this.newRowSubcategory.set('');
  }

  canAddTransaction(): boolean {
    return !!(this.newRowCategory() && this.newRowSubcategory() && this.newRowAmount() > 0);
  }

  addTransaction() {
    if (!this.canAddTransaction()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now(),
      month: this.currentMonth(),
      category: this.newRowCategory(),
      subcategory: this.newRowSubcategory(),
      detail: this.newRowDetail() || '',
      amount: parseFloat(this.newRowAmount().toString()),
      type: this.newRowType(),
    };

    this.transactions.set([...this.transactions(), newTransaction]);

    // Reset form
    this.newRowType.set('gasto');
    this.newRowCategory.set('');
    this.newRowSubcategory.set('');
    this.newRowDetail.set('');
    this.newRowAmount.set(0);

    this.saveData();
  }

  deleteTransaction(id: number) {
    if (confirm('¿Seguro que quieres eliminar esta transacción?')) {
      this.transactions.set(this.transactions().filter((t) => t.id !== id));
      this.saveData();
    }
  }

  changeMonth(month: string) {
    this.currentMonth.set(month);
    this.saveData();
  }

  saveData() {
    try {
      localStorage.setItem('financeTransactions', JSON.stringify(this.transactions()));
      localStorage.setItem('financeCurrentMonth', this.currentMonth());
    } catch (e) {
      console.error('Error guardando datos:', e);
    }
  }

  loadData() {
    try {
      const savedTransactions = localStorage.getItem('financeTransactions');
      const savedCurrentMonth = localStorage.getItem('financeCurrentMonth');

      if (savedTransactions) {
        this.transactions.set(JSON.parse(savedTransactions));
      }
      if (savedCurrentMonth) {
        this.currentMonth.set(savedCurrentMonth);
      }
    } catch (e) {
      console.error('Error cargando datos:', e);
    }
  }
}
