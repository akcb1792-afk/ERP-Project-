import { Component } from '@angular/core';

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss']
})
export class ItemDetailComponent {
  title = 'Item Details';
  
  item = {
    id: 1,
    name: 'Laptop',
    category: 'Electronics',
    price: 999.99,
    stock: 10,
    createdDate: '2024-01-01',
    lastModified: '2024-01-15'
  };

  onEdit() {
    console.log('Edit item:', this.item);
  }

  onDelete() {
    console.log('Delete item:', this.item);
  }
}
