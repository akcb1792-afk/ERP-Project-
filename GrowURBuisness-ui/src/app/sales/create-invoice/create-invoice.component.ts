import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { DatabaseService } from '../../services/database.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

// Define interfaces locally
interface Item {
  id: number;
  name: string;
  price: number;
  stock?: number;
  stockQuantity?: number;
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
  isCustomRate?: boolean;
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
  selector: 'app-create-invoice',
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss']
})
export class CreateInvoiceComponent implements OnInit {
  title = 'Create Sales Invoice';
  
  billForm: FormGroup;
  searchQuery = '';
  filteredItems: Item[] = [];
  availableItems: Item[] = [];
  billItems: BillItem[] = [];
  selectedPaymentType = 'Cash';
  customers: any[] = [];
  isLoading = false;
  generatedInvoiceId: number | null = null;
  selectedItemPrice: number | null = null;
  
  // For autocomplete
  searchSubject = new Subject<string>();
  selectedCustomer: any = null;

  constructor(
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.billForm = this.fb.group({
      customerId: ['', Validators.required],
      paymentType: ['Cash', Validators.required],
      itemId: [''], // Not required for invoice submission
      quantity: [1, [Validators.min(1)]], // Not required for invoice submission
      salePrice: [0] // Not required for invoice submission
    });
  }

  ngOnInit() {
    this.loadItems();
    this.loadCustomers();
  }

  loadItems() {
    this.databaseService.getInventoryItems().subscribe((items: any[]) => {
      console.log('Sales - Raw inventory items:', items); // Debug log
      console.log('Sales - Items with stock check:'); // Debug log
      
      const filteredItems = items.filter(item => {
        const stockQuantity = item.stock || item.stockQuantity || 0;
        console.log(`Sales - Item ${item.name}: stock=${stockQuantity}, included=${stockQuantity > 0}`); // Debug log
        return stockQuantity > 0; // Only show items with stock > 0
      });
      
      this.availableItems = filteredItems.map(item => ({
        ...item,
        itemName: item.name
      }));
      
      console.log('Sales - Available items loaded (with stock):', this.availableItems.length); // Debug log
      console.log('Sales - Available items:', this.availableItems); // Debug log
    });
  }

  onItemChange(): void {
    const itemId = this.billForm.get('itemId')?.value;
    if (itemId) {
      const selectedItem = this.availableItems.find(item => item.id === parseInt(itemId));
      if (selectedItem) {
        this.selectedItemPrice = selectedItem.price;
        this.billForm.patchValue({
          salePrice: selectedItem.price
        });
      } else {
        this.selectedItemPrice = null;
      }
    } else {
      this.selectedItemPrice = null;
    }
  }

  addItemToBill(): void {
    const itemId = this.billForm.get('itemId')?.value;
    const quantity = this.billForm.get('quantity')?.value;
    const salePrice = this.billForm.get('salePrice')?.value;

    if (!itemId || !quantity || !salePrice) {
      this.snackBar.open('Please fill all item details', 'Error', { duration: 3000 });
      return;
    }

    const selectedItem = this.availableItems.find(item => item.id === parseInt(itemId));
    if (!selectedItem) {
      this.snackBar.open('Invalid item selected', 'Error', { duration: 3000 });
      return;
    }

    const stockQuantity = selectedItem.stock || selectedItem.stockQuantity || 0;
    if (stockQuantity < quantity) {
      this.snackBar.open(`Quantity is out of stock. Available stock: ${stockQuantity}`, 'Error', { duration: 3000 });
      return;
    }

    // Check if item already in bill
    const existingItem = this.billItems.find(billItem => billItem.id === parseInt(itemId));
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = existingItem.quantity * existingItem.salePrice;
      existingItem.profit = (existingItem.salePrice - existingItem.purchasePrice) * existingItem.quantity;
    } else {
      const billItem: BillItem = {
        id: parseInt(itemId),
        name: selectedItem.name,
        purchasePrice: selectedItem.price,
        salePrice: salePrice,
        quantity: quantity,
        total: quantity * salePrice,
        profit: (salePrice - selectedItem.price) * quantity,
        isCustomRate: salePrice !== selectedItem.price
      };
      this.billItems.push(billItem);
    }

    // Reset item selection
    this.billForm.patchValue({
      itemId: '',
      quantity: 1,
      salePrice: 0
    });

    this.snackBar.open(`Added ${selectedItem.name} (${quantity} units) to bill`, 'Success', { 
  duration: 3000,
  panelClass: ['success-snackbar']
});
  }

  loadCustomers() {
    this.databaseService.getCustomersByType('Customer').subscribe((customers: any[]) => {
      this.customers = customers;
    });
  }

  onSearchChange(event: any) {
    const query = event.target?.value || '';
    this.searchSubject.next(query);
  }

  filterItems(query: string) {
    console.log('Sales - Filtering items with query:', query); // Debug log
    console.log('Sales - Available items count:', this.availableItems.length); // Debug log
    
    if (!query) {
      this.filteredItems = this.availableItems;
      return;
    }

    this.filteredItems = this.availableItems.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );
    
    console.log('Sales - Filtered items count:', this.filteredItems.length); // Debug log
  }

  selectItem(item: Item) {
    const stockQuantity = item.stock || item.stockQuantity || 0;
    if (stockQuantity <= 0) {
      this.snackBar.open('Item is out of stock', 'Error', { duration: 3000 });
      return;
    }

    // Check if item already in bill
    const existingItem = this.billItems.find(billItem => billItem.id === item.id);
    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.total = existingItem.quantity * existingItem.salePrice;
      existingItem.profit = (existingItem.salePrice - existingItem.purchasePrice) * existingItem.quantity;
    } else {
      const billItem: BillItem = {
        id: item.id,
        name: item.name,
        purchasePrice: item.price, // Use actual purchase price
        salePrice: item.price, // Default to purchase price, user can change
        quantity: 1,
        total: item.price,
        profit: 0, // Will be calculated when user changes rate
        isCustomRate: false
      };
      this.billItems.push(billItem);
    }

    // Clear search
    this.searchQuery = '';
    this.filteredItems = this.availableItems;
    this.billForm.get('searchQuery')?.setValue('');
  }

  removeItem(index: number) {
    this.billItems.splice(index, 1);
  }

  updateQuantity(item: BillItem, event: any) {
    const quantity = parseInt(event.target.value) || 0;
    if (quantity <= 0) {
      return;
    }
    item.quantity = quantity;
    item.total = item.quantity * item.salePrice;
    item.profit = (item.salePrice - item.purchasePrice) * item.quantity;
  }

  updateRate(item: BillItem, event: any) {
    const rate = parseFloat(event.target.value) || 0;
    if (rate <= 0) {
      return;
    }
    item.salePrice = rate;
    item.total = item.quantity * item.salePrice;
    item.profit = (item.salePrice - item.purchasePrice) * item.quantity;
    item.isCustomRate = true;
  }

  getTotalAmount(): number {
    return this.billItems.reduce((total, item) => total + item.total, 0);
  }

  getTotalProfit(): number {
    return this.billItems.reduce((total, item) => total + item.profit, 0);
  }

  onSubmit() {
    console.log('Create Invoice - Clicked'); // Debug log
    console.log('Create Invoice - Bill items:', this.billItems); // Debug log
    console.log('Create Invoice - Form valid:', this.billForm.valid); // Debug log
    console.log('Create Invoice - Form values:', this.billForm.value); // Debug log

    if (this.billItems.length === 0) {
      console.log('Create Invoice - No items error'); // Debug log
      this.snackBar.open('Please add at least one item', 'Error', { duration: 3000 });
      return;
    }

    // Check only required fields for invoice submission
    const customerId = this.billForm.get('customerId')?.value;
    const paymentType = this.billForm.get('paymentType')?.value;
    
    console.log('Create Invoice - Required fields check:'); // Debug log
    console.log('Create Invoice - Customer ID:', customerId, 'valid:', !!customerId); // Debug log
    console.log('Create Invoice - Payment Type:', paymentType, 'valid:', !!paymentType); // Debug log
    
    if (!customerId || !paymentType) {
      console.log('Create Invoice - Required fields missing'); // Debug log
      this.snackBar.open('Please select customer and payment type', 'Error', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    const invoiceRequest: CreateInvoiceRequest = {
      customerId: this.billForm.value.customerId,
      paymentType: this.billForm.value.paymentType,
      items: this.billItems.map(item => ({
        itemId: item.id,
        quantity: item.quantity,
        price: item.salePrice
      }))
    };

    console.log('Create Invoice - Invoice request:', invoiceRequest); // Debug log

    try {
      const invoiceId = Date.now();
      this.databaseService.addSale(invoiceRequest);
      this.generatedInvoiceId = invoiceId;
      
      // Display success message with invoice ID
      this.snackBar.open(`Invoice #${invoiceId} created successfully`, 'Success', { duration: 5000 });
      
      // Clear all fields after successful save
      this.resetForm();
      this.isLoading = false;
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      this.snackBar.open('Failed to create invoice', 'Error', { duration: 3000 });
      this.isLoading = false;
    }
  }

  createInvoiceWithPrint() { // Create invoice and print
    console.log('Create Invoice with Print - Clicked'); // Debug log
    console.log('Create Invoice with Print - Bill items:', this.billItems); // Debug log
    console.log('Create Invoice with Print - Form valid:', this.billForm.valid); // Debug log

    if (this.billItems.length === 0) {
      console.log('Create Invoice with Print - No items error'); // Debug log
      this.snackBar.open('Please add at least one item', 'Error', { duration: 3000 });
      return;
    }

    // Check only required fields for invoice submission
    const customerId = this.billForm.get('customerId')?.value;
    const paymentType = this.billForm.get('paymentType')?.value;
    
    console.log('Create Invoice with Print - Required fields check:'); // Debug log
    console.log('Create Invoice with Print - Customer ID:', customerId, 'valid:', !!customerId); // Debug log
    console.log('Create Invoice with Print - Payment Type:', paymentType, 'valid:', !!paymentType); // Debug log
    
    if (!customerId || !paymentType) {
      console.log('Create Invoice with Print - Required fields missing'); // Debug log
      this.snackBar.open('Please select customer and payment type', 'Error', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    const invoiceRequest: CreateInvoiceRequest = {
      customerId: this.billForm.value.customerId,
      paymentType: this.billForm.value.paymentType,
      items: this.billItems.map(item => ({
        itemId: item.id,
        quantity: item.quantity,
        price: item.salePrice
      }))
    };

    console.log('Create Invoice with Print - Invoice request:', invoiceRequest); // Debug log

    try {
      const invoiceId = Date.now();
      this.databaseService.addSale(invoiceRequest);
      this.generatedInvoiceId = invoiceId;
      
      // Display success message with invoice ID
      this.snackBar.open(`Invoice #${invoiceId} created and printing...`, 'Success', { duration: 5000 });
      this.isLoading = false;
      
      // Clear all fields after successful save
      this.resetForm();
      
      // Directly print after successful creation
      setTimeout(() => {
        console.log('Create Invoice with Print - Triggering print'); // Debug log
        this.printInvoice(invoiceId);
      }, 1000);
    } catch (error: any) {
      console.error('Error creating invoice with print:', error);
      this.snackBar.open('Failed to create invoice', 'Error', { duration: 3000 });
      this.isLoading = false;
    }
  }

  submitPurchase() {
    if (this.billItems.length === 0) {
      this.snackBar.open('Please add at least one item', 'Error', { duration: 3000 });
      return;
    }

    if (this.billForm.invalid) {
      this.snackBar.open('Please fill all required fields', 'Error', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    const invoiceRequest: CreateInvoiceRequest = {
      customerId: this.billForm.value.customerId,
      paymentType: this.billForm.value.paymentType,
      items: this.billItems.map(item => ({
        itemId: item.id,
        quantity: item.quantity,
        price: item.salePrice
      }))
    };

    try {
      this.databaseService.addSale(invoiceRequest);
      this.generatedInvoiceId = Date.now();
      this.snackBar.open('Purchase order submitted successfully', 'Success', { duration: 3000 });
      this.isLoading = false;
    } catch (error: any) {
      console.error('Error creating purchase:', error);
      this.snackBar.open('Failed to submit purchase', 'Error', { duration: 3000 });
      this.isLoading = false;
    }
  }

  submitBillWithPrint() {
    if (this.billItems.length === 0) {
      this.snackBar.open('Please add at least one item', 'Error', { duration: 3000 });
      return;
    }

    if (this.billForm.invalid) {
      this.snackBar.open('Please fill all required fields', 'Error', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    const invoiceRequest: CreateInvoiceRequest = {
      customerId: this.billForm.value.customerId,
      paymentType: this.billForm.value.paymentType,
      items: this.billItems.map(item => ({
        itemId: item.id,
        quantity: item.quantity,
        price: item.salePrice
      }))
    };

    try {
      this.databaseService.addSale(invoiceRequest);
      this.generatedInvoiceId = Date.now();
      this.snackBar.open('Bill created successfully', 'Success', { duration: 2000 });
      this.isLoading = false;
      
      // Trigger print after successful bill creation
      setTimeout(() => {
        window.print();
      }, 1000);
    } catch (error: any) {
      console.error('Error creating bill:', error);
      this.snackBar.open('Failed to create bill', 'Error', { duration: 3000 });
      this.isLoading = false;
    }
  }

  printInvoice(invoiceId: number) { // Print invoice method
    // Create bill content using current bill data
    const billContent = this.generateBillContent(invoiceId);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (printWindow) {
      printWindow.document.write(billContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  }

  generateInvoicePrintContent(invoiceId: number): string {
    const customer = this.customers.find(c => c.id === this.billForm.get('customerId')?.value);
    const customerName = customer ? customer.name : 'Unknown Customer';
    const currentDate = new Date().toLocaleDateString();
    
    let itemsHtml = this.billItems.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.purchasePrice.toFixed(2)}</td>
        <td>${item.salePrice.toFixed(2)}</td>
        <td>${item.total.toFixed(2)}</td>
        <td>${item.profit.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Invoice #${invoiceId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-info { margin-bottom: 20px; }
          .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .invoice-table th { background-color: #f2f2f2; }
          .total-section { text-align: right; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SALES INVOICE</h1>
          <h2>Invoice #${invoiceId}</h2>
        </div>
        
        <div class="invoice-info">
          <p><strong>Date:</strong> ${currentDate}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Payment Type:</strong> ${this.billForm.get('paymentType')?.value}</p>
        </div>
        
        <table class="invoice-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Purchase Price</th>
              <th>Sales Price</th>
              <th>Total</th>
              <th>Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="total-section">
          <p>Total Amount: ${this.getTotalAmount().toFixed(2)}</p>
          <p>Total Profit/Loss: ${this.getTotalProfit().toFixed(2)}</p>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;
  }

  generateBillContent(invoiceId: number): string { // Generate bill content
    const customer = this.customers.find(c => c.id === this.billForm.get('customerId')?.value);
    const customerName = customer ? customer.name : 'Walk-in Customer';
    const currentDate = new Date().toLocaleDateString();
    const paymentType = this.billForm.get('paymentType')?.value || 'Cash';
    
    let itemsHtml = this.billItems.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.salePrice.toFixed(2)}</td>
        <td>${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    const totalAmount = this.getTotalAmount();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Invoice #${invoiceId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .invoice-info { margin-bottom: 20px; }
          .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .invoice-table th { background-color: #f2f2f2; font-weight: bold; }
          .total-section { text-align: right; font-weight: bold; margin-top: 20px; }
          .footer { margin-top: 30px; text-align: center; font-style: italic; }
          .action-buttons { margin-top: 30px; text-align: center; }
          .action-buttons button { margin-right: 10px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
          .print-btn { background-color: #1976d2; color: white; }
          .close-btn { background-color: #f44336; color: white; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SALES INVOICE</h1>
          <h2>Invoice #${invoiceId}</h2>
        </div>
        
        <div class="invoice-info">
          <p><strong>Date:</strong> ${currentDate}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Payment Type:</strong> ${paymentType}</p>
          <p><strong>Status:</strong> Completed</p>
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
          
          <div class="action-buttons">
            <button onclick="window.print()" class="print-btn">Print</button>
            <button onclick="window.close()" class="close-btn">Close</button>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  resetForm() {
    this.billItems = [];
    this.billForm.reset({
      customerId: '',
      paymentType: 'Cash',
      itemId: '',
      quantity: 1,
      salePrice: 0
    });
    this.selectedItemPrice = null;
  }

  createTestInventory() {
    const testItems = [
      { id: 1, name: 'Akash', price: 100, stock: 50, stockQuantity: 50, category: 'Electronics' },
      { id: 2, name: 'Laptop', price: 25000, stock: 10, stockQuantity: 10, category: 'Electronics' },
      { id: 3, name: 'Mouse', price: 500, stock: 25, stockQuantity: 25, category: 'Electronics' },
      { id: 4, name: 'Keyboard', price: 1500, stock: 15, stockQuantity: 15, category: 'Electronics' }
    ];
    
    testItems.forEach(item => {
      this.databaseService.addInventoryItem(item);
    });
    
    this.snackBar.open('Test inventory items created', 'Success', { duration: 3000 });
    this.loadItems();
  }

  displayCustomer(customer: any): string {
    return customer ? customer.name : '';
  }

  customerSelected(customer: any) {
    this.selectedCustomer = customer;
    this.billForm.get('customerId')?.setValue(customer.id);
  }
}
