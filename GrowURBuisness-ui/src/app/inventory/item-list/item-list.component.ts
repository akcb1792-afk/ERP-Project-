import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit {
  title = 'Inventory Management';
  items: any[] = [];
  filteredItems: any[] = [];
  displayedColumns = ['name', 'category', 'price', 'stockQuantity', 'totalValue'];
  searchQuery = '';
  totalItems: number = 0;
  totalStockQuantity: number = 0;
  totalInventoryValue: number = 0;
  filterForm: FormGroup;
  categories: string[] = [];

  constructor(
    private databaseService: DatabaseService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      itemName: [''],
      category: [''],
      stockFilter: [''],
      quantity: ['']
    });
  }

  ngOnInit() {
    this.databaseService.getInventoryItems().subscribe(items => {
      this.items = items;
      this.categories = this.extractCategories(items);
      this.filteredItems = [...items];
      this.calculateSummaryData(this.filteredItems);
    });
  }

  onSearchChange(searchTerm: string) {
    this.searchQuery = searchTerm;
    this.applyFilters();
  }

  extractCategories(items: any[]): string[] {
    const categories = new Set(items.map(item => item.category).filter(Boolean));
    return Array.from(categories);
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.databaseService.getInventoryItems().subscribe(items => {
      this.filteredItems = items.filter(item => {
        // Item name filter
        if (filters.itemName && !item.name.toLowerCase().includes(filters.itemName.toLowerCase())) {
          return false;
        }
        
        // Category filter
        if (filters.category && item.category !== filters.category) {
          return false;
        }
        
        // Stock quantity filter
        const stockQuantity = item.stock || item.stockQuantity || 0;
        if (filters.stockFilter) {
          switch (filters.stockFilter) {
            case 'instock':
              return stockQuantity > 0;
            case 'outofstock':
              return stockQuantity === 0;
            case 'lowstock':
              return stockQuantity <= 10;
            default:
              return true;
          }
        }
        
        // Quantity filter
        if (filters.quantity && stockQuantity < parseInt(filters.quantity)) {
          return false;
        }
        
        return true;
      });
      
      this.calculateSummaryData(this.filteredItems);
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      itemName: '',
      category: '',
      stockFilter: ''
    });
    this.databaseService.getInventoryItems().subscribe(items => {
      this.filteredItems = [...items];
      this.calculateSummaryData(this.filteredItems);
    });
  }

  calculateSummaryData(items: any[]): void {
    this.totalItems = items.length;
    this.totalStockQuantity = items.reduce((sum, item) => sum + (item.stock || item.stockQuantity || 0), 0);
    this.totalInventoryValue = items.reduce((sum, item) => sum + ((item.stock || item.stockQuantity || 0) * (item.price || 0)), 0);
  }
}
