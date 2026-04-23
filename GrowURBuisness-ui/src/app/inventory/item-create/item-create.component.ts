import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-item-create',
  templateUrl: './item-create.component.html',
  styleUrls: ['./item-create.component.scss']
})
export class ItemCreateComponent {
  title = 'Create New Item';
  categories: any[] = [];

  constructor(
    private inventoryService: InventoryService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories(): void {
    this.inventoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.snackBar.open('Failed to load categories', 'Error', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    });
  }

  itemForm = {
    name: '',
    categoryId: 1,
    price: 0,
    stockQuantity: 0
  };

  onSubmit() {
    if (!this.itemForm.name || this.itemForm.price <= 0 || this.itemForm.stockQuantity < 0) {
      this.snackBar.open('Please fill all required fields with valid values', 'Error', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    const category = this.categories.find(c => c.id === this.itemForm.categoryId);
    const item = {
      name: this.itemForm.name,
      categoryId: this.itemForm.categoryId,
      price: this.itemForm.price,
      stockQuantity: this.itemForm.stockQuantity,
      minimumStock: 10 // Default minimum stock
    };

    // Create new item using API
    this.inventoryService.addItem(item).subscribe({
      next: () => {
        this.snackBar.open('Item created successfully!', 'Success', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        this.router.navigate(['/inventory']);
      },
      error: (error: any) => {
        console.error('Error creating item:', error);
        this.snackBar.open('Failed to create item', 'Error', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    });
  }

  onCancel() {
    this.router.navigate(['/inventory']);
  }
}
