import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SalesReportItem {
  invoiceNumber: string;
  customerName: string;
  total: number;
  date: string;
}

export interface PurchaseReportItem {
  invoiceNumber: string;
  vendorName: string;
  total: number;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Sales Report API
  getSalesReport(fromDate?: string, toDate?: string, customerId?: string): Observable<SalesReportItem[]> {
    let url = `${this.apiUrl}/reports/sales`;
    const params = new URLSearchParams();
    
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    if (customerId) params.set('customerId', customerId);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.http.get<SalesReportItem[]>(url);
  }

  // Purchase Report API
  getPurchaseReport(fromDate?: string, toDate?: string, vendorId?: string): Observable<any> {
    let url = `${this.apiUrl}/reports/purchase`;
    const params = new URLSearchParams();
    
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    if (vendorId) params.set('vendorId', vendorId);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.http.get<any>(url);
  }

  // Detailed Purchase Report API
  getDetailedPurchaseReport(fromDate?: string, toDate?: string, vendorId?: string): Observable<any[]> {
    let url = `${this.apiUrl}/reports/purchase/detailed`;
    const params = new URLSearchParams();
    
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    if (vendorId) params.set('vendorId', vendorId);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.http.get<any[]>(url);
  }

  // Purchase Items API
  getPurchaseItems(orderId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/purchase/items/${orderId}`);
  }

  // Dashboard Summary API
  getDashboardSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard-summary`);
  }

  // Inventory Report API
  getInventoryReport(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/inventory`);
  }
}
