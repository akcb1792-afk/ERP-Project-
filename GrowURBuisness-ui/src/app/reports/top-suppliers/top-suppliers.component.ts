import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';

export interface TopSupplierData {
  SupplierName: string;
  TotalOrders: number;
  TotalPurchase: number;
  AvgOrderValue: number;
}

export interface TopSuppliersSummary {
  TotalSuppliers: number;
  TotalOrders: number;
  TotalPurchase: number;
  AvgOrderValue: number;
  DateRange: {
    From: string;
    To: string;
  };
}

@Component({
  selector: 'app-top-suppliers',
  templateUrl: './top-suppliers.component.html',
  styleUrls: ['./top-suppliers.component.scss']
})
export class TopSuppliersComponent implements OnInit {
  title = 'Top Suppliers Report';
  
  // Data
  topSuppliersData: TopSupplierData[] = [];
  summary: TopSuppliersSummary | null = null;
  dataSource: MatTableDataSource<TopSupplierData>;
  
  // UI State
  isLoading = false;
  hasError = false;
  errorMessage: string = '';
  
  // Form
  filterForm: FormGroup;
  
  // Table
  displayedColumns = ['SupplierName', 'TotalOrders', 'TotalPurchase', 'AvgOrderValue'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<TopSupplierData>();
    
    // Set default date range (current month)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm = this.fb.group({
      fromDate: [firstDayOfMonth.toISOString().split('T')[0]],
      toDate: [today.toISOString().split('T')[0]]
    });
  }

  ngOnInit(): void {
    this.loadTopSuppliersData();
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
      this.loadTopSuppliersData();
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
    this.loadTopSuppliersData();
  }

  loadTopSuppliersData(): void {
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
    
    const url = `${environment.apiUrl}/reports/top-suppliers?${params.toString()}`;
    console.log('API URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        
        // Map API response to frontend interface (handle lowercase property names)
        this.topSuppliersData = (response.data || []).map((item: any) => ({
          SupplierName: item.supplierName,
          TotalOrders: item.totalOrders,
          TotalPurchase: item.totalPurchase,
          AvgOrderValue: item.avgOrderValue
        }));
        
        // Map summary response
        this.summary = response.summary ? {
          TotalSuppliers: response.summary.totalSuppliers || response.summary.TotalSuppliers,
          TotalOrders: response.summary.totalOrders || response.summary.TotalOrders,
          TotalPurchase: response.summary.totalPurchase || response.summary.TotalPurchase,
          AvgOrderValue: response.summary.avgOrderValue || response.summary.AvgOrderValue,
          DateRange: response.summary.dateRange || response.summary.DateRange
        } : null;
        
        this.dataSource.data = this.topSuppliersData;
        console.log('Top Suppliers Data:', this.topSuppliersData);
        console.log('Summary:', this.summary);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading top suppliers data:', error);
        this.snackBar.open('Error loading top suppliers data. Please try again.', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  isTopSupplier(index: number): boolean {
    return index < 3; // Top 3 suppliers
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
    if (!this.topSuppliersData || this.topSuppliersData.length === 0) {
      this.snackBar.open('No data to export', 'Close', { duration: 3000 });
      return;
    }

    // Create CSV content
    const headers = ['Supplier Name', 'Total Orders', 'Total Purchase', 'Avg Order Value'];
    const csvRows = [
      headers.join(','),
      ...this.topSuppliersData.map((row, index) => [
        `"${row.SupplierName}"`,
        row.TotalOrders,
        row.TotalPurchase,
        row.AvgOrderValue
      ].join(','))
    ];

    // Add summary at the end
    if (this.summary) {
      csvRows.push('\n\nSummary');
      csvRows.push(`Total Suppliers,${this.summary.TotalSuppliers}`);
      csvRows.push(`Total Orders,${this.summary.TotalOrders}`);
      csvRows.push(`Total Purchase,${this.summary.TotalPurchase}`);
      csvRows.push(`Avg Order Value,${this.summary.AvgOrderValue}`);
    }

    const csvContent = csvRows.join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Top_Suppliers.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Top Suppliers exported successfully', 'Close', { duration: 3000 });
  }

  backToReports(): void {
    // Navigate back to reports page
    window.history.back();
  }
}
