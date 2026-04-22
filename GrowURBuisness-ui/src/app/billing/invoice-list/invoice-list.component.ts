import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { DatabaseService } from '../../services/database.service';

@Component({
  selector: 'app-invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss']
})
export class InvoiceListComponent implements OnInit {
  invoices: any[] = [];
  filteredInvoices: any[] = [];
  customers: any[] = [];
  dataSource: MatTableDataSource<any>;
  displayedColumns = ['id', 'createdDate', 'customerName', 'itemCount', 'totalAmount', 'paymentType', 'status', 'actions'];
  isLoading = false;
  filterForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private databaseService: DatabaseService
  ) {
    this.dataSource = new MatTableDataSource<any>();
    this.filterForm = this.fb.group({
      invoiceId: [''],
      customerId: [''],
      fromDate: [''],
      toDate: [''],
      minAmount: [''],
      maxAmount: [''],
      paymentType: ['']
    });
  }

  ngOnInit(): void {
    this.loadSalesInvoices();
    this.loadCustomers();
  }

  loadSalesInvoices(): void {
    this.isLoading = true;
    console.log('Starting to load sales invoices...'); // Debug log
    this.databaseService.getSales().subscribe(sales => {
      console.log('Sales data loaded:', sales); // Debug log
      console.log('Sales array length:', sales.length); // Debug log
      console.log('Raw sales data:', JSON.stringify(sales, null, 2)); // Debug log
      
      // If no sales exist, create sample data for testing
      if (sales.length === 0) {
        console.log('No sales found, creating sample data for testing');
        this.createSampleSales();
        // Reload after creating sample data
        setTimeout(() => {
          this.databaseService.getSales().subscribe(reloadedSales => {
            this.processSalesData(reloadedSales);
          });
        }, 100);
      } else {
        this.processSalesData(sales);
      }
    }, error => {
      console.error('Error loading sales:', error); // Debug log
      this.isLoading = false;
    });
  }

  processSalesData(sales: any[]): void {
    this.invoices = sales.map(sale => ({
      ...sale,
      createdDate: sale.createdDate,
      customerName: sale.customerName || 'Walk-in Customer'
    }));
    this.filteredInvoices = [...this.invoices];
    this.dataSource.data = this.filteredInvoices;
    console.log('Processed invoices:', this.invoices); // Debug log
    console.log('Filtered invoices:', this.filteredInvoices); // Debug log
    console.log('DataSource data:', this.dataSource.data); // Debug log
    this.isLoading = false;
  }

  createSampleSales(): void {
    const sampleSale = {
      customerId: null,
      customerName: 'Sample Customer',
      paymentType: 'Cash',
      items: [
        {
          itemId: 1,
          quantity: 2,
          price: 150
        }
      ],
      createdDate: new Date().toISOString(),
      status: 'Completed'
    };
    this.databaseService.addSale(sampleSale);
  }

  loadCustomers(): void {
    this.databaseService.getCustomers().subscribe(customers => {
      this.customers = customers;
    });
  }

  // Method to create sample data for testing (can be called from browser console)
  createTestData(): void {
    const sampleSale = {
      customerId: null,
      customerName: 'Test Customer',
      paymentType: 'Cash',
      items: [
        {
          itemId: 1,
          quantity: 2,
          price: 150
        }
      ],
      createdDate: new Date().toISOString(),
      status: 'Completed'
    };
    this.databaseService.addSale(sampleSale);
    this.loadSalesInvoices(); // Reload to show the new data
  }

  calculateInvoiceTotal(invoice: any): number {
    if (!invoice.items) return 0;
    return invoice.items.reduce((total: number, item: any) => total + (item.quantity * item.price), 0);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredInvoices = this.invoices.filter(invoice => {
      // Invoice ID filter
      if (filters.invoiceId && !invoice.id.toString().includes(filters.invoiceId)) {
        return false;
      }
      
      // Customer filter
      if (filters.customerId && invoice.customerId !== parseInt(filters.customerId)) {
        return false;
      }
      
      // Date range filter
      if (filters.fromDate && new Date(invoice.createdDate) < new Date(filters.fromDate)) {
        return false;
      }
      if (filters.toDate && new Date(invoice.createdDate) > new Date(filters.toDate)) {
        return false;
      }
      
      // Amount range filter
      const invoiceTotal = this.calculateInvoiceTotal(invoice);
      if (filters.minAmount && invoiceTotal < parseFloat(filters.minAmount)) {
        return false;
      }
      if (filters.maxAmount && invoiceTotal > parseFloat(filters.maxAmount)) {
        return false;
      }
      
      // Payment type filter
      if (filters.paymentType && invoice.paymentType !== filters.paymentType) {
        return false;
      }
      
      return true;
    });
    
    this.dataSource.data = this.filteredInvoices;
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredInvoices = [...this.invoices];
    this.dataSource.data = this.filteredInvoices;
  }

  viewInvoice(invoice: any): void {
    this.snackBar.open(`Viewing invoice: ${invoice.id}`, 'Details', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
    console.log('View invoice:', invoice);
  }

  printInvoice(invoice: any): void {
    this.snackBar.open(`Printing invoice: ${invoice.id}`, 'Print', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
    console.log('Print invoice:', invoice);
  }

  deleteInvoice(invoice: any): void {
    if (confirm(`Are you sure you want to delete invoice #${invoice.id}?`)) {
      this.databaseService.deleteSale(invoice.id);
      this.loadSalesInvoices();
      this.snackBar.open('Invoice deleted successfully', 'Success', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  }
}
