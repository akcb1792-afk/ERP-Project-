import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';

export interface Supplier {
  id: number;
  name: string;
  address: string;
  email: string;
  phone: string;
  isActive: boolean;
}

export interface SupplierLedgerData {
  Date: string;
  Type: string;
  RefNo: string;
  SupplierName: string;
  Debit: number;
  Credit: number;
  Balance: number;
}

export interface SupplierLedgerSummary {
  TotalPurchases: number;
  TotalOutstanding: number;
  TransactionCount: number;
  DateRange: {
    From: string;
    To: string;
  };
}

@Component({
  selector: 'app-supplier-ledger',
  templateUrl: './supplier-ledger.component.html',
  styleUrls: ['./supplier-ledger.component.scss']
})
export class SupplierLedgerComponent implements OnInit {
  title = 'Supplier Ledger Report';
  
  // Data
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  supplierLedgerData: SupplierLedgerData[] = [];
  summary: SupplierLedgerSummary | null = null;
  dataSource: MatTableDataSource<SupplierLedgerData>;
  
  // UI State
  isLoading = false;
  hasError = false;
  errorMessage: string = '';
  
  // Form
  filterForm: FormGroup;
  
  // Table
  displayedColumns = ['Date', 'Type', 'RefNo', 'SupplierName', 'Debit', 'Credit', 'Balance'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<SupplierLedgerData>();
    
    // Set default date range (current month)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm = this.fb.group({
      fromDate: [firstDayOfMonth.toISOString().split('T')[0]],
      toDate: [today.toISOString().split('T')[0]],
      vendorId: ['']
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadSupplierLedgerData();
  }

  loadSuppliers(): void {
    this.http.get<Supplier[]>(`${environment.apiUrl}/billing/vendors`).subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers.filter(supplier => supplier.isActive);
        this.filteredSuppliers = this.suppliers;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  onSupplierSearch(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredSuppliers = this.suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(searchTerm)
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
      this.loadSupplierLedgerData();
    }
  }

  onReset(): void {
    // Reset to default date range
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm.patchValue({
      fromDate: firstDayOfMonth.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
      vendorId: ''
    });
    
    this.hasError = false;
    this.errorMessage = '';
    this.loadSupplierLedgerData();
  }

  loadSupplierLedgerData(): void {
    if (this.hasError) return;
    
    this.isLoading = true;
    
    const params = new URLSearchParams();
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    const vendorId = this.filterForm.get('vendorId')?.value;
    
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
    if (vendorId) params.append('vendorId', vendorId);
    
    const url = `${environment.apiUrl}/reports/supplier-ledger?${params.toString()}`;
    console.log('API URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        
        // Map API response to frontend interface (handle lowercase property names)
        this.supplierLedgerData = (response.data || []).map((item: any) => ({
          Date: item.date ? item.date.split('T')[0] : item.date,
          Type: item.type,
          RefNo: item.refNo,
          SupplierName: item.supplierName,
          Debit: item.debit,
          Credit: item.credit,
          Balance: item.balance
        }));
        
        // Map summary response
        this.summary = response.summary ? {
          TotalPurchases: response.summary.totalPurchases || response.summary.TotalPurchases,
          TotalOutstanding: response.summary.totalOutstanding || response.summary.TotalOutstanding,
          TransactionCount: response.summary.transactionCount || response.summary.TransactionCount,
          DateRange: response.summary.dateRange || response.summary.DateRange
        } : null;
        
        this.dataSource.data = this.supplierLedgerData;
        console.log('Supplier Ledger Data:', this.supplierLedgerData);
        console.log('Summary:', this.summary);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading supplier ledger data:', error);
        this.snackBar.open('Error loading supplier ledger data. Please try again.', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  exportToExcel(): void {
    if (!this.supplierLedgerData || this.supplierLedgerData.length === 0) {
      this.snackBar.open('No data to export', 'Close', { duration: 3000 });
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Type', 'Reference No', 'Supplier Name', 'Debit', 'Credit', 'Balance'];
    const csvRows = [
      headers.join(','),
      ...this.supplierLedgerData.map(row => [
        row.Date,
        row.Type,
        row.RefNo,
        `"${row.SupplierName}"`,
        row.Debit,
        row.Credit,
        row.Balance
      ].join(','))
    ];

    // Add summary at the end
    if (this.summary) {
      csvRows.push('\n\nSummary');
      csvRows.push(`Total Purchases,${this.summary.TotalPurchases}`);
      csvRows.push(`Total Outstanding,${this.summary.TotalOutstanding}`);
      csvRows.push(`Transaction Count,${this.summary.TransactionCount}`);
    }

    const csvContent = csvRows.join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Supplier_Ledger.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Supplier Ledger exported successfully', 'Close', { duration: 3000 });
  }

  backToReports(): void {
    // Navigate back to reports page
    window.history.back();
  }
}
