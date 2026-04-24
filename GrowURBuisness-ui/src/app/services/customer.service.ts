import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private baseUrl = `${environment.apiUrl}/dashboard/customers`;

  constructor(private http: HttpClient) {}

  // Customers Management
  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}`);
  }

  getCustomer(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  addCustomer(customer: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, customer);
  }

  updateCustomer(id: number, customer: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, customer);
  }

  deleteCustomer(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  // Search and Filter
  searchCustomers(query: string): Observable<any[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<any[]>(`${this.baseUrl}/search`, { params });
  }

  getCustomersByType(customerType: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/type/${customerType}`);
  }

  // Customer Statistics
  getCustomerStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats`);
  }

  // Customer Orders
  getCustomerOrders(customerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${customerId}/orders`);
  }

  // Customer Invoices
  getCustomerInvoices(customerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${customerId}/invoices`);
  }
}
