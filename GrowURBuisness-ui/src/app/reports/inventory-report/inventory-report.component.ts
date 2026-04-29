import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-inventory-report',
  templateUrl: './inventory-report.component.html',
  styleUrls: ['./inventory-report.component.scss']
})
export class InventoryReportComponent implements OnInit {
  title = 'Inventory Report';
  
  // Data properties
  inventoryData: any[] = [];
  filteredInventoryData: any[] = [];
  summary: any = {};
  categories: any[] = [];
  
  // UI properties
  isLoading = false;
  error: string | null = null;
  filterForm: FormGroup;
  
  // Table columns
  displayedColumns = ['id', 'name', 'category', 'price', 'stockQuantity', 'minimumStock', 'stockStatus', 'stockValue', 'totalSold', 'totalPurchased', 'reorderNeeded'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.filterForm = this.fb.group({
      categoryId: [''],
      status: ['']
    });
  }

  ngOnInit() {
    this.loadInventoryReport();
    
    // Subscribe to form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadInventoryReport(): void {
    this.isLoading = true;
    this.error = null;
    
    const params = new URLSearchParams();
    const categoryId = this.filterForm.get('categoryId')?.value;
    const status = this.filterForm.get('status')?.value;
    
    if (categoryId) params.append('categoryId', categoryId);
    if (status) params.append('status', status);
    
    const url = params.toString() ? 
      `${environment.apiUrl}/reports/inventory?${params.toString()}` : 
      `${environment.apiUrl}/reports/inventory`;
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.inventoryData = response.Inventory || [];
        this.summary = response.Summary || {};
        this.categories = this.summary.Categories || [];
        this.filteredInventoryData = [...this.inventoryData];
        this.isLoading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load inventory report';
        this.isLoading = false;
        console.error('Error loading inventory report:', error);
        this.inventoryData = [];
        this.filteredInventoryData = [];
        this.summary = {};
        this.categories = [];
      }
    });
  }

  applyFilters(): void {
    this.loadInventoryReport();
  }

  resetFilters(): void {
    this.filterForm.reset();
  }

  applyTextFilter(event: any): void {
    const filterValue = event.target.value.toLowerCase();
    this.filteredInventoryData = this.inventoryData.filter(item => 
      item.name.toLowerCase().includes(filterValue) ||
      item.category.toLowerCase().includes(filterValue) ||
      item.description?.toLowerCase().includes(filterValue)
    );
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStockStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'in stock':
        return '#4caf50';
      case 'low stock':
        return '#ff9800';
      case 'out of stock':
        return '#f44336';
      default:
        return '#666';
    }
  }

  getReorderStatusColor(reorderNeeded: boolean): string {
    return reorderNeeded ? '#f44336' : '#4caf50';
  }

  exportToExcel(): void {
    // Create CSV content for Excel export
    const headers = [
      'ID',
      'Name',
      'Description',
      'Category',
      'Price',
      'Stock Quantity',
      'Minimum Stock',
      'Stock Status',
      'Stock Value',
      'Total Sold',
      'Total Purchased',
      'Reorder Needed',
      'Last Modified'
    ];

    const csvContent = [
      headers.join(','),
      ...this.filteredInventoryData.map(item => [
        item.Id,
        `"${item.Name}"`,
        `"${item.Description || ''}"`,
        `"${item.Category}"`,
        item.Price || 0,
        item.StockQuantity || 0,
        item.MinimumStock || 0,
        `"${item.StockStatus}"`,
        item.StockValue || 0,
        item.TotalSold || 0,
        item.TotalPurchased || 0,
        item.ReorderNeeded ? 'Yes' : 'No',
        `"${new Date(item.LastModifiedDate).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  getUniqueCategories(): string[] {
    return this.categories.map((cat: any) => cat.Category);
  }

  getTotalInventoryValue(): number {
    return this.filteredInventoryData.reduce((total: number, item: any) => {
      return total + ((item.StockQuantity || 0) * (item.Price || 0));
    }, 0);
  }

  getTotalValue(item: any): number {
    return (item.StockQuantity || 0) * (item.Price || 0);
  }

  applyFilter(event: any): void {
    this.applyTextFilter(event);
  }
}
