import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { BillingService } from '../../services/billing.service';

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
    private billingService: BillingService
  ) {
    this.dataSource = new MatTableDataSource<any>();
    this.filterForm = this.fb.group({
      invoiceId: [''],
      customerId: [''],
      fromDate: [''],
      toDate: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.loadInvoices();
    this.loadCustomers();
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.billingService.getInvoices().subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.filteredInvoices = [...invoices];
        this.dataSource.data = this.filteredInvoices;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
        this.snackBar.open('Failed to load invoices', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadCustomers(): void {
    this.billingService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.snackBar.open('Failed to load customers', 'Close', { duration: 3000 });
      }
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredInvoices = this.invoices.filter(invoice => {
      if (filters.invoiceId && !invoice.id.toString().includes(filters.invoiceId)) {
        return false;
      }
      if (filters.customerId && invoice.customerId !== filters.customerId) {
        return false;
      }
      if (filters.fromDate && new Date(invoice.createdDate) < new Date(filters.fromDate)) {
        return false;
      }
      if (filters.toDate && new Date(invoice.createdDate) > new Date(filters.toDate)) {
        return false;
      }
      if (filters.status && invoice.status !== filters.status) {
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

  deleteInvoice(invoice: any): void {
    if (confirm(`Are you sure you want to delete invoice #${invoice.id}?`)) {
      this.billingService.deleteInvoice(invoice.id).subscribe({
        next: () => {
          this.snackBar.open('Invoice deleted successfully', 'Close', { duration: 3000 });
          this.loadInvoices();
        },
        error: (error) => {
          console.error('Error deleting invoice:', error);
          this.snackBar.open('Failed to delete invoice', 'Close', { duration: 3000 });
        }
      });
    }
  }

  refreshData(): void {
    this.loadInvoices();
    this.loadCustomers();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  calculateInvoiceTotal(invoice: any): number {
    return invoice.totalAmount || 0;
  }

  viewInvoice(invoice: any): void {
    // TODO: Implement invoice view functionality
    console.log('View invoice:', invoice);
    this.snackBar.open('Invoice view not implemented yet', 'Info', { duration: 3000 });
  }

  printInvoice(invoice: any): void {
    // TODO: Implement invoice print functionality
    console.log('Print invoice:', invoice);
    this.snackBar.open('Invoice print not implemented yet', 'Info', { duration: 3000 });
  }

  createTestData(): void {
    // TODO: Remove test data creation as we want clean database
    this.snackBar.open('Test data creation disabled - use UI to add real data', 'Info', { duration: 3000 });
  }
}
