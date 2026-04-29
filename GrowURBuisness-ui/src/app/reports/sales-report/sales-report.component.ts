import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface SalesReportItem {
  salesOrderNo: string;
  customerName: string;
  date: string;
  itemName: string;
  itemRate: number;
  quantity: number;
  amount: number;
  customerId: number;
  invoiceId: number;
  paymentType: string;
  status: string;
}

export interface SalesReportSummary {
  totalSales: number;
  totalOrders: number;
  totalItems: number;
  dateRange: {
    from: string;
    to: string;
  };
}

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  customerType: string;
}

@Component({
  selector: 'app-sales-report',
  templateUrl: './sales-report.component.html',
  styleUrls: ['./sales-report.component.scss']
})
export class SalesReportComponent implements OnInit {
  title = 'Sales Report';
  
  salesData: SalesReportItem[] = [];
  displayedColumns = ['SalesOrderNo', 'CustomerName', 'Date', 'ItemName', 'ItemRate', 'Quantity', 'Amount'];
  dataSource = new MatTableDataSource<SalesReportItem>();
  isLoading = false;
  
  // Summary data
  summary: SalesReportSummary = {
    totalSales: 0,
    totalOrders: 0,
    totalItems: 0,
    dateRange: { from: 'All Time', to: 'All Time' }
  };
  
  // Pagination data
  pagination: PaginationInfo = {
    currentPage: 1,
    pageSize: 100,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  };
  
  // Form for filtering
  filterForm: FormGroup;
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  
  // Error handling
  errorMessage: string = '';
  hasError: boolean = false;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    // Set default date range from 1st day of current month to today
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm = this.fb.group({
      fromDate: [firstDayOfMonth.toISOString().split('T')[0]],
      toDate: [today.toISOString().split('T')[0]],
      customerId: ['']
    });
  }

  ngOnInit() {
    this.loadCustomers();
    this.onSearch();
  }

  loadCustomers(): void {
    this.http.get<Customer[]>(`${environment.apiUrl}/Customer`).subscribe({
      next: (customers) => {
        // Filter to show only customers (customers with customerType 'Customer')
        this.customers = customers.filter(customer => customer.customerType === 'Customer');
        this.filteredCustomers = this.customers;
        console.log('Loaded customers:', this.customers);
      },
      error: (error) => {
        console.error('Error loading customers:', error);
      }
    });
  }

  onCustomerSearch(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredCustomers = this.customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm)
    );
  }

  validateDates(): void {
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    
    this.hasError = false;
    this.errorMessage = '';
    
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (from > to) {
        this.hasError = true;
        this.errorMessage = 'From Date cannot be greater than To Date';
      }
    }
  }

  onSearch(): void {
    this.validateDates();
    if (!this.hasError) {
      this.loadSalesReport();
    }
  }

  loadSalesReport(): void {
    if (this.hasError) return;
    
    this.isLoading = true;
    
    const params = new URLSearchParams();
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    const customerId = this.filterForm.get('customerId')?.value;
    
    if (fromDate) {
      // Handle timezone by creating date in local timezone and formatting as YYYY-MM-DD
      const date = new Date(fromDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedFromDate = `${year}-${month}-${day}`;
      params.append('fromDate', formattedFromDate);
      console.log('Sales From Date:', fromDate, 'Formatted:', formattedFromDate);
    }
    if (toDate) {
      // Handle timezone by creating date in local timezone and formatting as YYYY-MM-DD
      const date = new Date(toDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedToDate = `${year}-${month}-${day}`;
      params.append('toDate', formattedToDate);
      console.log('Sales To Date:', toDate, 'Formatted:', formattedToDate);
    }
    if (customerId) params.append('customerId', customerId);
    
    // Add pagination parameters
    params.append('page', this.pagination.currentPage.toString());
    params.append('pageSize', this.pagination.pageSize.toString());
    
    const url = `${environment.apiUrl}/reports/sales/detailed?${params.toString()}`;
    console.log('Sales API URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        this.salesData = response.data || [];
        this.summary = response.summary || this.summary;
        this.pagination = response.pagination || this.pagination;
        this.dataSource.data = this.salesData;
        console.log('Sales Data:', this.salesData);
        console.log('Summary:', this.summary);
        console.log('Pagination:', this.pagination);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading sales report:', error);
        this.salesData = [];
        this.dataSource.data = [];
        this.summary = {
          totalSales: 0,
          totalOrders: 0,
          totalItems: 0,
          dateRange: { from: 'All Time', to: 'All Time' }
        };
        this.isLoading = false;
      }
    });
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.hasError = false;
    this.errorMessage = '';
    this.filteredCustomers = this.customers;
    this.pagination.currentPage = 1;
    this.loadSalesReport();
  }

  onPageChange(page: number): void {
    this.pagination.currentPage = page;
    this.loadSalesReport();
  }

  onPreviousPage(): void {
    if (this.pagination.hasPreviousPage) {
      this.pagination.currentPage--;
      this.loadSalesReport();
    }
  }

  onNextPage(): void {
    if (this.pagination.hasNextPage) {
      this.pagination.currentPage++;
      this.loadSalesReport();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(1, this.pagination.currentPage - 2);
    const endPage = Math.min(this.pagination.totalPages, this.pagination.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getEndRecordCount(): number {
    return Math.min(this.pagination.currentPage * this.pagination.pageSize, this.pagination.totalCount);
  }

  goBackToReports(): void {
    this.router.navigate(['/reports']);
  }

  exportToExcel(): void {
    if (this.salesData.length === 0) {
      alert('No data available to export');
      return;
    }

    // Create CSV content
    const headers = ['Sales Order No', 'Customer Name', 'Date', 'Item Name', 'Item Rate', 'Quantity', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...this.salesData.map(item => [
        `"${item.salesOrderNo}"`,
        `"${item.customerName}"`,
        `"${new Date(item.date).toLocaleDateString()}"`,
        `"${item.itemName}"`,
        item.itemRate,
        item.quantity,
        item.amount
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Sales_Report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}
