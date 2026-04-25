import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  customerType: string;
}

export interface LedgerData {
  Date: string;
  Type: string;
  RefNo: string;
  CustomerName: string;
  PaymentMode: string;
  Debit: number;
  Credit: number;
  Balance: number;
}

export interface LedgerSummary {
  TotalSales: number;
  TotalReceived: number;
  TotalOutstanding: number;
  TransactionCount: number;
  DateRange: {
    From: string;
    To: string;
  };
}

@Component({
  selector: 'app-customer-ledger',
  templateUrl: './customer-ledger.component.html',
  styleUrls: ['./customer-ledger.component.scss']
})
export class CustomerLedgerComponent implements OnInit {
  title = 'Customer Ledger Report';
  
  // Data
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  ledgerData: LedgerData[] = [];
  summary: LedgerSummary | null = null;
  dataSource: MatTableDataSource<LedgerData>;
  
  // UI State
  isLoading = false;
  hasError = false;
  errorMessage: string = '';
  
  // Form
  filterForm: FormGroup;
  
  // Table
  displayedColumns = ['Date', 'Type', 'RefNo', 'CustomerName', 'PaymentMode', 'Debit', 'Credit', 'Balance'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<LedgerData>();
    
    // Set default date range (1st day of current month to today)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm = this.fb.group({
      fromDate: [firstDayOfMonth.toISOString().split('T')[0]],
      toDate: [today.toISOString().split('T')[0]],
      customerId: ['']
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadLedgerData();
  }

  loadCustomers(): void {
    this.http.get<Customer[]>(`${environment.apiUrl}/Customer`).subscribe({
      next: (customers) => {
        // Filter to show only customers (customers with customerType 'Customer')
        this.customers = customers.filter(customer => customer.customerType === 'Customer');
        this.filteredCustomers = this.customers;
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
      this.loadLedgerData();
    }
  }

  onReset(): void {
    // Reset to default date range
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm.patchValue({
      fromDate: firstDayOfMonth.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
      customerId: ''
    });
    
    this.hasError = false;
    this.errorMessage = '';
    this.loadLedgerData();
  }

  loadLedgerData(): void {
    if (this.hasError) return;
    
    this.isLoading = true;
    
    const params = new URLSearchParams();
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    const customerId = this.filterForm.get('customerId')?.value;
    
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
    if (customerId) params.append('customerId', customerId);
    
    const url = `${environment.apiUrl}/reports/customer-ledger?${params.toString()}`;
    console.log('API URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        
        // Map API response to frontend interface (handle lowercase property names)
        this.ledgerData = (response.data || []).map((item: any) => ({
          Date: item.date,
          Type: item.type,
          RefNo: item.refNo,
          CustomerName: item.customerName,
          PaymentMode: item.paymentMode,
          Debit: item.debit,
          Credit: item.credit,
          Balance: item.balance
        }));
        
        // Map summary response
        this.summary = response.summary ? {
          TotalSales: response.summary.totalSales || response.summary.TotalSales,
          TotalReceived: response.summary.totalReceived || response.summary.TotalReceived,
          TotalOutstanding: response.summary.totalOutstanding || response.summary.TotalOutstanding,
          TransactionCount: response.summary.transactionCount || response.summary.TransactionCount,
          DateRange: response.summary.dateRange || response.summary.DateRange
        } : null;
        
        this.dataSource.data = this.ledgerData;
        console.log('Ledger Data:', this.ledgerData);
        console.log('Summary:', this.summary);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading ledger data:', error);
        this.snackBar.open('Error loading ledger data. Please try again.', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  exportToExcel(): void {
    if (!this.ledgerData || this.ledgerData.length === 0) {
      this.snackBar.open('No data to export', 'Close', { duration: 3000 });
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Type', 'Reference No', 'Customer Name', 'Payment Mode', 'Debit', 'Credit', 'Balance'];
    const csvRows = [
      headers.join(','),
      ...this.ledgerData.map(row => [
        row.Date,
        row.Type,
        row.RefNo,
        `"${row.CustomerName}"`,
        row.PaymentMode,
        row.Debit,
        row.Credit,
        row.Balance
      ].join(','))
    ];

    // Add summary at the end
    if (this.summary) {
      csvRows.push('\n\nSummary');
      csvRows.push(`Total Sales,${this.summary.TotalSales}`);
      csvRows.push(`Total Received,${this.summary.TotalReceived}`);
      csvRows.push(`Total Outstanding,${this.summary.TotalOutstanding}`);
      csvRows.push(`Transaction Count,${this.summary.TransactionCount}`);
    }

    const csvContent = csvRows.join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Customer_Ledger.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Ledger exported successfully', 'Close', { duration: 3000 });
  }

  backToReports(): void {
    // Navigate back to reports page
    window.history.back();
  }
}
