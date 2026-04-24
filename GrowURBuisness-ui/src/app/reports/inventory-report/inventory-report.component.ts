import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-inventory-report',
  templateUrl: './inventory-report.component.html',
  styleUrls: ['./inventory-report.component.scss']
})
export class InventoryReportComponent implements OnInit {
  inventoryData: any[] = [];
  filteredInventoryData: any[] = [];
  isLoading = false;
  error: string | null = null;
  lowStockThreshold: number = 10;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadInventoryReport();
  }

  displayedColumns: string[] = ['name', 'itemCode', 'category', 'stockQuantity', 'purchaseRate', 'saleRate', 'totalValue', 'status'];

  loadInventoryReport(): void {
    this.isLoading = true;
    this.error = null;
    
    this.http.get<any[]>(`${environment.apiUrl}/inventory/items`).subscribe({
      next: (items) => {
        this.inventoryData = items;
        this.filteredInventoryData = items;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load inventory report';
        this.isLoading = false;
      }
    });
  }

  getLowStockItems(): any[] {
    return this.filteredInventoryData.filter(item => 
      (item.stockQuantity || item.stock || 0) <= this.lowStockThreshold
    );
  }

  getUniqueCategories(): string[] {
    const categories = [...new Set(this.inventoryData.map(item => item.category).filter(Boolean))];
    return categories.sort();
  }

  getTotalInventoryValue(): number {
    return this.inventoryData.reduce((total, item) => {
      return total + this.getTotalValue(item);
    }, 0);
  }

  getTotalValue(item: any): number {
    const quantity = item.stockQuantity || item.stock || 0;
    const rate = item.purchaseRate || item.price || 0;
    return quantity * rate;
  }

  isLowStock(item: any): boolean {
    return (item.stockQuantity || item.stock || 0) <= this.lowStockThreshold;
  }

  applyFilter(event: any): void {
    const filterValue = event.target.value.toLowerCase();
    this.filteredInventoryData = this.inventoryData.filter(item => 
      item.name.toLowerCase().includes(filterValue) ||
      item.category.toLowerCase().includes(filterValue) ||
      (item.itemCode && item.itemCode.toLowerCase().includes(filterValue))
    );
  }

  applyCategoryFilter(category: string): void {
    if (category) {
      this.filteredInventoryData = this.inventoryData.filter(item => 
        item.category === category
      );
    } else {
      this.filteredInventoryData = this.inventoryData;
    }
  }

  applyStockFilter(status: string): void {
    if (status === 'low') {
      this.filteredInventoryData = this.inventoryData.filter(item => 
        this.isLowStock(item)
      );
    } else if (status === 'normal') {
      this.filteredInventoryData = this.inventoryData.filter(item => 
        !this.isLowStock(item)
      );
    } else {
      this.filteredInventoryData = this.inventoryData;
    }
  }

  exportToExcel(): void {
    // Create CSV content for Excel export
    const headers = [
      'Item Name',
      'Item Code',
      'Category',
      'Stock Quantity',
      'Purchase Rate',
      'Sale Rate',
      'Total Value',
      'Status'
    ];

    const csvContent = [
      headers.join(','),
      ...this.filteredInventoryData.map(item => [
        `"${item.name}"`,
        `"${item.itemCode || item.id || ''}"`,
        `"${item.category}"`,
        item.stockQuantity || item.stock || 0,
        item.purchaseRate || item.price || 0,
        item.saleRate || (item.price * 1.2) || 0,
        this.getTotalValue(item),
        `"${this.isLowStock(item) ? 'Low Stock' : 'In Stock'}"`
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
}
