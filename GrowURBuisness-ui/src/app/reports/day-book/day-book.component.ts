import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface DayBookEntry {
  date: string;
  type: string;
  refNo: string;
  party: string;
  amount: number;
}

export interface DayBookSummary {
  totalSales: number;
  totalPurchase: number;
  netDifference: number;
  totalTransactions: number;
  dateRange: {
    from: string;
    to: string;
  };
}

@Component({
  selector: 'app-day-book',
  templateUrl: './day-book.component.html',
  styleUrls: ['./day-book.component.scss']
})
export class DayBookComponent implements OnInit {
  title = 'Day Book';
  
  dayBookData: DayBookEntry[] = [];
  displayedColumns = ['date', 'type', 'refNo', 'party', 'amount'];
  dataSource = new MatTableDataSource<DayBookEntry>();
  isLoading = false;
  
  // Summary data
  summary: DayBookSummary = {
    totalSales: 0,
    totalPurchase: 0,
    netDifference: 0,
    totalTransactions: 0,
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
    this.loadDayBook();
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
      this.loadDayBook();
    }
  }

  loadDayBook(): void {
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
      console.log('Day Book From Date:', fromDate, 'Formatted:', formattedFromDate);
    }
    if (toDate) {
      // Handle timezone by creating date in local timezone and formatting as YYYY-MM-DD
      const date = new Date(toDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedToDate = `${year}-${month}-${day}`;
      params.append('toDate', formattedToDate);
      console.log('Day Book To Date:', toDate, 'Formatted:', formattedToDate);
    }
    
    const url = `${environment.apiUrl}/reports/day-book?${params.toString()}`;
    console.log('Day Book API URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        console.log('Response data:', response.data);
        console.log('Response summary:', response.summary);
        
        // Handle different response structures
        if (response.data && Array.isArray(response.data)) {
          this.dayBookData = response.data;
        } else if (Array.isArray(response)) {
          this.dayBookData = response;
        } else {
          this.dayBookData = [];
        }
        
        // Handle summary data
        if (response.summary) {
          // Map lowercase API response to capitalized interface
          this.summary = {
            totalSales: response.summary.totalSales || 0,
            totalPurchase: response.summary.totalPurchase || 0,
            netDifference: response.summary.netDifference || 0,
            totalTransactions: response.summary.totalTransactions || 0,
            dateRange: {
              from: response.summary.dateRange?.from || 'All Time',
              to: response.summary.dateRange?.to || 'All Time'
            }
          };
        } else {
          // Calculate summary from data if not provided
          const sales = this.dayBookData.filter(item => item.type === 'SALE').reduce((sum, item) => sum + (item.amount || 0), 0);
          const purchases = this.dayBookData.filter(item => item.type === 'PURCHASE').reduce((sum, item) => sum + (item.amount || 0), 0);
          this.summary = {
            totalSales: sales,
            totalPurchase: purchases,
            netDifference: sales - purchases,
            totalTransactions: this.dayBookData.length,
            dateRange: { from: 'All Time', to: 'All Time' }
          };
        }
        
        this.dataSource.data = this.dayBookData;
        console.log('Processed Day Book Data:', this.dayBookData);
        console.log('Processed Summary:', this.summary);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading day book:', error);
        this.dayBookData = [];
        this.dataSource.data = [];
        this.summary = {
          totalSales: 0,
          totalPurchase: 0,
          netDifference: 0,
          totalTransactions: 0,
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
    this.loadDayBook();
  }

  exportToExcel(): void {
    if (this.dayBookData.length === 0) {
      alert('No data available to export');
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Type', 'Ref No', 'Party', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...this.dayBookData.map(item => [
        `"${new Date(item.date).toLocaleDateString()}"`,
        `"${item.type}"`,
        `"${item.refNo}"`,
        `"${item.party}"`,
        item.amount
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Day_Book.csv');
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

  goBackToReports(): void {
    this.router.navigate(['/reports']);
  }
}
