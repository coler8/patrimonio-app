import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Category {
  id: number;
  name: string;
  type: 'gasto' | 'ingreso' | 'inversion';
  subcategories: string[];
}

interface Transaction {
  id: number;
  month: string;
  year: number;
  category: string;
  subcategory: string;
  amount: number;
  type: 'gasto' | 'ingreso' | 'inversion';
}

@Component({
  selector: 'app-finance-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-tracker.component.html',
  styleUrls: ['./finance-tracker.component.css'],
})
export class FinanceTrackerComponent {
  categories = signal<Category[]>([
    { id: 1, name: 'Ropa', type: 'gasto', subcategories: ['Shein', 'Zara', 'H&M'] },
    { id: 2, name: 'Alimentación', type: 'gasto', subcategories: ['Supermercado', 'Restaurantes'] },
    { id: 3, name: 'Transporte', type: 'gasto', subcategories: ['Gasolina', 'Transporte público'] },
    { id: 4, name: 'Salario', type: 'ingreso', subcategories: ['Nómina', 'Bonus'] },
    {
      id: 5,
      name: 'Inversiones',
      type: 'inversion',
      subcategories: ['Acciones', 'Fondos', 'Crypto'],
    },
  ]);

  transactions = signal<Transaction[]>([
    {
      id: 1,
      month: 'Enero',
      year: 2025,
      category: 'Ropa',
      subcategory: 'Shein',
      amount: -150,
      type: 'gasto',
    },
    {
      id: 2,
      month: 'Enero',
      year: 2025,
      category: 'Salario',
      subcategory: 'Nómina',
      amount: 2500,
      type: 'ingreso',
    },
    {
      id: 3,
      month: 'Febrero',
      year: 2025,
      category: 'Inversiones',
      subcategory: 'Acciones',
      amount: -500,
      type: 'inversion',
    },
  ]);

  showAddTransaction = signal(false);
  showEditCategories = signal(false);
  selectedMonth = 'Todos';
  editingCategory = signal<number | null>(null);
  newCategoryName = '';

  newTransaction = {
    month: 'Enero',
    year: 2025,
    type: 'gasto' as 'gasto' | 'ingreso' | 'inversion',
    category: '',
    subcategory: '',
    amount: 0,
  };

  months = [
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

  filteredCategories = computed(() => {
    return this.categories().filter((cat) => cat.type === this.newTransaction.type);
  });

  selectedCategorySubcategories = computed(() => {
    const cat = this.categories().find((c) => c.name === this.newTransaction.category);
    return cat?.subcategories || [];
  });

  totalIngresos = computed(() => {
    return this.transactions()
      .filter((t) => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0)
      .toFixed(2);
  });

  totalGastos = computed(() => {
    return this.transactions()
      .filter((t) => t.type === 'gasto')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      .toFixed(2);
  });

  totalInversiones = computed(() => {
    return this.transactions()
      .filter((t) => t.type === 'inversion')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      .toFixed(2);
  });

  totalBalance = computed(() => {
    return this.transactions()
      .reduce((sum, t) => sum + t.amount, 0)
      .toFixed(2);
  });

  monthlyTotals = computed(() => {
    const totals: any = {};
    this.months.forEach((month) => {
      const monthTransactions = this.transactions().filter((t) => t.month === month);
      totals[month] = {
        ingresos: monthTransactions
          .filter((t) => t.type === 'ingreso')
          .reduce((sum, t) => sum + t.amount, 0)
          .toFixed(2),
        gastos: monthTransactions
          .filter((t) => t.type === 'gasto')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
          .toFixed(2),
        inversiones: monthTransactions
          .filter((t) => t.type === 'inversion')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
          .toFixed(2),
        balance: monthTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2),
      };
    });
    return totals;
  });

  displayedTransactions = computed(() => {
    if (this.selectedMonth === 'Todos') return this.transactions();
    return this.transactions().filter((t) => t.month === this.selectedMonth);
  });

  onTypeChange() {
    this.newTransaction.category = '';
    this.newTransaction.subcategory = '';
  }

  onCategoryChange() {
    this.newTransaction.subcategory = '';
  }

  addTransaction() {
    if (
      !this.newTransaction.category ||
      !this.newTransaction.subcategory ||
      !this.newTransaction.amount
    )
      return;

    const amount = this.newTransaction.amount;
    const transaction: Transaction = {
      id: Date.now(),
      month: this.newTransaction.month,
      year: this.newTransaction.year,
      category: this.newTransaction.category,
      subcategory: this.newTransaction.subcategory,
      amount: this.newTransaction.type === 'ingreso' ? amount : -Math.abs(amount),
      type: this.newTransaction.type,
    };

    this.transactions.set([...this.transactions(), transaction]);
    this.newTransaction = {
      month: 'Enero',
      year: 2025,
      type: 'gasto',
      category: '',
      subcategory: '',
      amount: 0,
    };
    this.showAddTransaction.set(false);
  }

  deleteTransaction(id: number) {
    this.transactions.set(this.transactions().filter((t) => t.id !== id));
  }

  addCategory() {
    const name = prompt('Nombre de la nueva categoría:');
    const type = prompt('Tipo (gasto/ingreso/inversion):');
    if (name && type && ['gasto', 'ingreso', 'inversion'].includes(type)) {
      this.categories.set([
        ...this.categories(),
        {
          id: Date.now(),
          name,
          type: type as any,
          subcategories: [],
        },
      ]);
    }
  }

  deleteCategory(id: number) {
    if (confirm('¿Eliminar esta categoría?')) {
      this.categories.set(this.categories().filter((c) => c.id !== id));
    }
  }

  startEditCategory(cat: Category) {
    this.editingCategory.set(cat.id);
    this.newCategoryName = cat.name;
  }

  saveCategory(id: number) {
    this.categories.set(
      this.categories().map((c) => (c.id === id ? { ...c, name: this.newCategoryName } : c))
    );
    this.editingCategory.set(null);
    this.newCategoryName = '';
  }

  addSubcategory(categoryId: number) {
    const subcatName = prompt('Nombre de la subcategoría:');
    if (subcatName) {
      this.categories.set(
        this.categories().map((c) =>
          c.id === categoryId ? { ...c, subcategories: [...c.subcategories, subcatName] } : c
        )
      );
    }
  }

  getYearlyReportByType(type: string) {
    const report: { [key: string]: number } = {};
    this.transactions()
      .filter((t) => t.type === type)
      .forEach((t) => {
        const category = `${t.category} - ${t.subcategory}`;
        if (!report[category]) report[category] = 0;
        report[category] += Math.abs(t.amount);
      });

    return Object.entries(report).map(([category, amount]) => ({
      category,
      amount: amount.toFixed(2),
    }));
  }
}
