import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  totalOrders: number;
  totalQuantitySold: number;
  totalPurchase: number;
  todaysTotal: number;
  inventoryCount: number;
  totalAmount: number;
  totalCustomers: number;
  totalInvoices: number;
  totalRevenue: number;
  totalSalesQuantity: number;
  totalPurchaseQuantity: number;
  totalSalesValue: number;
  totalPurchaseValue: number;
  profit: number;
  lowStockItems: number;
  pendingInvoices: number;
  purchaseOrders?: number;
  salesOrders?: number;
}

export interface RecentInvoice {
  id: number;
  customer: string;
  amount: number;
  date: Date;
  items: number;
  status: string;
}

export interface RecentOrder {
  id: string;
  customer: string;
  amount: number;
  date: Date;
  items: number;
  status: string;
}

export interface LowStockItem {
  name: string;
  stock: number;
  category: string;
  price: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get dashboard statistics from API
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  // Get recent invoices from API
  getRecentInvoices(): Observable<RecentInvoice[]> {
    return this.http.get<RecentInvoice[]>(`${this.apiUrl}/dashboard/recent-invoices`);
  }

  // Get recent orders from API
  getRecentOrders(): Observable<RecentOrder[]> {
    return this.http.get<RecentOrder[]>(`${this.apiUrl}/dashboard/recent-orders`);
  }

  // Get low stock items from API
  getLowStockItems(): Observable<LowStockItem[]> {
    return this.http.get<LowStockItem[]>(`${this.apiUrl}/dashboard/low-stock`);
  }

  // Get complete dashboard data
  getDashboardData(): Observable<any> {
    return forkJoin({
      stats: this.getDashboardStats(),
      recentInvoices: this.getRecentInvoices(),
      recentOrders: this.getRecentOrders(),
      lowStockItems: this.getLowStockItems()
    });
  }

  async getDashboardStatsData(): Promise<DashboardStats> {
    const stats = await this.getDashboardStats().toPromise();
    const orders = await this.http.get<any[]>(`${this.apiUrl}/purchase-orders`).toPromise();
    const invoices = await this.http.get<any[]>(`${this.apiUrl}/sales-orders`).toPromise();

    const statsData = stats || {
      totalOrders: 0,
      totalQuantitySold: 0,
      totalPurchase: 0,
      todaysTotal: 0,
      inventoryCount: 0,
      totalAmount: 0,
      totalCustomers: 0,
      totalInvoices: 0,
      totalRevenue: 0,
      totalSalesQuantity: 0,
      totalPurchaseQuantity: 0,
      totalSalesValue: 0,
      totalPurchaseValue: 0,
      profit: 0,
      lowStockItems: 0,
      pendingInvoices: 0
    };

    return {
      totalOrders: statsData.totalOrders || 0,
      totalQuantitySold: statsData.totalQuantitySold || 0,
      totalPurchase: statsData.totalPurchase || 0,
      todaysTotal: statsData.todaysTotal || 0,
      inventoryCount: statsData.inventoryCount || 0,
      totalAmount: statsData.totalAmount || 0,
      totalCustomers: statsData.totalCustomers || 0,
      totalInvoices: statsData.totalInvoices || 0,
      totalRevenue: statsData.totalRevenue || 0,
      totalSalesQuantity: statsData.totalSalesQuantity || 0,
      totalPurchaseQuantity: statsData.totalPurchaseQuantity || 0,
      totalSalesValue: statsData.totalSalesValue || 0,
      totalPurchaseValue: statsData.totalPurchaseValue || 0,
      profit: statsData.profit || 0,
      lowStockItems: statsData.lowStockItems || 0,
      pendingInvoices: statsData.pendingInvoices || 0,
      purchaseOrders: orders?.length || 0,
      salesOrders: invoices?.length || 0
    };
  }

  getPurchaseOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/purchase-orders`);
  }

  getSalesOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sales-orders`);
  }

  // Dashboard Summary API
  async getDashboardSummary(): Promise<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard-summary`).toPromise();
  }

}
