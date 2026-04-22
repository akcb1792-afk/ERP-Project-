import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'https://localhost:7001/api'; // Update with your API URL

  constructor(private http: HttpClient) { }

  searchItems(query: string): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.apiUrl}/items?search=${query}`);
  }

  getAllItems(): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.apiUrl}/items`);
  }

  createInvoice(request: CreateInvoiceRequest): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(`${this.apiUrl}/billing/create`, request);
  }
}
