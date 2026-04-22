import { Component } from '@angular/core';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.scss']
})
export class InvoiceDetailComponent {
  title = 'Invoice Details';
  
  invoice = {
    id: 1,
    customer: 'John Doe',
    total: 175.00,
    paymentType: 'Credit',
    date: '2024-01-15',
    status: 'Paid'
  };

  onPrint() {
    console.log('Print invoice:', this.invoice);
  }

  onEdit() {
    console.log('Edit invoice:', this.invoice);
  }
}
