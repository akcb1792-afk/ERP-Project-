import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from '../../services/database.service';

@Component({
  selector: 'app-item-create',
  templateUrl: './item-create.component.html',
  styleUrls: ['./item-create.component.scss']
})
export class ItemCreateComponent {
  title = 'Create New Item';

  categories = [
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Hardware' },
    { id: 3, name: 'Software' },
    { id: 4, name: 'Accessories' }
  ];

  constructor(
    private databaseService: DatabaseService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // No edit functionality for now
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
      category: category ? category.name : 'Unknown',
      price: this.itemForm.price,
      stock: this.itemForm.stockQuantity
    };

    // Create new item (edit functionality removed for now)
    this.databaseService.addInventoryItem(item);
    
    this.snackBar.open('Item created successfully!', 'Success', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });

    // Clear any edit data
    localStorage.removeItem('editItem');
    this.router.navigate(['/inventory']);
  }

  onCancel() {
    this.router.navigate(['/inventory']);
  }
}
