import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { DatabaseService } from '../../services/database.service';
import { MatTableDataSource } from '@angular/material/table';

// Define interfaces locally
interface Item {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  displayName?: string; // Optional display name with price and stock info
}

interface BillItem {
  id: number;
  name: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  total: number;
  profit: number;
}

interface CreateInvoiceRequest {
  customerId: number;
  paymentType: string;
  items: {
    itemId: number;
    quantity: number;
    price: number;
  }[];
}

@Component({
  selector: 'app-invoice-create',
  templateUrl: './invoice-create.component.html',
  styleUrls: ['./invoice-create.component.scss']
})
export class InvoiceCreateComponent implements OnInit {
  title = 'Create Invoice';
  
  billForm: FormGroup;
  searchQuery = '';
  filteredItems: Item[] = [];
  availableItems: Item[] = [];
  billItems: BillItem[] = [];
  selectedPaymentType = 'Cash';
  totalAmount = 0;
  isLoading = false;
  customers: any[] = [];
  selectedCustomer: any = null;
  selectedItem: Item | null = null;
  dataSource: MatTableDataSource<BillItem>;
  
  paymentTypes = ['Cash', 'UPI', 'Credit'];
  displayedColumns = ['itemName', 'quantity', 'purchasePrice', 'salePrice', 'total', 'profit', 'actions'];
  
  private searchSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private databaseService: DatabaseService
  ) {
    this.dataSource = new MatTableDataSource<BillItem>(this.billItems);
    this.billForm = this.fb.group({
      customerId: [''],
      itemId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      salePrice: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    // Load all items for dropdown
    this.loadItems();
    
    // Load customers
    this.loadCustomers();
    
    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.filterItems(query);
    });
  }

  loadCustomers(): void {
    this.databaseService.getActiveCustomersByType('Customer').subscribe(customers => {
      this.customers = customers;
    });
  }

  onCustomerChange(): void {
    const customerId = this.billForm.get('customerId')?.value;
    if (customerId) {
      this.selectedCustomer = this.customers.find(c => c.id === parseInt(customerId));
    } else {
      this.selectedCustomer = null;
    }
  }

  loadItems(): void {
    this.isLoading = true;
    this.databaseService.getInventoryItems().subscribe({
      next: (items) => {
        // Filter out items with zero stock and prepare display data
        this.availableItems = items.filter(item => item.stock > 0); // Only show items with stock > 0
        this.filteredItems = this.availableItems
          .map(item => ({
            ...item,
            displayName: `${item.name} - Price: ${this.formatCurrency(item.price)} - Stock: ${item.stock}`
          }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading items:', error);
        this.isLoading = false;
      }
    });
  }

  
  onSearchChange(event: any): void {
    const query = event.target.value;
    this.searchSubject.next(query);
  }

  filterItems(query: string): void {
    this.databaseService.getInventoryItems().subscribe(items => {
      let filteredItems = items.filter(item => item.stock > 0); // Filter out zero stock items
      
      if (!query) {
        this.filteredItems = filteredItems.map(item => ({
          ...item,
          displayName: `${item.name} - Price: ${this.formatCurrency(item.price)} - Stock: ${item.stock}`
        }));
        return;
      }
      
      this.filteredItems = filteredItems
        .filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
        .map(item => ({
          ...item,
          displayName: `${item.name} - Price: ${this.formatCurrency(item.price)} - Stock: ${item.stock}`
        }));
    });
  }

  onItemChange(): void {
    const itemId = this.billForm.get('itemId')?.value;
    if (itemId) {
      this.selectedItem = this.availableItems.find(item => item.id === parseInt(itemId)) || null;
      if (this.selectedItem) {
        // Set default sale price to purchase price
        this.billForm.get('salePrice')?.setValue(this.selectedItem.price);
      }
    } else {
      this.selectedItem = null;
      this.billForm.get('salePrice')?.setValue('');
    }
  }

  calculateProfitPerItem(): number {
    if (!this.selectedItem || !this.billForm.get('salePrice')?.value) return 0;
    const salePrice = parseFloat(this.billForm.get('salePrice')?.value);
    return salePrice - this.selectedItem.price;
  }

  calculateTotalProfit(): number {
    const quantity = this.billForm.get('quantity')?.value || 1;
    return this.calculateProfitPerItem() * quantity;
  }

  calculateTotalSalePrice(): number {
    if (!this.billForm.get('salePrice')?.value || !this.billForm.get('quantity')?.value) return 0;
    const salePrice = parseFloat(this.billForm.get('salePrice')?.value);
    const quantity = parseInt(this.billForm.get('quantity')?.value);
    return salePrice * quantity;
  }

  calculateBillProfit(): number {
    return this.billItems.reduce((total, item) => total + item.profit, 0);
  }

  addItemToList(): void {
    if (this.billForm.invalid) {
      return;
    }

    const itemId = this.billForm.get('itemId')?.value;
    const quantity = this.billForm.get('quantity')?.value;
    const salePrice = this.billForm.get('salePrice')?.value;
    
    if (!this.selectedItem) {
      return;
    }

    // Check if item already in bill
    const existingItem = this.billItems.find(billItem => billItem.id === this.selectedItem!.id);
    
    if (existingItem) {
      // Update existing item
      existingItem.quantity += quantity;
      existingItem.total = existingItem.salePrice * existingItem.quantity;
      existingItem.profit = (existingItem.salePrice - existingItem.purchasePrice) * existingItem.quantity;
    } else {
      // Add new item to bill
      const billItem: BillItem = {
        id: this.selectedItem.id,
        name: this.selectedItem.name,
        purchasePrice: this.selectedItem.price,
        salePrice: parseFloat(salePrice),
        quantity: parseInt(quantity),
        total: parseFloat(salePrice) * parseInt(quantity),
        profit: (parseFloat(salePrice) - this.selectedItem.price) * parseInt(quantity)
      };
      this.billItems.push(billItem);
    }
    
    this.calculateTotal();
    
    // Update dataSource to reflect changes
    this.dataSource.data = [...this.billItems];
    
    // Reset form
    this.billForm.patchValue({
      itemId: '',
      quantity: 1,
      salePrice: ''
    });
    this.selectedItem = null;
  }

  updateQuantity(item: BillItem, change: number): void {
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
      this.removeItem(item);
      return;
    }
    
    // Validate stock availability
    if (change > 0) {
      const stockValidation = this.validateItemStock(item.id, newQuantity);
      if (!stockValidation.isValid) {
        alert(stockValidation.errorMessage);
        return;
      }
    }
    
    item.quantity = newQuantity;
    item.total = item.quantity * item.salePrice;
    item.profit = (item.salePrice - item.purchasePrice) * item.quantity;
    this.calculateTotal();
    
    // Update dataSource to reflect changes
    this.dataSource.data = [...this.billItems];
  }

  removeItem(item: BillItem): void {
    const index = this.billItems.findIndex(billItem => billItem.id === item.id);
    if (index > -1) {
      this.billItems.splice(index, 1);
      this.calculateTotal();
      
      // Update dataSource to reflect changes
      this.dataSource.data = [...this.billItems];
    }
  }

  calculateTotal(): void {
    this.totalAmount = this.billItems.reduce((sum, item) => sum + item.total, 0);
  }

  validateItemStock(itemId: number, requestedQuantity: number): { isValid: boolean; errorMessage?: string } {
    const item = this.filteredItems.find(item => item.id === itemId);
    if (!item) {
      return { isValid: false, errorMessage: 'Item not found' };
    }
    
    if (item.stock < requestedQuantity) {
      return { 
        isValid: false, 
        errorMessage: `Only ${item.stock} units available for ${item.name}` 
      };
    }
    
    return { isValid: true };
  }

  selectPaymentType(type: string): void {
    this.selectedPaymentType = type;
  }

  openInvoiceInNewWindow(sale: any): void {
    // Open a new window with the invoice details
    const invoiceWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
    
    if (!invoiceWindow) {
      alert('Please allow popups to view the invoice');
      return;
    }

    // Generate the invoice HTML content
    const invoiceContent = this.generateInvoiceHTML(sale);
    
    invoiceWindow.document.write(invoiceContent);
    invoiceWindow.document.close();
    invoiceWindow.focus();
    
    // Auto-print after content loads
    setTimeout(() => {
      invoiceWindow.print();
    }, 500);
  }

  generateInvoiceHTML(sale: any): string {
    const customerName = sale.customerName || 'Walk-in Customer';
    const createdDate = new Date(sale.createdDate).toLocaleDateString();
    const createdTime = new Date(sale.createdDate).toLocaleTimeString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Invoice #${sale.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
          .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1976d2; padding-bottom: 20px; }
          .invoice-header h1 { margin: 0; color: #1976d2; font-size: 2rem; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .invoice-info-left { flex: 1; }
          .invoice-info-right { text-align: right; }
          .invoice-info p { margin: 8px 0; color: #333; }
          .invoice-info strong { color: #1976d2; }
          .items-section { margin-bottom: 30px; }
          .items-section h3 { margin: 0 0 20px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
          .items-table th { background-color: #f8f9fa; font-weight: 600; color: #333; }
          .items-table td:last-child, .items-table th:last-child { text-align: right; font-weight: 600; }
          .invoice-total { text-align: right; margin-bottom: 30px; }
          .invoice-total h3 { margin: 0; color: #1976d2; font-size: 1.8rem; }
          .invoice-footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
          @media print { body { background-color: white; } .invoice-container { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <h1>SALES INVOICE</h1>
            <p>Invoice #${sale.id}</p>
          </div>
          
          <div class="invoice-info">
            <div class="invoice-info-left">
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Payment Type:</strong> ${sale.paymentType}</p>
              <p><strong>Status:</strong> ${sale.status}</p>
            </div>
            <div class="invoice-info-right">
              <p><strong>Date:</strong> ${createdDate}</p>
              <p><strong>Time:</strong> ${createdTime}</p>
            </div>
          </div>
          
          <div class="items-section">
            <h3>Invoice Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items.map((item: any) => {
                  const inventoryItem = this.filteredItems.find(inv => inv.id === item.itemId);
                  const itemName = inventoryItem ? inventoryItem.name : 'Item #' + item.itemId;
                  return `
                    <tr>
                      <td>${itemName}</td>
                      <td>${this.formatCurrency(item.price)}</td>
                      <td>${item.quantity}</td>
                      <td>${this.formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="invoice-total">
            <h3>Total Amount: ${this.formatCurrency(sale.items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0))}</h3>
          </div>
          
          <div class="invoice-footer">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated invoice</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  submitBill(): void {
    if (this.billItems.length === 0) {
      alert('Please add items to the bill');
      return;
    }
    
    // Validate stock availability before creating invoice
    const stockValidation = this.validateStockAvailability();
    if (!stockValidation.isValid) {
      alert(stockValidation.errorMessage);
      return;
    }
    
    this.isLoading = true;
    setTimeout(() => {
      const saleData = {
        customerId: this.selectedCustomer?.id || null,
        customerName: this.selectedCustomer?.name || 'Walk-in Customer',
        paymentType: this.selectedPaymentType,
        items: this.billItems.map(item => ({
          itemId: item.id,
          quantity: item.quantity,
          price: item.salePrice
        }))
      };
      
      // Use database service to create sale and update stock
      this.databaseService.addSale(saleData);
      
      alert(`Sales Invoice created successfully!`);
      this.resetBill();
      this.isLoading = false;
    }, 1000);
  }

  submitBillWithPrint(): void {
    if (this.billItems.length === 0) {
      alert('Please add items to the bill');
      return;
    }
    
    // Validate stock availability before creating invoice
    const stockValidation = this.validateStockAvailability();
    if (!stockValidation.isValid) {
      alert(stockValidation.errorMessage);
      return;
    }
    
    this.isLoading = true;
    
    // Create sale request
    const saleData = {
      customerId: this.selectedCustomer?.id || null,
      customerName: this.selectedCustomer?.name || 'Walk-in Customer',
      paymentType: this.selectedPaymentType,
      items: this.billItems.map(item => ({
        itemId: item.id,
        quantity: item.quantity,
        price: item.salePrice
      }))
    };

    // Use database service to save sale and get sale object
    try {
      const sale = this.databaseService.addSaleAndReturn(saleData);
      
      alert(`Sales Invoice created successfully! Opening print dialog...`);
      
      // Reset form and clear items
      this.resetBill();
      
      // Open print dialog directly
      setTimeout(() => {
        this.openInvoiceInNewWindow(sale);
      }, 500);
      
    } catch (error) {
      alert('Error creating sales invoice');
    } finally {
      this.isLoading = false;
    }
  }

  validateStockAvailability(): { isValid: boolean; errorMessage: string } {
    let currentItems: any[] = [];
    
    // Get current items from database service
    this.databaseService.getInventoryItems().subscribe(items => {
      currentItems = items;
    });
    
    // For synchronous validation, we need to get from localStorage temporarily
    const items = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
    
    for (const billItem of this.billItems) {
      const itemIndex = items.findIndex((item: any) => item.id === billItem.id);
      if (itemIndex === -1) {
        return {
          isValid: false,
          errorMessage: `Item "${billItem.name}" not found in inventory`
        };
      }
      
      const availableStock = items[itemIndex]?.stockQuantity || items[itemIndex]?.stock || 0;
      if (availableStock < billItem.quantity) {
        return {
          isValid: false,
          errorMessage: `Insufficient stock for "${billItem.name}". Available: ${availableStock}, Requested: ${billItem.quantity}`
        };
      }
    }
    
    return { isValid: true, errorMessage: '' };
  }

  updateStockQuantities(invoiceId: number): void {
    // Get current inventory items
    const currentItems = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
    
    // Update stock for each item in the bill
    this.billItems.forEach(billItem => {
      const itemIndex = currentItems.findIndex((item: any) => item.id === billItem.id);
      if (itemIndex !== -1) {
        const oldStock = currentItems[itemIndex].stock || 0;
        const quantityUsed = billItem.quantity;
        
        // Decrease stock quantity
        currentItems[itemIndex].stock -= quantityUsed;
        
        // Ensure stock doesn't go below 0
        if (currentItems[itemIndex].stock < 0) {
          currentItems[itemIndex].stock = 0;
        }
        
        // Record stock transaction for sale
        const stockTransaction = {
          ItemId: billItem.id,
          QuantityChange: -quantityUsed, // Negative for stock out
          Type: 'Sale',
          ReferenceId: invoiceId, // Use invoice ID as reference
          Price: billItem.salePrice,
          CreatedDate: new Date().toISOString()
        };
        
        // Save stock transaction directly to localStorage
        const existingTransactions = JSON.parse(localStorage.getItem('stockTransactions') || '[]');
        existingTransactions.push(stockTransaction);
        localStorage.setItem('stockTransactions', JSON.stringify(existingTransactions));
      }
    });
    
    // Save updated items back to localStorage
    localStorage.setItem('inventoryItems', JSON.stringify(currentItems));
  }

  resetBill(): void {
    this.billItems = [];
    this.totalAmount = 0;
    this.searchQuery = '';
    this.billForm.get('searchQuery')?.setValue('');
    this.filterItems('');
  }

  formatCurrency(amount: number): string {
    return `${amount.toFixed(2)}`;
  }
}
