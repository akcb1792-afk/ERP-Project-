import { Component, OnInit } from '@angular/core';
import { DashboardService, DashboardStats, RecentInvoice, RecentOrder, LowStockItem } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  title = 'ERP Dashboard';
  
  stats: DashboardStats = {
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

  recentInvoices: RecentInvoice[] = [];
  recentOrders: RecentOrder[] = [];
  lowStockItems: LowStockItem[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private dashboardService: DashboardService
  ) {
  }

  ngOnInit() {
    this.loadDashboardData();
    // Set up real-time updates every 30 seconds
    setInterval(() => {
      this.loadDashboardData();
    }, 30000);
  }

  loadDashboardData() {
    this.isLoading = true;
    this.error = null;

    // Load all dashboard data from API
    this.dashboardService.getDashboardData().subscribe(data => {
      this.stats = data.stats;
      this.recentInvoices = data.recentInvoices;
      this.recentOrders = data.recentOrders;
      this.lowStockItems = data.lowStockItems;
      this.isLoading = false;
    }, (error) => {
      this.error = 'Failed to load dashboard data';
      this.isLoading = false;
      console.error('Dashboard loading error:', error);
    });
  }

  refreshData() {
    this.loadDashboardData();
  }
}
