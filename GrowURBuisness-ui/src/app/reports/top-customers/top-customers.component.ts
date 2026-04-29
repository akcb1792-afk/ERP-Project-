import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface TopCustomerEntry {
  customerId: number;
  customerName: string;
  totalOrders: number;
  totalSales: number;
  avgOrderValue: number;
}

export interface TopCustomersSummary {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  dateRange: {
    from: string;
    to: string;
  };
}

@Component({
  selector: 'app-top-customers',
  templateUrl: './top-customers.component.html',
  styleUrls: ['./top-customers.component.scss']
})
export class TopCustomersComponent implements OnInit {
  title = 'Top Customers Report';
  
  topCustomersData: TopCustomerEntry[] = [];
  displayedColumns = ['customerName', 'totalOrders', 'totalSales', 'avgOrderValue'];
  dataSource = new MatTableDataSource<TopCustomerEntry>();
  isLoading = false;
  
  // Summary data
  summary: TopCustomersSummary = {
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    dateRange: { from: 'All Time', to: 'All Time' }
  };
  
  // Form for filtering
  filterForm: FormGroup;
  
  // Error handling
  errorMessage: string = '';
  hasError: boolean = false;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    // Set default date range from 1st day of current month to today
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm = this.fb.group({
      fromDate: [firstDayOfMonth.toISOString().split('T')[0]],
      toDate: [today.toISOString().split('T')[0]]
    });
  }

  ngOnInit() {
    this.loadTopCustomers();
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
      this.loadTopCustomers();
    }
  }

  loadTopCustomers(): void {
    if (this.hasError) return;
    
    this.isLoading = true;
    
    const params = new URLSearchParams();
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    
    if (fromDate) {
      // Handle timezone by creating date in local timezone and formatting as YYYY-MM-DD
      const date = new Date(fromDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedFromDate = `${year}-${month}-${day}`;
      params.append('fromDate', formattedFromDate);
      console.log('Top Customers From Date:', fromDate, 'Formatted:', formattedFromDate);
    }
    if (toDate) {
      // Handle timezone by creating date in local timezone and formatting as YYYY-MM-DD
      const date = new Date(toDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedToDate = `${year}-${month}-${day}`;
      params.append('toDate', formattedToDate);
      console.log('Top Customers To Date:', toDate, 'Formatted:', formattedToDate);
    }
    
    const url = `${environment.apiUrl}/reports/top-customers?${params.toString()}`;
    console.log('Top Customers API URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        console.log('Response data:', response.data);
        console.log('Response summary:', response.summary);
        
        // Handle different response structures
        if (response.data && Array.isArray(response.data)) {
          this.topCustomersData = response.data;
        } else if (Array.isArray(response)) {
          this.topCustomersData = response;
        } else {
          this.topCustomersData = [];
        }
        
        // Handle summary data
        if (response.summary) {
          // Map lowercase API response to capitalized interface
          this.summary = {
            totalCustomers: response.summary.totalCustomers || 0,
            totalOrders: response.summary.totalOrders || 0,
            totalRevenue: response.summary.totalRevenue || 0,
            averageOrderValue: response.summary.averageOrderValue || 0,
            dateRange: {
              from: response.summary.dateRange?.from || 'All Time',
              to: response.summary.dateRange?.to || 'All Time'
            }
          };
        } else {
          // Calculate summary from data if not provided
          this.summary = {
            totalCustomers: this.topCustomersData.length,
            totalOrders: this.topCustomersData.reduce((sum, customer) => sum + (customer.totalOrders || 0), 0),
            totalRevenue: this.topCustomersData.reduce((sum, customer) => sum + (customer.totalSales || 0), 0),
            averageOrderValue: this.topCustomersData.length > 0 ? 
              this.topCustomersData.reduce((sum, customer) => sum + (customer.avgOrderValue || 0), 0) / this.topCustomersData.length : 0,
            dateRange: { from: 'All Time', to: 'All Time' }
          };
        }
        
        this.dataSource.data = this.topCustomersData;
        console.log('Processed Top Customers Data:', this.topCustomersData);
        console.log('Processed Summary:', this.summary);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading top customers:', error);
        this.topCustomersData = [];
        this.dataSource.data = [];
        this.summary = {
          totalCustomers: 0,
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
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
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filterForm.patchValue({
      fromDate: firstDayOfMonth.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0]
    });
    this.loadTopCustomers();
  }

  exportToExcel(): void {
    if (this.topCustomersData.length === 0) {
      alert('No data available to export');
      return;
    }

    // Create CSV content
    const headers = ['Customer Name', 'Total Orders', 'Total Sales', 'Avg Order Value'];
    const csvContent = [
      headers.join(','),
      ...this.topCustomersData.map(customer => [
        `"${customer.customerName}"`,
        customer.totalOrders,
        customer.totalSales,
        customer.avgOrderValue
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Top_Customers.csv');
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

  isTopCustomer(index: number): boolean {
    // Highlight top 3 customers
    return index < 3 && this.topCustomersData.length > 0;
  }

  goBackToReports(): void {
    this.router.navigate(['/reports']);
  }
}
