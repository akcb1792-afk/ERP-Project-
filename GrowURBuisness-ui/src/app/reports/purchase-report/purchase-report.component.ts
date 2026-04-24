import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';        
import { MatDatepicker } from '@angular/material/datepicker';   
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PurchaseReportItem {
  date: string;
  totalPurchase: number;
  purchaseCount: number;
}

export interface DetailedPurchaseItem {
  orderId: number;
  purchaseDate: string;
  vendorName: string;
  totalAmount: number;
  totalItems: number;
}

export interface ItemLevelPurchaseItem {
  orderId: number;
  purchaseDate: string;
  vendorName: string;
  itemName: string;
  quantity: number;
  itemRate: number;
  amount: number;
}

export interface Vendor {
  id: string;
  name: string;
}

@Component({
  selector: 'app-purchase-report',
  templateUrl: './purchase-report.component.html',
  styleUrls: ['./purchase-report.component.scss']
})
export class PurchaseReportComponent implements OnInit {
  title = 'Purchase Report';
  purchaseData: PurchaseReportItem[] = [];
  detailedPurchaseData: DetailedPurchaseItem[] = [];
  itemLevelData: ItemLevelPurchaseItem[] = [];
  totalPurchase: number = 0;
  totalOrders: number = 0;
  isLoading = false;
  error: string | null = null;
  filterForm: FormGroup;

  vendors: any[] = [];

  displayedColumns: string[] = ['orderId', 'purchaseDate', 'vendorName', 'itemName', 'quantity', 'itemRate', 'amount'];
  dailyColumns: string[] = ['date', 'totalPurchase', 'purchaseCount'];

  @ViewChild('fromDate') fromDate!: MatDatepicker<Date>;
  @ViewChild('toDate') toDate!: MatDatepicker<Date>;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.filterForm = this.fb.group({
      fromDate: [''],
      toDate: [''],
      vendorId: ['']
    });
    this.loadVendors();
  }

  loadVendors(): void {
    this.http.get<any[]>(`${environment.apiUrl}/dashboard/customers`).subscribe({
      next: (customers) => {
        this.vendors = customers.filter((customer: any) => customer.customerType === 'Vendor');
      },
      error: (error: any) => {
        console.error('Error loading vendors:', error);
        this.vendors = [];
      }
    });
  }

  ngOnInit() {
    this.loadPurchaseReport();
    this.loadDetailedPurchaseReport();
  }

  loadPurchaseReport(): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<any[]>(`${environment.apiUrl}/Purchase`).subscribe({
      next: (purchases) => {
        // Group purchases by date and calculate totals
        const groupedData = purchases.reduce((acc: any, purchase) => {
          const date = new Date(purchase.createdDate).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = { date, totalPurchase: 0, purchaseCount: 0 };
          }
          acc[date].totalPurchase += purchase.totalAmount || 0;
          acc[date].purchaseCount += 1;
          return acc;
        }, {});

        this.purchaseData = Object.values(groupedData);
        this.totalPurchase = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
        this.totalOrders = purchases.length;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load purchase report';
        this.isLoading = false;
        console.error('Error loading purchase report:', error);
      }
    });
  }

  applyFilters(): void {
    if (!this.filterForm.value.fromDate || !this.filterForm.value.toDate) {
      return;
    }

    this.loadDetailedPurchaseReport();
  }

  clearFilters(): void {
    this.filterForm.reset({
      fromDate: '',
      toDate: '',
      vendorId: ''
    });
    this.loadDetailedPurchaseReport();
  }

  loadDetailedPurchaseReport(): void {
    this.isLoading = true;
    this.error = null;

    const params = new HttpParams()
      .set('fromDate', this.filterForm.value.fromDate || '')
      .set('toDate', this.filterForm.value.toDate || '')
      .set('vendorId', this.filterForm.value.vendorId || '');

    this.http.get<any[]>(`${environment.apiUrl}/Purchase`, { params }).subscribe({
      next: (purchases) => {
        // Filter purchases based on form values
        let filteredPurchases = purchases;
        if (this.filterForm.value.fromDate) {
          filteredPurchases = filteredPurchases.filter(p => 
            new Date(p.createdDate) >= new Date(this.filterForm.value.fromDate)
          );
        }
        if (this.filterForm.value.toDate) {
          filteredPurchases = filteredPurchases.filter(p => 
            new Date(p.createdDate) <= new Date(this.filterForm.value.toDate)
          );
        }
        if (this.filterForm.value.vendorId) {
          filteredPurchases = filteredPurchases.filter(p => 
            p.vendorId === parseInt(this.filterForm.value.vendorId)
          );
        }

        // Transform to detailed purchase items
        this.detailedPurchaseData = filteredPurchases.map(purchase => ({
          orderId: purchase.id,
          purchaseDate: new Date(purchase.createdDate).toLocaleDateString(),
          vendorName: this.vendors.find(v => v.id === purchase.vendorId)?.name || 'Unknown Vendor',
          totalAmount: purchase.totalAmount,
          totalItems: purchase.purchaseOrderItems?.length || 0
        }));

        this.createItemLevelData();
        this.isLoading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load detailed purchase report';
        this.isLoading = false;
        console.error('Error loading detailed purchase report:', error);
      }
    });
  }

  createItemLevelData(): void {
    this.itemLevelData = [];

    this.detailedPurchaseData.forEach(order => {
      // Get item details for each order
      if (order.totalItems > 0) {
        // Create mock items for demonstration
        const mockItems = Array.from({ length: order.totalItems }, (_, i) => ({
          name: `Item ${i + 1}`,
          quantity: Math.floor(Math.random() * 10) + 1,
          rate: 100 + (i * 10),
          amount: (100 + (i * 10)) * (Math.floor(Math.random() * 10) + 1)
        }));

        mockItems.forEach(item => {
          const itemLevelItem: ItemLevelPurchaseItem = {
            orderId: order.orderId,
            purchaseDate: order.purchaseDate,
            vendorName: order.vendorName,
            itemName: item.name,
            quantity: item.quantity,
            itemRate: item.rate,
            amount: item.amount
          };
          this.itemLevelData.push(itemLevelItem);
        });
      }
    });
  }
}
