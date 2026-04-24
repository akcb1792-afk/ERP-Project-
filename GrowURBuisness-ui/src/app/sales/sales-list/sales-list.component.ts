import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.scss']
})
export class SalesListComponent implements OnInit {
  sales: any[] = [];
  filteredSales: any[] = [];
  customers: any[] = [];
  dataSource: MatTableDataSource<any>;
  displayedColumns = ['id', 'createdDate', 'customerName', 'itemCount', 'totalAmount', 'paymentType', 'status', 'actions'];
  isLoading = false;
  filterForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
    this.dataSource = new MatTableDataSource<any>();
    this.filterForm = this.fb.group({
      invoiceId: [''],
      customerId: [''],
      fromDate: [''],
      toDate: [''],
      minAmount: [''],
      maxAmount: [''],
      paymentType: ['']
    });
  }

  ngOnInit(): void {
    console.log('Sales List Component - ngOnInit called'); // Debug log
    console.log('Sales List Component - Initial state:', {
      sales: this.sales.length,
      filteredSales: this.filteredSales.length,
      isLoading: this.isLoading
    }); // Debug log
    
    this.loadCustomers();
    // Load sales after customers are loaded to ensure proper customer name mapping
    setTimeout(() => {
      this.loadSalesInvoices();
    }, 100);
  }

  loadSalesInvoices(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/dashboard/invoices`).subscribe({
      next: (invoices) => {
        console.log('Sales List - Sales invoices loaded:', invoices.length); // Debug log
        console.log('Sales List - Sales data:', invoices); // Debug log
        
        // Process sales data to ensure customer names are included
        this.sales = invoices.map(invoice => {
          const customer = this.customers.find(c => c.id === invoice.customerId);
          return {
            ...invoice,
            customerName: customer ? customer.name : 'Walk-in Customer'
          };
        });
        
        console.log('Sales List - Processed sales data:', this.sales); // Debug log
        this.filteredSales = this.sales;
        this.dataSource.data = this.filteredSales;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sales:', error);
        this.isLoading = false;
      }
    });
  }

  loadCustomers(): void {
    console.log('Sales List - Loading customers...'); // Debug log
    this.http.get<any[]>(`${environment.apiUrl}/dashboard/customers`).subscribe((customers: any[]) => {
      this.customers = customers.filter((customer: any) => customer.customerType === 'Customer');
      console.log('Sales List - Customers loaded:', customers.length); // Debug log
      console.log('Sales List - Customers data:', customers); // Debug log
    }, (error: any) => {
      console.error('Error loading customers:', error);
      this.isLoading = false;
    });
  }

  // Method to create sample data for testing
  createTestData(): void {
    // This method is deprecated - use actual API calls for testing
    console.log('Test data creation disabled - use real API data');
  }

  calculateInvoiceTotal(invoice: any): number {
    if (!invoice.items) return 0;
    return invoice.items.reduce((total: number, item: any) => total + (item.quantity * item.price), 0);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredSales = this.sales.filter(invoice => {
      // Invoice ID filter
      if (filters.invoiceId && !invoice.id.toString().includes(filters.invoiceId)) {
        return false;
      }
      
      // Customer filter
      if (filters.customerId && invoice.customerId !== parseInt(filters.customerId)) {
        return false;
      }
      
      // Date range filter
      if (filters.fromDate && new Date(invoice.createdDate) < new Date(filters.fromDate)) {
        return false;
      }
      if (filters.toDate && new Date(invoice.createdDate) > new Date(filters.toDate)) {
        return false;
      }
      
      // Amount range filter
      const invoiceTotal = this.calculateInvoiceTotal(invoice);
      if (filters.minAmount && invoiceTotal < parseFloat(filters.minAmount)) {
        return false;
      }
      if (filters.maxAmount && invoiceTotal > parseFloat(filters.maxAmount)) {
        return false;
      }
      
      // Payment type filter
      if (filters.paymentType && invoice.paymentType !== filters.paymentType) {
        return false;
      }
      
      return true;
    });
    
    this.dataSource.data = this.filteredSales;
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredSales = [...this.sales];
    this.dataSource.data = this.filteredSales;
  }

  viewBill(invoice: any): void { // View bill method
    this.openBillInNewWindow(invoice);
  }

  openBillInNewWindow(invoice: any): void {
    const billContent = this.generateBillContent(invoice);
    const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (newWindow) {
      newWindow.document.write(billContent);
      newWindow.document.close();
      newWindow.focus();
    }
  }

  generateBillContent(invoice: any): string {
    const customer = this.customers.find(c => c.id === invoice.customerId);
    const customerName = customer ? customer.name : 'Walk-in Customer';
    const currentDate = new Date().toLocaleDateString();
    
    let itemsHtml = invoice.items.map((item: any, index: number) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.name || 'Item'}</td>
        <td>${item.quantity}</td>
        <td>${item.price.toFixed(2)}</td>
        <td>${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `).join('');

    const totalAmount = invoice.items.reduce((total: number, item: any) => total + (item.quantity * item.price), 0);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Invoice #${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .invoice-info { margin-bottom: 20px; }
          .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .invoice-table th { background-color: #f2f2f2; font-weight: bold; }
          .total-section { text-align: right; font-weight: bold; margin-top: 20px; }
          .footer { margin-top: 30px; text-align: center; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SALES INVOICE</h1>
          <h2>Invoice #${invoice.id}</h2>
        </div>
        
        <div class="invoice-info">
          <p><strong>Date:</strong> ${currentDate}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Payment Type:</strong> ${invoice.paymentType}</p>
          <p><strong>Status:</strong> ${invoice.status}</p>
        </div>
        
        <table class="invoice-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="total-section">
          <p>Total Amount: ${totalAmount.toFixed(2)}</p>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is a computer-generated invoice</p>
          
          <div class="action-buttons" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="margin-right: 10px; padding: 10px 20px; background-color: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
              <i>Print</i>
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
              <i>Close</i>
            </button>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
