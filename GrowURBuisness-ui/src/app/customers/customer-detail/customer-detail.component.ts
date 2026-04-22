import { Component } from '@angular/core';

@Component({
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss']
})
export class CustomerDetailComponent {
  title = 'Customer Details';
  
  customer = {
    id: 1,
    name: 'John Doe',
    mobile: '9876543210',
    createdDate: '2024-01-15'
  };

  onEdit() {
    console.log('Edit customer:', this.customer);
  }
}
