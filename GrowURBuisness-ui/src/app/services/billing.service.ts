import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Item {
  id: number;
  name: string;
  price: number;
  stockQuantity: number;
  category?: string;
}

export interface BillItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface CreateInvoiceRequest {
  customerId: number;
  paymentType: string;
  items: InvoiceItemRequest[];
}

export interface InvoiceItemRequest {
  itemId: number;
  quantity: number;
  price: number;
}

export interface InvoiceResponse {
  invoiceId: number;
  totalAmount: number;
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  searchItems(query: string): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.apiUrl}/items?search=${query}`);
  }

  getAllItems(): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.apiUrl}/billing/items`);
  }

  createInvoice(request: CreateInvoiceRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/billing/create`, request);
  }

  getInvoices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/billing/invoices`);
  }

  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Customer`);
  }

  getInvoiceById(invoiceId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/billing/invoices/${invoiceId}`);
  }

  deleteInvoice(invoiceId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/billing/invoices/${invoiceId}`);
  }
}
