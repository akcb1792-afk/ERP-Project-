import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private baseUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) {}

  // Items Management
  getItems(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/items`);
  }

  getItem(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/items/${id}`);
  }

  addItem(item: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/items`, item);
  }

  updateItem(id: number, item: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/items/${id}`, item);
  }

  deleteItem(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/items/${id}`);
  }

  // Categories Management
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categories`);
  }

  addCategory(category: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/categories`, category);
  }

  updateCategory(id: number, category: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/categories/${id}`);
  }

  // Stock Management
  getStockTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/stock-transactions`);
  }

  addStockTransaction(transaction: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/stock-transactions`, transaction);
  }

  getCurrentStock(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/current-stock`);
  }

  // Low Stock Items
  getLowStockItems(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/low-stock`);
  }

  // Search and Filter
  searchItems(query: string): Observable<any[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<any[]>(`${this.baseUrl}/search`, { params });
  }

  getItemsByCategory(categoryId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/items/category/${categoryId}`);
  }
}
