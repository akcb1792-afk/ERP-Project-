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
    this.billingService.getAllItems().subscribe({
      next: (items: any[]) => {
        this.items = items;
        const filteredItems = items.filter(item => {
          const stockQuantity = item.stock || item.stockQuantity || 0;
          return stockQuantity > 0;
        });
        
        this.availableItems = filteredItems.map(item => ({
          ...item,
          itemName: item.name
        }));
      },
      error: (error) => {
        console.error('Error loading items:', error);
        this.snackBar.open('Failed to load items', 'Error', { duration: 3000 });
      }
    });
  }

  loadCustomers(): void {
    this.billingService.getCustomers().subscribe({
      next: (customers: any[]) => {
        this.customers = customers;
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
      this.selectedItemPrice = this.availableItems.find(item => item.id === parseInt(itemId))?.price || 0;
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

    const existingBillItem = this.bills.find(bill => bill.itemId === itemId);
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
      this.bills.push(billItem);
    }

    this.billForm.patchValue({ itemId: '', quantity: 1, salePrice: 0 });
    this.selectedItemPrice = null;
  }

  removeItemFromBill(billItem: BillItem): void {
    const index = this.bills.indexOf(billItem);
    if (index > -1) {
      this.bills.splice(index, 1);
    }
  }

  getTotalAmount(): number {
    return this.bills.reduce((total, bill) => total + bill.total, 0);
  }

  getTotalProfit(): number {
    return this.bills.reduce((total, bill) => total + bill.profit, 0);
  }

  onSubmit(): void {
    const customerId = this.billForm.get('customerId')?.value;
    const paymentType = this.billForm.get('paymentType')?.value;

    if (!customerId || this.bills.length === 0) {
      this.snackBar.open('Please select a customer and add at least one item', 'Error', { duration: 3000 });
      return;
    }

    try {
      const invoiceRequest: CreateInvoiceRequest = {
        customerId: parseInt(customerId),
        paymentType: paymentType,
        items: this.bills.map(bill => ({
          itemId: bill.itemId,
          quantity: bill.quantity,
          price: bill.salePrice
        }))
      };

      this.billingService.createInvoice(invoiceRequest).subscribe({
        next: (response) => {
          if (response.success) {
            this.generatedInvoiceId = Date.now();
            this.snackBar.open('Invoice created successfully!', 'Success', { duration: 3000 });
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
}
