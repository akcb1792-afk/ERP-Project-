import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { InventoryService } from '../../services/inventory.service';
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
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      itemName: [''],
      category: ['']
    });
  }

  ngOnInit() {
    this.loadItems();
    this.loadCategories();
  }

  loadItems() {
    this.inventoryService.getItems().subscribe(items => {
      this.items = items;
      this.filteredItems = [...items];
      this.calculateSummaryData(this.filteredItems);
    });
  }

  loadCategories() {
    this.inventoryService.getCategories().subscribe(categories => {
      this.categories = categories.map(cat => cat.name);
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
    
    this.filteredItems = this.items.filter(item => {
      // Item name filter
      if (filters.itemName && !item.name.toLowerCase().includes(filters.itemName.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (filters.category && item.categoryName !== filters.category) {
        return false;
      }
      
      return true;
    });
    
    this.calculateSummaryData(this.filteredItems);
  }

  clearFilters(): void {
    this.filterForm.reset({
      itemName: '',
      category: ''
    });
    this.filteredItems = [...this.items];
    this.calculateSummaryData(this.filteredItems);
  }

  calculateSummaryData(items: any[]): void {
    this.totalItems = items.length;
    this.totalStockQuantity = items.reduce((sum, item) => sum + (item.stock || item.stockQuantity || 0), 0);
    this.totalInventoryValue = items.reduce((sum, item) => sum + ((item.stock || item.stockQuantity || 0) * (item.price || 0)), 0);
  }
}
