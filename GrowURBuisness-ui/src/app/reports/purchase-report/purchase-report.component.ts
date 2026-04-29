import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface PurchaseReportItem {
  purchaseOrderNo: string;
  vendorName: string;
  date: string;
  itemName: string;
  itemRate: number;
  quantity: number;
  amount: number;
  vendorId: number;
  orderId: number;
  status: string;
  expectedDeliveryDate: string;
}

export interface PurchaseReportSummary {
  totalPurchases: number;
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

export interface Vendor {
  id: number;
  name: string;
  email: string;
  phone: string;
  customerType: string;
}

@Component({
  selector: 'app-purchase-report',
  templateUrl: './purchase-report.component.html',
  styleUrls: ['./purchase-report.component.scss']
})
export class PurchaseReportComponent implements OnInit {
  title = 'Purchase Report';
  
  purchaseData: PurchaseReportItem[] = [];
  displayedColumns = ['purchaseOrderNo', 'vendorName', 'date', 'itemName', 'itemRate', 'quantity', 'amount'];
  dataSource = new MatTableDataSource<PurchaseReportItem>();
  isLoading = false;
  
  // Summary data
  summary: PurchaseReportSummary = {
    totalPurchases: 0,
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
  vendors: Vendor[] = [];
  filteredVendors: Vendor[] = [];
  
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
      vendorId: ['']
    });
  }

  ngOnInit() {
    this.loadVendors();
    this.loadPurchaseReport();
  }

  loadVendors(): void {
    this.http.get<Vendor[]>(`${environment.apiUrl}/Customer`).subscribe({
      next: (vendors) => {
        // Filter to show only vendors (customers with customerType 'Vendor')
        this.vendors = vendors.filter(vendor => vendor.customerType === 'Vendor');
        this.filteredVendors = this.vendors;
        console.log('Loaded vendors:', this.vendors);
      },
      error: (error) => {
        console.error('Error loading vendors:', error);
      }
    });
  }

  onVendorSearch(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredVendors = this.vendors.filter(vendor => 
      vendor.name.toLowerCase().includes(searchTerm)
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
      this.loadPurchaseReport();
    }
  }

  loadPurchaseReport(): void {
    if (this.hasError) return;
    
    this.isLoading = true;
    
    const params = new URLSearchParams();
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    const vendorId = this.filterForm.get('vendorId')?.value;
    
    if (fromDate) {
      // Handle timezone by creating date in local timezone and formatting as YYYY-MM-DD
      const date = new Date(fromDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedFromDate = `${year}-${month}-${day}`;
      params.append('fromDate', formattedFromDate);
      console.log('From Date:', fromDate, 'Formatted:', formattedFromDate);
    }
    if (toDate) {
      // Handle timezone by creating date in local timezone and formatting as YYYY-MM-DD
      const date = new Date(toDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedToDate = `${year}-${month}-${day}`;
      params.append('toDate', formattedToDate);
      console.log('To Date:', toDate, 'Formatted:', formattedToDate);
    }
    if (vendorId) params.append('vendorId', vendorId);
    
    // Add pagination parameters
    params.append('page', this.pagination.currentPage.toString());
    params.append('pageSize', this.pagination.pageSize.toString());
    
    const url = `${environment.apiUrl}/reports/purchase/detailed?${params.toString()}`;
    console.log('API URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        this.purchaseData = response.data || [];
        this.summary = response.summary || this.summary;
        this.pagination = response.pagination || this.pagination;
        this.dataSource.data = this.purchaseData;
        console.log('Purchase Data:', this.purchaseData);
        console.log('Summary:', this.summary);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading purchase report:', error);
        this.purchaseData = [];
        this.dataSource.data = [];
        this.summary = {
          totalPurchases: 0,
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
    this.filteredVendors = this.vendors;
    this.pagination.currentPage = 1;
    this.loadPurchaseReport();
  }

  onPageChange(page: number): void {
    this.pagination.currentPage = page;
    this.loadPurchaseReport();
  }

  onPreviousPage(): void {
    if (this.pagination.hasPreviousPage) {
      this.pagination.currentPage--;
      this.loadPurchaseReport();
    }
  }

  onNextPage(): void {
    if (this.pagination.hasNextPage) {
      this.pagination.currentPage++;
      this.loadPurchaseReport();
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
    if (this.purchaseData.length === 0) {
      alert('No data available to export');
      return;
    }

    // Create CSV content
    const headers = ['Purchase Order No', 'Vendor Name', 'Date', 'Item Name', 'Item Rate', 'Quantity', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...this.purchaseData.map(item => [
        `"${item.purchaseOrderNo}"`,
        `"${item.vendorName}"`,
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
    link.setAttribute('download', 'Purchase_Report.csv');
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
