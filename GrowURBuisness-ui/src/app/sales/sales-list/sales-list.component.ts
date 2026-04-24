import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
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
  displayedColumns = ['invoiceNo', 'createdDate', 'customerName', 'itemCount', 'totalAmount', 'paymentType', 'status', 'actions'];
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
    console.log('=== LOADING SALES INVOICES ===');
    console.log('API URL:', `${environment.apiUrl}/billing/invoices`);
    
    this.http.get<any[]>(`${environment.apiUrl}/billing/invoices`).subscribe({
      next: (invoices) => {
        console.log('=== SALES INVOICES API RESPONSE ===');
        console.log('Sales List - Sales invoices loaded:', invoices.length); // Debug log
        console.log('Sales List - Raw sales data:', invoices); // Debug log
        console.log('Sales List - Available customers:', this.customers); // Debug log
        
        // Since main API doesn't include items, fetch detailed data for all invoices
        console.log('=== FETCHING DETAILED INVOICE DATA FOR ALL INVOICES ===');
        const detailedInvoices$ = invoices.map((invoice: any) => 
          this.http.get<any>(`${environment.apiUrl}/billing/invoices/${invoice.id}`)
        );
        
        // Use forkJoin to wait for all detailed invoice requests to complete
        forkJoin(detailedInvoices$).subscribe({
          next: (detailedInvoicesArray: any[]) => {
            console.log('=== ALL DETAILED INVOICES LOADED ===');
            console.log('Detailed invoices array:', detailedInvoicesArray);
            
            // Process sales data with detailed invoice information
            this.sales = detailedInvoicesArray.map((detailedInvoice: any, index: number) => {
              console.log(`Processing detailed invoice ${index}:`, detailedInvoice);
              
              // Find customer with enhanced lookup
              const customerId = detailedInvoice.customerId || detailedInvoice.customer_id || detailedInvoice.CustomerId;
              const customer = this.customers.find((c: any) => {
                const cId = c.id || c.customerId || c.Id || c.CustomerId;
                return cId?.toString() === customerId?.toString() || 
                       cId === customerId ||
                       parseInt(cId) === parseInt(customerId);
              });
              
              let customerName = 'Unknown Customer';
              if (customer) {
                customerName = customer.name || customer.customerName || customer.CustomerName || customer.customer_name || 'Unknown Customer';
              } else if (detailedInvoice.customerName || detailedInvoice.CustomerName || detailedInvoice.customer_name) {
                customerName = detailedInvoice.customerName || detailedInvoice.CustomerName || detailedInvoice.customer_name;
              } else if (detailedInvoice.customer?.name || detailedInvoice.customer?.customerName) {
                customerName = detailedInvoice.customer?.name || detailedInvoice.customer?.customerName;
              }
              
              // Get items from detailed invoice
              const items = detailedInvoice.items || detailedInvoice.invoiceItems || detailedInvoice.InvoiceItems || detailedInvoice.itemsList || detailedInvoice.Items || [];
              console.log(`Detailed invoice ${index} - Items:`, items);
              
              // Calculate item count
              const itemCount = items && Array.isArray(items) ? items.length : 0;
              console.log(`Detailed invoice ${index} - Item count:`, itemCount);
              
              return {
                ...detailedInvoice,
                customerName: customerName,
                items: items,
                itemCount: itemCount,
                createdDate: detailedInvoice.createdDate || detailedInvoice.invoiceDate || detailedInvoice.date || new Date().toISOString()
              };
            });
            
            console.log('Sales List - Final processed sales data with items:', this.sales);
            this.filteredSales = this.sales;
            this.dataSource.data = this.filteredSales;
            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('Error loading detailed invoices:', error);
            this.isLoading = false;
          }
        });
      },
      error: (error: any) => {
        console.error('Error loading sales:', error);
        this.isLoading = false;
      }
    });
  }

  loadCustomers(): void {
    console.log('Sales List - Loading customers...'); // Debug log
    this.http.get<any[]>(`${environment.apiUrl}/Customer`).subscribe((customers: any[]) => {
      // Don't filter customers initially - load all and debug
      this.customers = customers;
      console.log('Sales List - All customers loaded:', customers.length); // Debug log
      console.log('Sales List - Raw customers data:', customers); // Debug log
      
      // Log each customer structure for debugging
      customers.forEach((customer: any, index: number) => {
        console.log(`Customer ${index}:`, {
          id: customer.id,
          customerId: customer.customerId,
          Id: customer.Id,
          CustomerId: customer.CustomerId,
          name: customer.name,
          customerName: customer.customerName,
          CustomerName: customer.CustomerName,
          customerType: customer.customerType,
          type: customer.type
        });
      });
      
      // Filter for customers only after logging
      const customerOnly = customers.filter((customer: any) => 
        customer.customerType === 'Customer' || 
        customer.type === 'Customer' ||
        customer.CustomerType === 'Customer' ||
        customer.Type === 'Customer' ||
        !customer.customerType && !customer.type // Include if no type specified
      );
      console.log('Sales List - Filtered customers:', customerOnly);
      
      // Use filtered customers but keep all for debugging
      this.customers = customerOnly;
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

  getItemCount(items: any): number {
    return (items && Array.isArray(items)) ? items.length : 0;
  }

  getItemDisplayCount(invoice: any): string {
    // Use the itemCount from processed data first, then fallback to items length
    if (invoice.itemCount !== undefined) {
      console.log(`DISPLAY - Using itemCount: ${invoice.itemCount} for invoice ${invoice.id}`);
      return invoice.itemCount.toString();
    }
    
    // Fallback to items length
    const items = invoice.items || invoice.invoiceItems || invoice.InvoiceItems || [];
    const itemCount = items && Array.isArray(items) ? items.length : 0;
    console.log(`DISPLAY - Using items length: ${itemCount} for invoice ${invoice.id}`);
    return itemCount.toString();
  }

  calculateInvoiceTotal(invoice: any): number {
    // Try different item field names
    const items = invoice.items || invoice.invoiceItems || invoice.InvoiceItems || [];
    
    if (!Array.isArray(items) || items.length === 0) {
      // Try alternative data structure or return 0
      return invoice.totalAmount || invoice.total || 0;
    }
    
    return items.reduce((total: number, item: any) => {
      const quantity = item.quantity || 0;
      const price = item.price || item.salePrice || item.unitPrice || 0;
      return total + (quantity * price);
    }, 0);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', dateString);
      return 'Invalid Date';
    }
  }

  
  applyFilters(): void {
    const filters = this.filterForm.value;
    console.log('Applying filters:', filters);
    console.log('Sales data before filtering:', this.sales);
    
    this.filteredSales = this.sales.filter(invoice => {
      // Invoice Number filter
      const invoiceNo = invoice.invoiceNo || invoice.invoiceNumber || invoice.InvoiceNo || invoice.InvoiceNumber;
      if (filters.invoiceId && filters.invoiceId.trim() !== '') {
        if (!invoiceNo || !invoiceNo.toString().toLowerCase().includes(filters.invoiceId.toLowerCase().trim())) {
          return false;
        }
      }
      
      // Customer filter
      if (filters.customerId && filters.customerId !== '') {
        if (invoice.customerId !== parseInt(filters.customerId)) {
          return false;
        }
      }
      
      // Date range filter - improved date handling
      if (filters.fromDate) {
        const invoiceDate = new Date(invoice.createdDate);
        const fromDate = new Date(filters.fromDate);
        if (!isNaN(invoiceDate.getTime()) && !isNaN(fromDate.getTime()) && invoiceDate < fromDate) {
          return false;
        }
      }
      if (filters.toDate) {
        const invoiceDate = new Date(invoice.createdDate);
        const toDate = new Date(filters.toDate);
        if (!isNaN(invoiceDate.getTime()) && !isNaN(toDate.getTime()) && invoiceDate > toDate) {
          return false;
        }
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
      if (filters.paymentType && filters.paymentType !== '') {
        if (invoice.paymentType !== filters.paymentType) {
          return false;
        }
      }
      
      return true;
    });
    
    console.log('Filtered sales data:', this.filteredSales);
    this.dataSource.data = this.filteredSales;
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredSales = [...this.sales];
    this.dataSource.data = this.filteredSales;
  }

  viewBill(invoice: any): void { // View bill method
    console.log('View Bill clicked - Invoice object:', invoice);
    console.log('View Bill clicked - Invoice ID:', invoice.id);
    
    // Fetch detailed invoice data with items
    console.log('Fetching detailed invoice from:', `${environment.apiUrl}/billing/invoices/${invoice.id}`);
    this.http.get<any>(`${environment.apiUrl}/billing/invoices/${invoice.id}`).subscribe({
      next: (detailedInvoice) => {
        console.log('=== DETAILED INVOICE DEBUG ===');
        console.log('Detailed invoice fetched:', detailedInvoice);
        console.log('Detailed invoice type:', typeof detailedInvoice);
        console.log('Detailed invoice keys:', Object.keys(detailedInvoice));
        console.log('Detailed invoice items:', detailedInvoice.items);
        console.log('Detailed invoice invoiceItems:', detailedInvoice.invoiceItems);
        console.log('Detailed invoice InvoiceItems:', detailedInvoice.InvoiceItems);
        console.log('Detailed invoice items type:', typeof detailedInvoice.items);
        console.log('Detailed invoice items isArray:', Array.isArray(detailedInvoice.items));
        
        // Check all possible item fields
        const allItemFields = ['items', 'invoiceItems', 'InvoiceItems', 'itemsList', 'Items'];
        allItemFields.forEach(field => {
          if (detailedInvoice[field]) {
            console.log(`Found items in field '${field}':`, detailedInvoice[field]);
            console.log(`Field '${field}' is array:`, Array.isArray(detailedInvoice[field]));
            console.log(`Field '${field}' length:`, detailedInvoice[field]?.length);
          }
        });
        
        // Use the detailed invoice data with items
        this.openBillInNewWindow(detailedInvoice);
      },
      error: (error) => {
        console.error('=== ERROR FETCHING DETAILED INVOICE ===');
        console.error('Error fetching detailed invoice:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        
        // Fallback to original invoice data
        console.log('Using fallback invoice data:', invoice);
        this.openBillInNewWindow(invoice);
      }
    });
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
    console.log('Generating bill for invoice:', invoice); // Debug log
    
    // Find customer with enhanced lookup
    const customer = this.customers.find(c => {
      const cId = c.id || c.customerId || c.Id || c.CustomerId;
      const invoiceCustomerId = invoice.customerId || invoice.customer_id || invoice.CustomerId;
      return cId?.toString() === invoiceCustomerId?.toString() || 
             cId === invoiceCustomerId ||
             parseInt(cId) === parseInt(invoiceCustomerId);
    });
    
    const customerName = customer ? (customer.name || customer.customerName || customer.CustomerName) : 'Walk-in Customer';
    const currentDate = new Date().toLocaleDateString();
    
    // Get invoice number for display
    const invoiceNo = invoice.invoiceNo || invoice.invoiceNumber || invoice.InvoiceNo || invoice.InvoiceNumber || invoice.id;
    
    // Get items with better handling
    const items = invoice.items || invoice.invoiceItems || invoice.InvoiceItems || [];
    console.log('Items for bill generation:', items);
    
    let itemsHtml = '';
    if (items && items.length > 0) {
      itemsHtml = items.map((item: any, index: number) => {
        const itemName = item.name || item.itemName || item.ItemName || 'Item';
        const quantity = item.quantity || 0;
        const price = item.price || item.salePrice || item.unitPrice || 0;
        
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${itemName}</td>
            <td>${quantity}</td>
            <td>${price.toFixed(2)}</td>
            <td>${(quantity * price).toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    } else {
      itemsHtml = '<tr><td colspan="5" style="text-align: center; color: #999;">No items found</td></tr>';
    }

    // Calculate total amount
    const totalAmount = items.reduce((total: number, item: any) => {
      const quantity = item.quantity || 0;
      const price = item.price || item.salePrice || item.unitPrice || 0;
      return total + (quantity * price);
    }, 0);

    console.log('Generated bill total:', totalAmount);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Invoice #${invoiceNo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .invoice-info { margin-bottom: 20px; }
          .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .invoice-table th { background-color: #f2f2f2; font-weight: bold; }
          .total-section { text-align: right; font-weight: bold; margin-top: 20px; }
          .action-buttons { text-align: center; margin-top: 30px; }
          .btn { padding: 10px 20px; margin: 0 10px; border: none; border-radius:4px; cursor: pointer; }
          .print-btn { background-color: #1976d2; color: white; }
          .close-btn { background-color: #f44336; color: white; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SALES INVOICE</h1>
          <h2>Invoice #${invoiceNo}</h2>
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
        
        <div class="action-buttons">
          <button class="btn print-btn" onclick="window.print()">Print</button>
          <button class="btn close-btn" onclick="window.close()">Close</button>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
