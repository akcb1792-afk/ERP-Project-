import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface CustomerLedgerEntry {
  date: string;
  type: string;
  refNo: string;
  customerName: string;
  paymentMode: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CustomerLedgerSummary {
  TotalSales: number;
  TotalReceived: number;
  TotalOutstanding: number;
  TotalTransactions: number;
  DateRange: {
    From: string;
    To: string;
  };
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  customerType: string;
}

@Component({
  selector: 'app-customer-ledger',
  templateUrl: './customer-ledger.component.html',
  styleUrls: ['./customer-ledger.component.scss']
})
export class CustomerLedgerComponent implements OnInit {
  title = 'Customer Ledger';
  
  ledgerData: CustomerLedgerEntry[] = [];
  displayedColumns = ['date', 'type', 'refNo', 'customerName', 'paymentMode', 'debit', 'credit', 'balance'];
  dataSource = new MatTableDataSource<CustomerLedgerEntry>();
  isLoading = false;
  
  // Summary data
  summary: CustomerLedgerSummary = {
    TotalSales: 0,
    TotalReceived: 0,
    TotalOutstanding: 0,
    TotalTransactions: 0,
    DateRange: { From: 'All Time', To: 'All Time' }
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
      this.loadCustomerLedger();
    }
  }

  loadCustomerLedger(): void {
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
      console.log('Ledger From Date:', fromDate, 'Formatted:', formattedFromDate);
    }
    if (toDate) {
      // Handle timezone by creating date in local timezone and formatting as YYYY-MM-DD
      const date = new Date(toDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedToDate = `${year}-${month}-${day}`;
      params.append('toDate', formattedToDate);
      console.log('Ledger To Date:', toDate, 'Formatted:', formattedToDate);
    }
    if (customerId) params.append('customerId', customerId);
    
    const url = `${environment.apiUrl}/reports/customer-ledger?${params.toString()}`;
    console.log('Customer Ledger API URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        console.log('Response data:', response.data);
        console.log('Response summary:', response.summary);
        
        // Handle different response structures
        if (response.data && Array.isArray(response.data)) {
          this.ledgerData = response.data;
        } else if (Array.isArray(response)) {
          this.ledgerData = response;
        } else {
          this.ledgerData = [];
        }
        
        // Handle summary data
        if (response.summary) {
          // Map lowercase API response to capitalized interface
          this.summary = {
            TotalSales: response.summary.totalSales || 0,
            TotalReceived: response.summary.totalReceived || 0,
            TotalOutstanding: response.summary.totalOutstanding || 0,
            TotalTransactions: response.summary.totalTransactions || 0,
            DateRange: {
              From: response.summary.dateRange?.from || 'All Time',
              To: response.summary.dateRange?.to || 'All Time'
            }
          };
        } else {
          // Calculate summary from data if not provided
          this.summary = {
            TotalSales: this.ledgerData.reduce((sum, item) => sum + (item.debit || 0), 0),
            TotalReceived: this.ledgerData.reduce((sum, item) => sum + (item.credit || 0), 0),
            TotalOutstanding: this.ledgerData.reduce((sum, item) => sum + ((item.debit || 0) - (item.credit || 0)), 0),
            TotalTransactions: this.ledgerData.length,
            DateRange: { From: 'All Time', To: 'All Time' }
          };
        }
        
        this.dataSource.data = this.ledgerData;
        console.log('Processed Ledger Data:', this.ledgerData);
        console.log('Processed Summary:', this.summary);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading customer ledger:', error);
        this.ledgerData = [];
        this.dataSource.data = [];
        this.summary = {
          TotalSales: 0,
          TotalReceived: 0,
          TotalOutstanding: 0,
          TotalTransactions: 0,
          DateRange: { From: 'All Time', To: 'All Time' }
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
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filterForm.patchValue({
      fromDate: firstDayOfMonth.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
      customerId: ''
    });
    this.loadCustomerLedger();
  }

  exportToExcel(): void {
    if (this.ledgerData.length === 0) {
      alert('No data available to export');
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Type', 'Ref No', 'Customer Name', 'Payment Mode', 'Debit', 'Credit', 'Balance'];
    const csvContent = [
      headers.join(','),
      ...this.ledgerData.map(item => [
        `"${new Date(item.date).toLocaleDateString()}"`,
        `"${item.type}"`,
        `"${item.refNo}"`,
        `"${item.customerName}"`,
        `"${item.paymentMode}"`,
        item.debit,
        item.credit,
        item.balance
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Customer_Ledger.csv');
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
