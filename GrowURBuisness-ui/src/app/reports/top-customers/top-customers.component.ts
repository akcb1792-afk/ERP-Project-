import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';

export interface TopCustomerData {
  CustomerName: string;
  TotalOrders: number;
  TotalSales: number;
  AvgOrderValue: number;
}

export interface TopCustomersSummary {
  TotalCustomers: number;
  TotalOrders: number;
  TotalSales: number;
  AvgOrderValue: number;
  DateRange: {
    From: string;
    To: string;
  };
}

@Component({
  selector: 'app-top-customers',
  templateUrl: './top-customers.component.html',
  styleUrls: ['./top-customers.component.scss']
})
export class TopCustomersComponent implements OnInit {
  title = 'Top Customers Report';
  
  // Data
  topCustomersData: TopCustomerData[] = [];
  summary: TopCustomersSummary | null = null;
  dataSource: MatTableDataSource<TopCustomerData>;
  
  // UI State
  isLoading = false;
  hasError = false;
  errorMessage: string = '';
  
  // Form
  filterForm: FormGroup;
  
  // Table
  displayedColumns = ['CustomerName', 'TotalOrders', 'TotalSales', 'AvgOrderValue'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<TopCustomerData>();
    
    // Set default date range (current month)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm = this.fb.group({
      fromDate: [firstDayOfMonth.toISOString().split('T')[0]],
      toDate: [today.toISOString().split('T')[0]]
    });
  }

  ngOnInit(): void {
    this.loadTopCustomersData();
  }

  validateDates(): void {
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      if (from > to) {
        this.hasError = true;
        this.errorMessage = 'From Date cannot be greater than To Date';
        return;
      }
    }
    
    this.hasError = false;
    this.errorMessage = '';
  }

  onSearch(): void {
    this.validateDates();
    if (!this.hasError) {
      this.loadTopCustomersData();
    }
  }

  onReset(): void {
    // Reset to default date range
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm.patchValue({
      fromDate: firstDayOfMonth.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0]
    });
    
    this.hasError = false;
    this.errorMessage = '';
    this.loadTopCustomersData();
  }

  loadTopCustomersData(): void {
    if (this.hasError) return;
    
    this.isLoading = true;
    
    const params = new URLSearchParams();
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    
    // Handle timezone by creating date in local timezone and formatting as YYYY-MM-DD
    if (fromDate) {
      const date = new Date(fromDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedFromDate = `${year}-${month}-${day}`;
      params.append('fromDate', formattedFromDate);
      console.log('From Date:', fromDate, 'Formatted:', formattedFromDate);
    }
    if (toDate) {
      const date = new Date(toDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedToDate = `${year}-${month}-${day}`;
      params.append('toDate', formattedToDate);
      console.log('To Date:', toDate, 'Formatted:', formattedToDate);
    }
    
    const url = `${environment.apiUrl}/reports/top-customers?${params.toString()}`;
    console.log('API URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        
        // Map API response to frontend interface (handle lowercase property names)
        this.topCustomersData = (response.data || []).map((item: any) => ({
          CustomerName: item.customerName,
          TotalOrders: item.totalOrders,
          TotalSales: item.totalSales,
          AvgOrderValue: item.avgOrderValue
        }));
        
        // Map summary response
        this.summary = response.summary ? {
          TotalCustomers: response.summary.totalCustomers || response.summary.TotalCustomers,
          TotalOrders: response.summary.totalOrders || response.summary.TotalOrders,
          TotalSales: response.summary.totalSales || response.summary.TotalSales,
          AvgOrderValue: response.summary.avgOrderValue || response.summary.AvgOrderValue,
          DateRange: response.summary.dateRange || response.summary.DateRange
        } : null;
        
        this.dataSource.data = this.topCustomersData;
        console.log('Top Customers Data:', this.topCustomersData);
        console.log('Summary:', this.summary);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading top customers data:', error);
        this.snackBar.open('Error loading top customers data. Please try again.', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  isTopCustomer(index: number): boolean {
    return index < 3; // Top 3 customers
  }

  getRankIcon(index: number): string {
    switch (index) {
      case 0: return '🥇'; // Gold medal
      case 1: return '🥈'; // Silver medal
      case 2: return '🥉'; // Bronze medal
      default: return '';
    }
  }

  exportToExcel(): void {
    if (!this.topCustomersData || this.topCustomersData.length === 0) {
      this.snackBar.open('No data to export', 'Close', { duration: 3000 });
      return;
    }

    // Create CSV content
    const headers = ['Customer Name', 'Total Orders', 'Total Sales', 'Avg Order Value'];
    const csvRows = [
      headers.join(','),
      ...this.topCustomersData.map((row, index) => [
        `"${row.CustomerName}"`,
        row.TotalOrders,
        row.TotalSales,
        row.AvgOrderValue
      ].join(','))
    ];

    // Add summary at the end
    if (this.summary) {
      csvRows.push('\n\nSummary');
      csvRows.push(`Total Customers,${this.summary.TotalCustomers}`);
      csvRows.push(`Total Orders,${this.summary.TotalOrders}`);
      csvRows.push(`Total Sales,${this.summary.TotalSales}`);
      csvRows.push(`Avg Order Value,${this.summary.AvgOrderValue}`);
    }

    const csvContent = csvRows.join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Top_Customers.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Top Customers exported successfully', 'Close', { duration: 3000 });
  }

  backToReports(): void {
    // Navigate back to reports page
    window.history.back();
  }
}
