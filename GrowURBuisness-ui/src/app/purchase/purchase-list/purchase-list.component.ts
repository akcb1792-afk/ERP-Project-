import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-purchase-list',
  templateUrl: './purchase-list.component.html',
  styleUrls: ['./purchase-list.component.scss']
})
export class PurchaseListComponent implements OnInit {
  purchases: any[] = [];
  filteredPurchases: any[] = [];
  vendors: any[] = [];
  displayedColumns = ['id', 'createdDate', 'vendorName', 'itemName', 'itemCount', 'totalAmount', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>();
  isLoading = false;
  showDetailsModal = false;
  selectedPurchase: any;
  filterForm!: FormGroup;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder
  ) {
    this.initializeFilterForm();
  }

  ngOnInit(): void {
    this.loadVendors();
  }

  initializeFilterForm(): void {
    this.filterForm = this.formBuilder.group({
      orderId: [''],
      vendorId: [''],
      fromDate: [''],
      toDate: [''],
      minAmount: [''],
      maxAmount: ['']
    });
  }

  loadPurchases(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/Purchase`).subscribe({
      next: (purchases: any[]) => {
        this.purchases = purchases;
        this.filteredPurchases = purchases;
        this.dataSource.data = this.filteredPurchases.map(purchase => {
          // Find vendor name
          const vendor = this.vendors.find(v => v.id === purchase.vendorId);
          return {
            ...purchase,
            vendorName: vendor ? vendor.name : 'Not specified',
            itemCount: this.calculateTotalQuantity(purchase.purchaseOrderItems || []),
            totalAmount: purchase.totalAmount,
            createdDate: new Date(purchase.createdDate).toLocaleDateString(),
            itemName: this.getItemNames(purchase.purchaseOrderItems || []),
            items: purchase.purchaseOrderItems || [] // Add items array for view bill functionality
          };
        });
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading purchases:', error);
        this.snackBar.open('Failed to load purchases', 'Error', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        this.isLoading = false;
      }
    });
  }

  loadVendors(): void {
    this.http.get<any[]>(`${environment.apiUrl}/dashboard/customers`).subscribe({
      next: (customers: any[]) => {
        this.vendors = customers.filter((customer: any) => customer.CustomerType === 'Vendor');
        this.loadPurchases(); // Load purchases after vendors are loaded
      },
      error: (error: any) => {
        console.error('Error loading vendors:', error);
        this.snackBar.open('Failed to load vendors', 'Error', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        // Still try to load purchases even if vendors fail
        this.loadPurchases();
      }
    });
  }

  calculateTotal(items: any[]): number {
    return items.reduce((total, item) => total + (item.quantity * item.purchasePrice), 0);
  }

  calculateTotalQuantity(items: any[]): number {
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  getItemNames(items: any[]): string {
    if (!items || items.length === 0) {
      return 'No items';
    }
    
    const itemNames = items.map(purchaseItem => {
      // Get item name from the purchase order item
      const name = purchaseItem.item?.name || purchaseItem.itemName || purchaseItem.name || `Item ID: ${purchaseItem.itemId}`;
      return name;
    });
    
    if (itemNames.length === 1) {
      return itemNames[0];
    } else if (itemNames.length === 2) {
      return itemNames.join(' and ');
    } else {
      return `${itemNames[0]}, ${itemNames[1]} and ${itemNames.length - 2} more`;
    }
  }

  viewBill(purchase: any): void {
    this.openBillInNewWindow(purchase);
  }

  openBillInNewWindow(purchase: any): void {
    // Open a new window with the bill details
    const billWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
    
    if (!billWindow) {
      this.snackBar.open('Please allow popups to view the bill', 'Error', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    // Generate the bill HTML content
    const billContent = this.generateBillHTML(purchase);
    
    billWindow.document.write(billContent);
    billWindow.document.close();
    billWindow.focus();
  }

  generateBillHTML(purchase: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Bill #${purchase.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
          .bill-container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .bill-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1976d2; padding-bottom: 20px; }
          .bill-header h1 { margin: 0; color: #1976d2; font-size: 2rem; }
          .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .bill-info-left { flex: 1; }
          .bill-info-right { text-align: right; }
          .bill-info p { margin: 8px 0; color: #333; }
          .bill-info strong { color: #1976d2; }
          .items-section { margin-bottom: 30px; }
          .items-section h3 { margin: 0 0 20px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
          .items-table th { background-color: #f8f9fa; font-weight: 600; color: #333; }
          .items-table td:last-child, .items-table th:last-child { text-align: right; font-weight: 600; }
          .bill-total { text-align: right; margin-bottom: 30px; }
          .bill-total h3 { margin: 0; color: #1976d2; font-size: 1.8rem; }
          .status-badge { background-color: #e8f5e8; color: #2e7d32; padding: 6px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: 500; }
          .actions { text-align: center; margin-top: 30px; }
          .print-btn { background-color: #1976d2; color: white; padding: 12px 30px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin: 0 10px; }
          .print-btn:hover { background-color: #1565c0; }
          .close-btn { background-color: #6c757d; color: white; padding: 12px 30px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin: 0 10px; }
          .close-btn:hover { background-color: #5a6268; }
          @media print { body { background: white; } .actions { display: none; } }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="bill-header">
            <h1>Purchase Bill</h1>
          </div>
          
          <div class="bill-info">
            <div class="bill-info-left">
              <p><strong>Purchase ID:</strong> #${purchase.id}</p>
              <p><strong>Date:</strong> ${purchase.createdDate}</p>
              <p><strong>Vendor:</strong> ${purchase.vendorName || 'Not specified'}</p>
              <p><strong>Status:</strong> <span class="status-badge">${purchase.status}</span></p>
            </div>
            <div class="bill-info-right">
              <p><strong>Total Items:</strong> ${(purchase.items || []).length}</p>
            </div>
          </div>
          
          <div class="items-section">
            <h3>Items Purchased</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${(purchase.items || []).map((item: any) => `
                  <tr>
                    <td>${item.item?.name || 'Unknown Item'}</td>
                    <td>${item.quantity || 0}</td>
                    <td>${(item.unitPrice || 0).toFixed(2)}</td>
                    <td>${(item.totalAmount || (item.quantity * item.unitPrice)).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="bill-total">
            <h3>Total Amount: ${purchase.totalAmount.toFixed(2)}</h3>
          </div>
          
          <div class="actions">
            <button class="print-btn" onclick="window.print()">Print Bill</button>
            <button class="close-btn" onclick="window.close()">Close</button>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-style: italic;">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedPurchase = null;
  }

  calculateItemTotal(quantity: number, price: number): number {
    return quantity * price;
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    console.log('=== FILTER DEBUG ===');
    console.log('Filters applied:', filters);
    console.log('Total purchases before filter:', this.purchases.length);
    
    this.filteredPurchases = this.purchases.filter(purchase => {
      // Order ID filter
      if (filters.orderId && !purchase.id.toString().includes(filters.orderId)) {
        return false;
      }
      
      // Vendor filter
      if (filters.vendorId && purchase.vendorId !== parseInt(filters.vendorId)) {
        return false;
      }
      
      // Date range filter
      if (filters.fromDate) {
        const fromDate = new Date(filters.fromDate);
        const purchaseDate = new Date(purchase.createdDate);
        if (purchaseDate < fromDate) {
          return false;
        }
      }
      
      if (filters.toDate) {
        const toDate = new Date(filters.toDate);
        const purchaseDate = new Date(purchase.createdDate);
        if (purchaseDate > toDate) {
          return false;
        }
      }
      
      // Amount range filter
      const totalAmount = this.calculateTotal(purchase.items || []);
      if (filters.minAmount && totalAmount < parseFloat(filters.minAmount)) {
        return false;
      }
      
      if (filters.maxAmount && totalAmount > parseFloat(filters.maxAmount)) {
        return false;
      }
      
      return true;
    }));
    
    console.log('Filtered purchases count:', this.filteredPurchases.length);
    console.log('Filtered purchases:', this.filteredPurchases);
    
    // Update the data source
    this.dataSource.data = this.filteredPurchases.map(purchase => ({
      ...purchase,
      itemCount: this.calculateTotalQuantity(purchase.items || []),
      totalAmount: this.calculateTotal(purchase.items || []),
      createdDate: new Date(purchase.createdDate).toLocaleDateString(),
      itemName: this.getItemNames(purchase.items || [])
    }));
    
    this.snackBar.open(`Filters applied: ${this.filteredPurchases.length} orders found`, 'Success', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredPurchases = [...this.purchases];
    
    // Update the data source
    this.dataSource.data = this.filteredPurchases.map(purchase => ({
      ...purchase,
      itemCount: this.calculateTotalQuantity(purchase.items || []),
      totalAmount: this.calculateTotal(purchase.items || []),
      createdDate: new Date(purchase.createdDate).toLocaleDateString(),
      itemName: this.getItemNames(purchase.items || [])
    }));
    
    this.snackBar.open('Filters cleared', 'Success', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  getItemNameForBill(itemId: number): string {
    // Get item name from inventory service
    const inventoryItems = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
    const item = inventoryItems.find((item: any) => item.id === itemId);
    return item ? item.name : `Item ID: ${itemId}`;
  }

  printBill(): void {
    if (!this.selectedPurchase) {
      this.snackBar.open('No bill selected for printing', 'Error', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }
    
    // Try to open a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (!printWindow) {
      // Popup blocked - show user instructions
      this.snackBar.open('Please allow popups for this site to print the bill', 'Error', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Bill #${this.selectedPurchase.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .bill-header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .bill-info h2 { margin: 0; color: #333; }
          .bill-info p { margin: 5px 0; color: #666; }
          .bill-total { text-align: right; margin-top: 10px; }
          .bill-total h3 { margin: 0; color: #1976d2; font-size: 1.5rem; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .items-table th { background-color: #f5f5f5; font-weight: bold; }
          .items-table td:last-child, .items-table th:last-child { text-align: right; }
          .status-badge { background-color: #e8f5e8; color: #2e7d32; padding: 4px 12px; border-radius: 16px; font-size: 0.875rem; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="bill-header">
          <div class="bill-info">
            <h2>Purchase Bill</h2>
            <p><strong>Purchase ID:</strong> #${this.selectedPurchase.id}</p>
            <p><strong>Date:</strong> ${this.selectedPurchase.createdDate}</p>
            <p><strong>Status:</strong> <span class="status-badge">${this.selectedPurchase.status}</span></p>
          </div>
          <div class="bill-total">
            <h3>Total: ${this.selectedPurchase.totalAmount.toFixed(2)}</h3>
          </div>
        </div>
        
        <h3>Items Purchased</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${this.selectedPurchase.items.map((item: any) => `
              <tr>
                <td>${this.getItemNameForBill(item.itemId)}</td>
                <td>${item.quantity}</td>
                <td>${item.purchasePrice.toFixed(2)}</td>
                <td>${this.calculateItemTotal(item.quantity, item.purchasePrice).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="text-align: center; margin-top: 30px; color: #666;">
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for the content to load before printing
    setTimeout(() => {
      try {
        printWindow.print();
        printWindow.close();
        this.snackBar.open('Print dialog opened successfully', 'Success', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      } catch (error) {
        console.error('Print error:', error);
        this.snackBar.open('Print failed. Please check your printer settings.', 'Error', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    }, 500);
  }

  // Fallback method - create printable version in current window
  printBillFallback(): void {
    if (!this.selectedPurchase) return;
    
    // Create a temporary printable div
    const printDiv = document.createElement('div');
    printDiv.innerHTML = `
      <div style="font-family: Arial, sans-serif; margin: 20px;">
        <h2 style="text-align: center; color: #333;">Purchase Bill</h2>
        <div style="border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
          <p><strong>Purchase ID:</strong> #${this.selectedPurchase.id}</p>
          <p><strong>Date:</strong> ${this.selectedPurchase.createdDate}</p>
          <p><strong>Status:</strong> ${this.selectedPurchase.status}</p>
          <p style="text-align: right; font-size: 1.5rem; color: #1976d2;"><strong>Total: ${this.selectedPurchase.totalAmount.toFixed(2)}</strong></p>
        </div>
        <h3>Items Purchased</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Item Name</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Quantity</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Unit Price</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${this.selectedPurchase.items.map((item: any) => `
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd;">${this.getItemNameForBill(item.itemId)}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${item.purchasePrice.toFixed(2)}</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${this.calculateItemTotal(item.quantity, item.purchasePrice).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align: center; margin-top: 30px; color: #666;">
          <p>Thank you for your business!</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(printDiv);
    
    // Print the content
    window.print();
    
    // Remove the temporary div
    setTimeout(() => {
      document.body.removeChild(printDiv);
    }, 1000);
  }
}
