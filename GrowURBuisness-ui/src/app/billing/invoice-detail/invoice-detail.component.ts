import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.scss']
})
export class InvoiceDetailComponent implements OnInit {
  title = 'Invoice Details';
  
  invoice: any = {};
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadInvoice();
  }

  loadInvoice(): void {
    this.isLoading = true;
    const invoiceId = this.route.snapshot.paramMap.get('id');
    
    if (invoiceId) {
      this.http.get<any>(`${environment.apiUrl}/billing/invoices/${invoiceId}`).subscribe({
        next: (invoice) => {
          this.invoice = invoice;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading invoice:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  onPrint() {
    console.log('Print invoice:', this.invoice);
  }

  onEdit() {
    console.log('Edit invoice:', this.invoice);
  }
}
