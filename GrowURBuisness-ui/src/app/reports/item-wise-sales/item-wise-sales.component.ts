import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface ItemWiseSalesEntry {
  itemId: number;
  itemName: string;
  qtySold: number;
  totalSales: number;
  avgRate: number;
}

export interface ItemWiseSalesSummary {
  totalItems: number;
  totalQuantitySold: number;
  totalRevenue: number;
  averageItemPrice: number;
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
  selector: 'app-item-wise-sales',
  templateUrl: './item-wise-sales.component.html',
  styleUrls: ['./item-wise-sales.component.scss']
})
export class ItemWiseSalesComponent implements OnInit {
  title = 'Item-wise Sales Report';
  
  itemSalesData: ItemWiseSalesEntry[] = [];
  displayedColumns = ['itemName', 'qtySold', 'totalSales', 'avgRate'];
  dataSource = new MatTableDataSource<ItemWiseSalesEntry>();
  isLoading = false;
  
  // Summary data
  summary: ItemWiseSalesSummary = {
    totalItems: 0,
    totalQuantitySold: 0,
    totalRevenue: 0,
    averageItemPrice: 0,
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
    this.loadItemWiseSales();
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
      this.loadItemWiseSales();
    }
  }

  loadItemWiseSales(): void {
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
      console.log('Item Sales From Date:', fromDate, 'Formatted:', formattedFromDate);
    }
    if (toDate) {
      // Handle timezone by creating date in local timezone and formatting as YYYY-MM-DD
      const date = new Date(toDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedToDate = `${year}-${month}-${day}`;
      params.append('toDate', formattedToDate);
      console.log('Item Sales To Date:', toDate, 'Formatted:', formattedToDate);
    }
    if (itemId) params.append('itemId', itemId);
    
    const url = `${environment.apiUrl}/reports/item-wise-sales?${params.toString()}`;
    console.log('Item-wise Sales API URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        console.log('Response data:', response.data);
        console.log('Response summary:', response.summary);
        
        // Handle different response structures
        if (response.data && Array.isArray(response.data)) {
          this.itemSalesData = response.data;
        } else if (Array.isArray(response)) {
          this.itemSalesData = response;
        } else {
          this.itemSalesData = [];
        }
        
        // Handle summary data
        if (response.summary) {
          // Map lowercase API response to capitalized interface
          this.summary = {
            totalItems: response.summary.totalItems || 0,
            totalQuantitySold: response.summary.totalQuantitySold || 0,
            totalRevenue: response.summary.totalRevenue || 0,
            averageItemPrice: response.summary.averageItemPrice || 0,
            dateRange: {
              from: response.summary.dateRange?.from || 'All Time',
              to: response.summary.dateRange?.to || 'All Time'
            }
          };
        } else {
          // Calculate summary from data if not provided
          this.summary = {
            totalItems: this.itemSalesData.length,
            totalQuantitySold: this.itemSalesData.reduce((sum, item) => sum + (item.qtySold || 0), 0),
            totalRevenue: this.itemSalesData.reduce((sum, item) => sum + (item.totalSales || 0), 0),
            averageItemPrice: this.itemSalesData.length > 0 ? 
              this.itemSalesData.reduce((sum, item) => sum + (item.avgRate || 0), 0) / this.itemSalesData.length : 0,
            dateRange: { from: 'All Time', to: 'All Time' }
          };
        }
        
        this.dataSource.data = this.itemSalesData;
        console.log('Processed Item Sales Data:', this.itemSalesData);
        console.log('Processed Summary:', this.summary);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading item-wise sales:', error);
        this.itemSalesData = [];
        this.dataSource.data = [];
        this.summary = {
          totalItems: 0,
          totalQuantitySold: 0,
          totalRevenue: 0,
          averageItemPrice: 0,
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
    this.loadItemWiseSales();
  }

  exportToExcel(): void {
    if (this.itemSalesData.length === 0) {
      alert('No data available to export');
      return;
    }

    // Create CSV content
    const headers = ['Item Name', 'Qty Sold', 'Total Sales', 'Avg Rate'];
    const csvContent = [
      headers.join(','),
      ...this.itemSalesData.map(item => [
        `"${item.itemName}"`,
        item.qtySold,
        item.totalSales,
        item.avgRate
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Item_Wise_Sales.csv');
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

  isTopSellingItem(index: number): boolean {
    // Highlight top 3 selling items
    return index < 3 && this.itemSalesData.length > 0;
  }

  goBackToReports(): void {
    this.router.navigate(['/reports']);
  }
}
