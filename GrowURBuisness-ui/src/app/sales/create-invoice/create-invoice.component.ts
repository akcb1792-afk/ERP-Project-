import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BillingService, CreateInvoiceRequest } from '../../services/billing.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

interface Item {
  id: number;
  name: string;
  price: number;
  stock?: number;
  stockQuantity?: number;
  category: string;
}

interface BillItem {
  id: number;
  itemId: number;
  name: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  total: number;
  profit: number;
  isCustomRate?: boolean;
}

@Component({
  selector: 'app-create-invoice',
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss']
})
export class CreateInvoiceComponent implements OnInit {
  title = 'Create Invoice';
  
  billForm: FormGroup;
  items: Item[] = [];
  availableItems: any[] = [];
  customers: any[] = [];
  bills: BillItem[] = [];
  billItems: BillItem[] = []; // Add missing property for HTML template
  isLoading = false;
  generatedInvoiceId: number | null = null;
  selectedItemPrice: number | null = null;
  selectedCustomer: any = null;

  printInvoice(): void {
    if (this.generatedInvoiceId) {
      const invoiceContent = this.generateInvoiceContent();
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (printWindow) {
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Trigger print dialog
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } else {
      this.snackBar.open('No invoice to print', 'Error', { duration: 3000 });
    }
  }

  constructor(
    private fb: FormBuilder,
    private billingService: BillingService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.billForm = this.fb.group({
      customerId: ['', Validators.required],
      paymentType: ['Cash', Validators.required],
      itemId: [''],
      quantity: [1, [Validators.min(1)]],
      salePrice: [0]
    });
  }

  ngOnInit() {
    this.loadItems();
    this.loadCustomers();
  }

  loadItems(): void {
    console.log('Sales Create - Loading items...');
    this.billingService.getAllItems().subscribe({
      next: (items: any[]) => {
        console.log('Sales Create - Items loaded:', items.length);
        console.log('Sales Create - Items data:', items);
        this.items = items;
        const filteredItems = items.filter(item => {
          const stockQuantity = item.stock || item.stockQuantity || 0;
          return stockQuantity > 0;
        });
        
        this.availableItems = filteredItems.map(item => ({
          ...item,
          itemName: item.name
        }));
        console.log('Sales Create - Available items:', this.availableItems.length);
      },
      error: (error) => {
        console.error('Error loading items:', error);
        this.snackBar.open('Failed to load items', 'Error', { duration: 3000 });
      }
    });
  }

  loadCustomers(): void {
    console.log('Sales Create - Loading customers...');
    this.billingService.getCustomers().subscribe({
      next: (customers: any[]) => {
        console.log('Sales Create - All customers loaded:', customers.length);
        console.log('Sales Create - Raw customers data:', customers);
        
        // Filter for customers only (CustomerType='Customer')
        this.customers = customers.filter((customer: any) => 
          customer.customerType === 'Customer' || 
          customer.type === 'Customer' ||
          customer.CustomerType === 'Customer' ||
          customer.Type === 'Customer' ||
          !customer.customerType && !customer.type // Include if no type specified
        );
        
        console.log('Sales Create - Filtered customers:', this.customers);
        console.log('Sales Create - Customer count after filtering:', this.customers.length);
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.snackBar.open('Failed to load customers', 'Error', { duration: 3000 });
      }
    });
  }

  onItemChange(): void {
    const itemId = this.billForm.get('itemId')?.value;
    if (itemId) {
      const item = this.availableItems.find((item: any) => item.id === parseInt(itemId));
      this.selectedItemPrice = item?.price || 0;
    } else {
      this.selectedItemPrice = null;
    }
  }

  onCustomerChange(): void {
    const customerId = this.billForm.get('customerId')?.value;
    this.selectedCustomer = this.customers.find(customer => customer.id === parseInt(customerId));
  }

  addItemToBill(): void {
    const itemId = this.billForm.get('itemId')?.value;
    const quantity = this.billForm.get('quantity')?.value || 1;
    const salePrice = this.billForm.get('salePrice')?.value || 0;

    if (!itemId || !quantity) {
      this.snackBar.open('Please select an item and enter quantity', 'Error', { duration: 3000 });
      return;
    }

    const item = this.availableItems.find(item => item.id === parseInt(itemId));
    if (!item) {
      this.snackBar.open('Item not found', 'Error', { duration: 3000 });
      return;
    }

    const existingBillItem = this.billItems.find(bill => bill.itemId === itemId);
    if (existingBillItem) {
      existingBillItem.quantity += quantity;
      existingBillItem.salePrice = salePrice;
    } else {
      const billItem: BillItem = {
        id: Date.now(),
        itemId: parseInt(itemId),
        name: item.name,
        purchasePrice: item.price,
        salePrice: salePrice,
        quantity: quantity,
        total: salePrice * quantity,
        profit: (salePrice - item.price) * quantity,
        isCustomRate: salePrice !== item.price
      };
      this.billItems.push(billItem);
    }

    this.billForm.patchValue({ itemId: '', quantity: 1, salePrice: 0 });
    this.selectedItemPrice = null;
  }

  removeItemFromBill(billItem: BillItem): void {
    const index = this.billItems.indexOf(billItem);
    if (index > -1) {
      this.billItems.splice(index, 1);
    }
  }

  getTotalAmount(): number {
    return this.billItems.reduce((total, bill) => total + bill.total, 0);
  }

  getTotalProfit(): number {
    return this.billItems.reduce((total, bill) => total + bill.profit, 0);
  }

  onSubmit(): void {
    const customerId = this.billForm.get('customerId')?.value;
    const paymentType = this.billForm.get('paymentType')?.value;

    if (!customerId || this.billItems.length === 0) {
      this.snackBar.open('Please select a customer and add at least one item', 'Error', { duration: 3000 });
      return;
    }

    try {
      const invoiceRequest: CreateInvoiceRequest = {
        customerId: parseInt(customerId),
        paymentType: paymentType,
        items: this.billItems.map(bill => ({
          itemId: bill.itemId,
          quantity: bill.quantity,
          price: bill.salePrice
        }))
      };

      this.billingService.createInvoice(invoiceRequest).subscribe({
        next: (response) => {
          if (response.success) {
            this.generatedInvoiceId = response.invoiceId || Date.now();
            this.snackBar.open(`Invoice #${response.invoiceId || 'N/A'} created successfully!`, 'Success', { duration: 3000 });
            this.resetForm();
          } else {
            this.snackBar.open(response.message || 'Failed to create invoice', 'Error', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error creating invoice:', error);
          this.snackBar.open('Failed to create invoice', 'Error', { duration: 3000 });
        }
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      this.snackBar.open('Failed to create invoice', 'Error', { duration: 3000 });
    }
  }

  resetForm(): void {
    this.billForm.reset({
      customerId: '',
      paymentType: 'Cash',
      itemId: '',
      quantity: 1,
      salePrice: 0
    });
    this.bills = [];
    this.billItems = [];
    this.selectedCustomer = null;
    this.selectedItemPrice = null;
  }

  onCancel(): void {
    this.router.navigate(['/sales']);
  }

  // Add missing methods for HTML template
  updateRate(billItem: BillItem, event: any): void {
    const newRate = parseFloat(event.target.value);
    if (newRate >= 0) {
      billItem.salePrice = newRate;
      billItem.total = billItem.salePrice * billItem.quantity;
      billItem.profit = (billItem.salePrice - billItem.purchasePrice) * billItem.quantity;
      billItem.isCustomRate = true;
    }
  }

  updateQuantity(billItem: BillItem, event: any): void {
    const newQuantity = parseInt(event.target.value);
    if (newQuantity > 0) {
      billItem.quantity = newQuantity;
      billItem.total = billItem.salePrice * billItem.quantity;
      billItem.profit = (billItem.salePrice - billItem.purchasePrice) * billItem.quantity;
    }
  }

  removeItem(index: number): void {
    this.billItems.splice(index, 1);
  }

  createInvoiceWithPrint(): void {
    this.onSubmit();
    // Print functionality would go here
  }

  generateInvoiceContent(): string {
    const customer = this.selectedCustomer;
    const currentDate = new Date().toLocaleDateString();
    
    const itemsHtml = (this.billItems || []).map((item: BillItem, index: number) => 
      `<tr>
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.purchasePrice.toFixed(2)}</td>
        <td>${item.salePrice.toFixed(2)}</td>
        <td>${item.total.toFixed(2)}</td>
        <td>${item.profit.toFixed(2)}</td>
      </tr>`
    ).join('');

    const totalAmount = this.getTotalAmount() || 0;
    const totalProfit = this.getTotalProfit() || 0;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Invoice #${this.generatedInvoiceId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
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
        <div class="invoice-header">
          <h1>SALES INVOICE</h1>
          <h2>Invoice #${this.generatedInvoiceId}</h2>
        </div>
        
        <div class="invoice-info">
          <p><strong>Date:</strong> ${currentDate}</p>
          <p><strong>Customer:</strong> ${customer?.name || 'Walk-in Customer'}</p>
          <p><strong>Payment Type:</strong> ${this.billForm.get('paymentType')?.value || 'Cash'}</p>
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
          <p>Total Amount: ${totalAmount.toFixed(2)}</p>
          <p>Total Profit: ${totalProfit.toFixed(2)}</p>
        </div>
        
        <div class="action-buttons">
          <button class="btn print-btn" onclick="window.print()">Print</button>
          <button class="btn close-btn" onclick="window.close()">Close</button>
        </div>
      </body>
      </html>
    `;
  }
}
