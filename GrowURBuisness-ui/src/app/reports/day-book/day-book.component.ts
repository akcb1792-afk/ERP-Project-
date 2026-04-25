import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';

export interface DayBookData {
  Date: string;
  Type: string;
  RefNo: string;
  Party: string;
  Amount: number;
}

export interface DayBookSummary {
  TotalSales: number;
  TotalPurchase: number;
  TransactionCount: number;
  DateRange: {
    From: string;
    To: string;
  };
}

@Component({
  selector: 'app-day-book',
  templateUrl: './day-book.component.html',
  styleUrls: ['./day-book.component.scss']
})
export class DayBookComponent implements OnInit {
  title = 'Day Book - Daily Transaction Report';
  
  // Data
  dayBookData: DayBookData[] = [];
  summary: DayBookSummary | null = null;
  dataSource: MatTableDataSource<DayBookData>;
  
  // UI State
  isLoading = false;
  hasError = false;
  errorMessage: string = '';
  
  // Form
  filterForm: FormGroup;
  
  // Table
  displayedColumns = ['Date', 'Type', 'RefNo', 'Party', 'Amount'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<DayBookData>();
    
    // Set default date range (today)
    const today = new Date();
    
    this.filterForm = this.fb.group({
      fromDate: [today.toISOString().split('T')[0]],
      toDate: [today.toISOString().split('T')[0]]
    });
  }

  ngOnInit(): void {
    this.loadDayBookData();
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
      this.loadDayBookData();
    }
  }

  onReset(): void {
    // Reset to today
    const today = new Date();
    
    this.filterForm.patchValue({
      fromDate: today.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0]
    });
    
    this.hasError = false;
    this.errorMessage = '';
    this.loadDayBookData();
  }

  loadDayBookData(): void {
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
    
    const url = `${environment.apiUrl}/reports/day-book?${params.toString()}`;
    console.log('API URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        
        // Map API response to frontend interface (handle lowercase property names)
        this.dayBookData = (response.data || []).map((item: any) => ({
          Date: item.date ? item.date.split('T')[0] : item.date,
          Type: item.type,
          RefNo: item.refNo,
          Party: item.party,
          Amount: item.amount
        }));
        
        // Map summary response
        this.summary = response.summary ? {
          TotalSales: response.summary.totalSales || response.summary.TotalSales,
          TotalPurchase: response.summary.totalPurchase || response.summary.TotalPurchase,
          TransactionCount: response.summary.transactionCount || response.summary.TransactionCount,
          DateRange: response.summary.dateRange || response.summary.DateRange
        } : null;
        
        this.dataSource.data = this.dayBookData;
        console.log('Day Book Data:', this.dayBookData);
        console.log('Summary:', this.summary);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading day book data:', error);
        this.snackBar.open('Error loading day book data. Please try again.', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  exportToExcel(): void {
    if (!this.dayBookData || this.dayBookData.length === 0) {
      this.snackBar.open('No data to export', 'Close', { duration: 3000 });
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Type', 'Reference No', 'Party', 'Amount'];
    const csvRows = [
      headers.join(','),
      ...this.dayBookData.map(row => [
        row.Date,
        row.Type,
        row.RefNo,
        `"${row.Party}"`,
        row.Amount
      ].join(','))
    ];

    // Add summary at the end
    if (this.summary) {
      csvRows.push('\n\nSummary');
      csvRows.push(`Total Sales,${this.summary.TotalSales}`);
      csvRows.push(`Total Purchase,${this.summary.TotalPurchase}`);
      csvRows.push(`Transaction Count,${this.summary.TransactionCount}`);
    }

    const csvContent = csvRows.join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Day_Book.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Day Book exported successfully', 'Close', { duration: 3000 });
  }

  backToReports(): void {
    // Navigate back to reports page
    window.history.back();
  }
}
