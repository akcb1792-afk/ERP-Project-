import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface PurchaseItemWiseEntry {
  itemId: number;
  itemName: string;
  qtyPurchased: number;
  totalPurchase: number;
  avgPurchaseRate: number;
}

export interface PurchaseItemWiseSummary {
  totalItems: number;
  totalQuantityPurchased: number;
  totalPurchaseAmount: number;
  averagePurchaseRate: number;
  dateRange: {
    from: string;
    to: string;
  };
}

export interface Item {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  minimumStock: number;
  unit: string;
  categoryId: number;
  isActive: boolean;
}

@Component({
  selector: 'app-purchase-item-wise',
  templateUrl: './purchase-item-wise.component.html',
  styleUrls: ['./purchase-item-wise.component.scss']
})
export class PurchaseItemWiseComponent implements OnInit {
  title = 'Purchase Item-wise Report';
  
  purchaseItemData: PurchaseItemWiseEntry[] = [];
  displayedColumns = ['itemName', 'qtyPurchased', 'totalPurchase', 'avgPurchaseRate'];
  dataSource = new MatTableDataSource<PurchaseItemWiseEntry>();
  isLoading = false;
  
  // Summary data
  summary: PurchaseItemWiseSummary = {
    totalItems: 0,
    totalQuantityPurchased: 0,
    totalPurchaseAmount: 0,
    averagePurchaseRate: 0,
    dateRange: { from: 'All Time', to: 'All Time' }
  };
  
  // Form for filtering
  filterForm: FormGroup;
  items: Item[] = [];
  filteredItems: Item[] = [];
  
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
      itemId: ['']
    });
  }

  ngOnInit() {
    this.loadItems();
    this.loadPurchaseItemWise();
  }

  loadItems(): void {
    this.http.get<Item[]>(`${environment.apiUrl}/Item`).subscribe({
      next: (items) => {
        this.items = items;
        this.filteredItems = this.items;
        console.log('Loaded items:', this.items);
      },
      error: (error) => {
        console.error('Error loading items:', error);
      }
    });
  }

  onItemSearch(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredItems = this.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm)
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
      this.loadPurchaseItemWise();
    }
  }

  loadPurchaseItemWise(): void {
    if (this.hasError) return;
    
    this.isLoading = true;
    
    const params = new URLSearchParams();
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    const itemId = this.filterForm.get('itemId')?.value;
    
    if (fromDate) {
      // Handle timezone by creating date in local timezone and formatting as YYYY-MM-DD
      const date = new Date(fromDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedFromDate = `${year}-${month}-${day}`;
      params.append('fromDate', formattedFromDate);
      console.log('Purchase Item From Date:', fromDate, 'Formatted:', formattedFromDate);
    }
    if (toDate) {
      // Handle timezone by creating date in local timezone and formatting as YYYY-MM-DD
      const date = new Date(toDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedToDate = `${year}-${month}-${day}`;
      params.append('toDate', formattedToDate);
      console.log('Purchase Item To Date:', toDate, 'Formatted:', formattedToDate);
    }
    if (itemId) params.append('itemId', itemId);
    
    const url = `${environment.apiUrl}/reports/purchase-item-wise?${params.toString()}`;
    console.log('Purchase Item-wise API URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        console.log('Response data:', response.data);
        console.log('Response summary:', response.summary);
        
        // Handle different response structures
        if (response.data && Array.isArray(response.data)) {
          this.purchaseItemData = response.data;
        } else if (Array.isArray(response)) {
          this.purchaseItemData = response;
        } else {
          this.purchaseItemData = [];
        }
        
        // Handle summary data
        if (response.summary) {
          // Map lowercase API response to capitalized interface
          this.summary = {
            totalItems: response.summary.totalItems || 0,
            totalQuantityPurchased: response.summary.totalQuantityPurchased || 0,
            totalPurchaseAmount: response.summary.totalPurchaseAmount || 0,
            averagePurchaseRate: response.summary.averagePurchaseRate || 0,
            dateRange: {
              from: response.summary.dateRange?.from || 'All Time',
              to: response.summary.dateRange?.to || 'All Time'
            }
          };
        } else {
          // Calculate summary from data if not provided
          this.summary = {
            totalItems: this.purchaseItemData.length,
            totalQuantityPurchased: this.purchaseItemData.reduce((sum, item) => sum + (item.qtyPurchased || 0), 0),
            totalPurchaseAmount: this.purchaseItemData.reduce((sum, item) => sum + (item.totalPurchase || 0), 0),
            averagePurchaseRate: this.purchaseItemData.length > 0 ? 
              this.purchaseItemData.reduce((sum, item) => sum + (item.avgPurchaseRate || 0), 0) / this.purchaseItemData.length : 0,
            dateRange: { from: 'All Time', to: 'All Time' }
          };
        }
        
        this.dataSource.data = this.purchaseItemData;
        console.log('Processed Purchase Item Data:', this.purchaseItemData);
        console.log('Processed Summary:', this.summary);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading purchase item-wise:', error);
        this.purchaseItemData = [];
        this.dataSource.data = [];
        this.summary = {
          totalItems: 0,
          totalQuantityPurchased: 0,
          totalPurchaseAmount: 0,
          averagePurchaseRate: 0,
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
    this.filteredItems = this.items;
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filterForm.patchValue({
      fromDate: firstDayOfMonth.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
      itemId: ''
    });
    this.loadPurchaseItemWise();
  }

  exportToExcel(): void {
    if (this.purchaseItemData.length === 0) {
      alert('No data available to export');
      return;
    }

    // Create CSV content
    const headers = ['Item Name', 'Qty Purchased', 'Total Purchase', 'Avg Purchase Rate'];
    const csvContent = [
      headers.join(','),
      ...this.purchaseItemData.map(item => [
        `"${item.itemName}"`,
        item.qtyPurchased,
        item.totalPurchase,
        item.avgPurchaseRate
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Purchase_Item_Wise.csv');
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

  isTopPurchasedItem(index: number): boolean {
    // Highlight top 3 purchased items
    return index < 3 && this.purchaseItemData.length > 0;
  }

  goBackToReports(): void {
    this.router.navigate(['/reports']);
  }
}
