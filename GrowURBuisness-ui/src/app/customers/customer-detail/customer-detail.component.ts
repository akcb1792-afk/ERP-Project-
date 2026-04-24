import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss']
})
export class CustomerDetailComponent implements OnInit {
  title = 'Customer Details';
  
  customer: any = {};
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadCustomer();
  }

  loadCustomer(): void {
    this.isLoading = true;
    const customerId = this.route.snapshot.paramMap.get('id');
    
    if (customerId) {
      this.http.get<any>(`${environment.apiUrl}/dashboard/customers/${customerId}`).subscribe({
        next: (customer) => {
          this.customer = customer;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading customer:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  onEdit() {
    console.log('Edit customer:', this.customer);
  }
}
