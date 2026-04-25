import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';

export interface Item {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
}

export interface ItemWiseSalesData {
  ItemName: string;
  QtySold: number;
  TotalSales: number;
  AvgRate: number;
}

export interface ItemWiseSalesSummary {
  TotalItems: number;
  TotalQtySold: number;
  TotalSales: number;
  AvgRate: number;
  DateRange: {
    From: string;
    To: string;
  };
}

@Component({
  selector: 'app-item-wise-sales',
  templateUrl: './item-wise-sales.component.html',
  styleUrls: ['./item-wise-sales.component.scss']
})
export class ItemWiseSalesComponent implements OnInit {
  title = 'Item-wise Sales Report';
  
  // Data
  items: Item[] = [];
  filteredItems: Item[] = [];
  itemWiseSalesData: ItemWiseSalesData[] = [];
  summary: ItemWiseSalesSummary | null = null;
  dataSource: MatTableDataSource<ItemWiseSalesData>;
  
  // UI State
  isLoading = false;
  hasError = false;
  errorMessage: string = '';
  
  // Form
  filterForm: FormGroup;
  
  // Table
  displayedColumns = ['ItemName', 'QtySold', 'TotalSales', 'AvgRate'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<ItemWiseSalesData>();
    
    // Set default date range (current month)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm = this.fb.group({
      fromDate: [firstDayOfMonth.toISOString().split('T')[0]],
      toDate: [today.toISOString().split('T')[0]],
      itemId: ['']
    });
  }

  ngOnInit(): void {
    this.loadItems();
    this.loadItemWiseSalesData();
  }

  loadItems(): void {
    this.http.get<Item[]>(`${environment.apiUrl}/billing/items`).subscribe({
      next: (items) => {
        this.items = items.filter(item => item.isActive);
        this.filteredItems = this.items;
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
      this.loadItemWiseSalesData();
    }
  }

  onReset(): void {
    // Reset to default date range
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm.patchValue({
      fromDate: firstDayOfMonth.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
      itemId: ''
    });
    
    this.hasError = false;
    this.errorMessage = '';
    this.loadItemWiseSalesData();
  }

  loadItemWiseSalesData(): void {
    if (this.hasError) return;
    
    this.isLoading = true;
    
    const params = new URLSearchParams();
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    const itemId = this.filterForm.get('itemId')?.value;
    
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
    if (itemId) params.append('itemId', itemId);
    
    const url = `${environment.apiUrl}/reports/item-wise-sales?${params.toString()}`;
    console.log('API URL:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        
        // Map API response to frontend interface (handle lowercase property names)
        this.itemWiseSalesData = (response.data || []).map((item: any) => ({
          ItemName: item.itemName,
          QtySold: item.qtySold,
          TotalSales: item.totalSales,
          AvgRate: item.avgRate
        }));
        
        // Map summary response
        this.summary = response.summary ? {
          TotalItems: response.summary.totalItems || response.summary.TotalItems,
          TotalQtySold: response.summary.totalQtySold || response.summary.TotalQtySold,
          TotalSales: response.summary.totalSales || response.summary.TotalSales,
          AvgRate: response.summary.avgRate || response.summary.AvgRate,
          DateRange: response.summary.dateRange || response.summary.DateRange
        } : null;
        
        this.dataSource.data = this.itemWiseSalesData;
        console.log('Item-wise Sales Data:', this.itemWiseSalesData);
        console.log('Summary:', this.summary);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading item-wise sales data:', error);
        this.snackBar.open('Error loading item-wise sales data. Please try again.', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  isTopItem(index: number): boolean {
    return index < 3; // Top 3 items
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
    if (!this.itemWiseSalesData || this.itemWiseSalesData.length === 0) {
      this.snackBar.open('No data to export', 'Close', { duration: 3000 });
      return;
    }

    // Create CSV content
    const headers = ['Item Name', 'Qty Sold', 'Total Sales', 'Avg Sales Rate'];
    const csvRows = [
      headers.join(','),
      ...this.itemWiseSalesData.map((row, index) => [
        `"${row.ItemName}"`,
        row.QtySold,
        row.TotalSales,
        row.AvgRate
      ].join(','))
    ];

    // Add summary at the end
    if (this.summary) {
      csvRows.push('\n\nSummary');
      csvRows.push(`Total Items,${this.summary.TotalItems}`);
      csvRows.push(`Total Qty Sold,${this.summary.TotalQtySold}`);
      csvRows.push(`Total Sales,${this.summary.TotalSales}`);
      csvRows.push(`Avg Rate,${this.summary.AvgRate}`);
    }

    const csvContent = csvRows.join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Item_Wise_Sales.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Item-wise Sales exported successfully', 'Close', { duration: 3000 });
  }

  backToReports(): void {
    // Navigate back to reports page
    window.history.back();
  }
}
