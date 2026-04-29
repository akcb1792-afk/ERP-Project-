import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReportsService, SalesReportItem } from '../../services/reports.service';

@Component({
  selector: 'app-sales-report-enhanced',
  templateUrl: './sales-report-enhanced.component.html',
  styleUrls: ['./sales-report.component.scss']
})
export class SalesReportEnhancedComponent implements OnInit {
  title = 'Sales Report';
  salesData: SalesReportItem[] = [];
  filteredSalesData: SalesReportItem[] = [];
  isLoading = false;
  error: string | null = null;
  filterForm: FormGroup;
  totalSales: number = 0;
  totalInvoices: number = 0;

  customers: any[] = [];
  topCustomers: any[] = [];

  constructor(private fb: FormBuilder, private reportsService: ReportsService) {
    this.filterForm = this.fb.group({
      fromDate: [''],
      toDate: [''],
      customerId: ['']
    });
  }

  displayedColumns: string[] = ['invoiceNumber', 'customerName', 'total', 'date'];

  ngOnInit() {
    this.loadSalesReport();
  }

  loadSalesReport(): void {
    this.isLoading = true;
    this.error = null;
    
    this.reportsService.getSalesReport(
      this.filterForm.value.fromDate,
      this.filterForm.value.toDate,
      this.filterForm.value.customerId
    ).subscribe({
      next: (data) => {
        this.salesData = data;
        this.filteredSalesData = data;
        this.calculateTotal();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load sales report';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.isLoading = true;
    this.error = null;
    
    this.reportsService.getSalesReport(
      this.filterForm.value.fromDate,
      this.filterForm.value.toDate,
      this.filterForm.value.customerId
    ).subscribe({
      next: (data) => {
        this.salesData = data;
        this.filteredSalesData = data;
        this.calculateTotal();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load sales report';
        this.isLoading = false;
      }
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      fromDate: '',
      toDate: '',
      customerId: ''
    });
    this.applyFilters();
  }

  calculateTotal(): void {
    this.totalSales = this.filteredSalesData.reduce((sum: number, item: SalesReportItem) => sum + (item.total || 0), 0);
  }

  exportToExcel(): void {
    // Export functionality to be implemented
    console.log('Export to Excel functionality not yet implemented');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
