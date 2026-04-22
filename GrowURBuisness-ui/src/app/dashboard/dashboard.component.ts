import { Component, OnInit } from '@angular/core';
import { DashboardService, DashboardStats, RecentInvoice, RecentOrder, LowStockItem } from '../services/dashboard.service';
import { DatabaseService } from '../services/database.service';

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

  // Enhanced metrics for dashboard
  todaySales: number = 0;
  todayPurchase: number = 0;
  monthlySales: number = 0;
  monthlyPurchase: number = 0;
  lowStockItemsCount: number = 0;

  purchaseOrders: any[] = [];
  salesOrders: any[] = [];
  lowStockItems: any[] = [];
  recentInvoices: any[] = [];
  recentOrders: any[] = [];
  customers: any[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private dashboardService: DashboardService,
    private databaseService: DatabaseService
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

    // Load customers first
    this.databaseService.getCustomersByType('Customer').subscribe(customers => {
      this.customers = customers;
      
      // Load real data from database
      this.calculateRealData();
      
      // Load all dashboard data in parallel
      Promise.all([
        this.loadStats(),
        this.loadRecentInvoices(),
        this.loadRecentOrders(),
        this.loadLowStockItems(),
        this.loadPurchaseOrders(),
        this.loadSalesOrders()
      ]).then(() => {
        this.isLoading = false;
      }).catch((error) => {
        this.error = 'Failed to load dashboard data';
        this.isLoading = false;
        console.error('Dashboard loading error:', error);
      });
    });
  }

  calculateRealData() { // Calculate real dashboard data
    // Get today's date
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Get current month dates
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Calculate today's sales
    this.databaseService.getSales().subscribe(sales => {
      const todaySalesData = sales.filter(sale => {
        const saleDate = new Date(sale.createdDate);
        return saleDate >= todayStart && saleDate < todayEnd;
      });
      
      this.todaySales = todaySalesData.reduce((total: number, sale: any) => {
        return total + sale.items.reduce((itemTotal: number, item: any) => itemTotal + (item.quantity * item.price), 0);
      }, 0);

      // Calculate monthly sales
      const monthlySalesData = sales.filter(sale => {
        const saleDate = new Date(sale.createdDate);
        return saleDate >= monthStart && saleDate <= monthEnd;
      });
      
      this.monthlySales = monthlySalesData.reduce((total: number, sale: any) => {
        return total + sale.items.reduce((itemTotal: number, item: any) => itemTotal + (item.quantity * item.price), 0);
      }, 0);
    });

    // Calculate today's and monthly purchases
    this.databaseService.getPurchases().subscribe(purchases => {
      console.log('Dashboard - Raw purchases data:', purchases); // Debug log
      console.log('Dashboard - Purchases count:', purchases.length); // Debug log
      
      const todayPurchaseData = purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.createdDate);
        return purchaseDate >= todayStart && purchaseDate < todayEnd;
      });
      
      console.log('Dashboard - Today purchases:', todayPurchaseData); // Debug log
      
      this.todayPurchase = todayPurchaseData.reduce((total: number, purchase: any) => {
        const purchaseTotal = purchase.items.reduce((itemTotal: number, item: any) => itemTotal + (item.quantity * (item.purchasePrice || item.price || 0)), 0);
        console.log('Dashboard - Purchase total for one item:', purchaseTotal); // Debug log
        return total + purchaseTotal;
      }, 0);

      // Calculate monthly purchases
      const monthlyPurchaseData = purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.createdDate);
        return purchaseDate >= monthStart && purchaseDate <= monthEnd;
      });
      
      console.log('Dashboard - Monthly purchases:', monthlyPurchaseData); // Debug log
      
      this.monthlyPurchase = monthlyPurchaseData.reduce((total: number, purchase: any) => {
        const purchaseTotal = purchase.items.reduce((itemTotal: number, item: any) => itemTotal + (item.quantity * (item.purchasePrice || item.price || 0)), 0);
        console.log('Dashboard - Monthly purchase total for one item:', purchaseTotal); // Debug log
        return total + purchaseTotal;
      }, 0);
      
      console.log('Dashboard - Final today purchase:', this.todayPurchase); // Debug log
      console.log('Dashboard - Final monthly purchase:', this.monthlyPurchase); // Debug log
    });

    // Calculate low stock items (quantity < 20) - matching the list logic
    this.databaseService.getInventoryItems().subscribe(items => {
      this.lowStockItemsCount = items.filter(item => {
        const stock = item.stock || item.stockQuantity || 0;
        return stock > 0 && stock < 20; // Show items with stock between 1-19 (same as list)
      }).length;
    });
  }

  private async loadStats(): Promise<void> {
    try {
      const result = await this.dashboardService.getDashboardSummary();
      this.stats = result || this.stats;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  private async loadRecentInvoices(): Promise<void> {
    try {
      this.dashboardService.getRecentInvoices().subscribe(invoices => {
        this.recentInvoices = invoices;
      });
    } catch (error) {
      console.error('Error loading recent invoices:', error);
    }
  }

  private async loadRecentOrders(): Promise<void> {
    try {
      this.dashboardService.getRecentOrders().subscribe(orders => {
        this.recentOrders = orders;
      });
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  }

  private async loadLowStockItems(): Promise<void> {
    this.databaseService.getInventoryItems().subscribe(items => {
      // Sort by stock quantity ascending and take lowest 10 items with stock > 0
      this.lowStockItems = items
        .filter(item => {
          const stock = item.stock || item.stockQuantity || 0;
          return stock > 0 && stock < 20; // Show items with stock between 1-19
        })
        .sort((a, b) => {
          const stockA = a.stock || a.stockQuantity || 0;
          const stockB = b.stock || b.stockQuantity || 0;
          return stockA - stockB; // Sort by lowest stock first
        })
        .slice(0, 10);
      console.log('Dashboard - Low stock items loaded:', this.lowStockItems);
    });
  }

  private async loadPurchaseOrders(): Promise<void> {
    this.databaseService.getPurchases().subscribe(purchases => {
      // Sort by date descending and take latest 5
      this.purchaseOrders = purchases
        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
        .slice(0, 10)
        .map(purchase => ({
          ...purchase,
          vendorName: 'Vendor', // Default vendor name since we don't have vendor data
          totalAmount: purchase.items.reduce((total: number, item: any) => 
            total + (item.quantity * (item.purchasePrice || item.price || 0)), 0),
          itemCount: purchase.items.length,
          totalQuantity: purchase.items.reduce((total: number, item: any) => total + item.quantity, 0)
        }));
      console.log('Dashboard - Purchase orders loaded:', this.purchaseOrders);
    });
  }

  private async loadSalesOrders(): Promise<void> {
    this.databaseService.getSales().subscribe(sales => {
      // Sort by date descending and take latest 5
      this.salesOrders = sales
        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
        .slice(0, 10)
        .map((sale: any) => {
          const customer = this.customers.find((c: any) => c.id === sale.customerId);
          return {
            ...sale,
            customerName: customer ? customer.name : 'Walk-in Customer',
            totalAmount: sale.items.reduce((total: number, item: any) => 
              total + (item.quantity * item.price), 0),
            itemCount: sale.items.length,
            totalQuantity: sale.items.reduce((total: number, item: any) => total + item.quantity, 0)
          };
        });
      console.log('Dashboard - Sales orders loaded:', this.salesOrders);
    });
  }


  refreshData(): void {
    this.loadDashboardData();
  }
}
