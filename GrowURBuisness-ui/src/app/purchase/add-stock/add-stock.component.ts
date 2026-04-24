import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { InventoryService } from '../../services/inventory.service';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-add-stock',
  templateUrl: './add-stock.component.html',
  styleUrls: ['./add-stock.component.scss']
})
export class AddStockComponent implements OnInit {
  purchaseForm: FormGroup;
  addItemForm: FormGroup;
  availableItems: any[] = [];
  purchaseItems: any[] = [];
  vendors: any[] = [];
  selectedVendor: any = null;
  categories: any[] = [];
  dataSource: MatTableDataSource<any>;
  isLoading = false;
  showAddItemModal = false;
  displayedColumns = ['itemName', 'quantity', 'price', 'total', 'actions'];

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private customerService: CustomerService,
    private router: Router,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
    this.dataSource = new MatTableDataSource<any>();
    
    this.purchaseForm = this.fb.group({
      vendorId: [''],
      itemId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      pricePerQty: [0, Validators.required],
      purchasePrice: [0, [Validators.required, Validators.min(0.01)]]
    });

    this.addItemForm = this.fb.group({
      itemName: ['', Validators.required],
      category: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  
  loadAvailableItems(): void {
    this.inventoryService.getItems().subscribe((items: any[]) => {
      this.availableItems = items.map((item: any) => ({
        ...item,
        itemName: item.name
      }));
    });
  }

  onItemChange(): void {
    const itemId = this.purchaseForm.get('itemId')?.value;
    if (itemId) {
      const selectedItem = this.availableItems.find(item => item.id === parseInt(itemId));
      if (selectedItem) {
        this.purchaseForm.patchValue({
          pricePerQty: selectedItem.price
        });
        // Auto-calculate total purchase price
        this.calculateTotalPrice();
      }
    }
  }

  loadCategories(): void {
    this.inventoryService.getCategories().subscribe((categories: any[]) => {
      this.categories = categories;
    });
  }

  ngOnInit(): void {
    this.loadAvailableItems();
    this.loadVendors();
    this.loadCategories();
    
    // Listen to quantity changes for auto-calculation
    this.purchaseForm.get('quantity')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
    
    // Listen to pricePerQty changes for auto-calculation
    this.purchaseForm.get('pricePerQty')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
    
    // Listen to vendorId changes
    this.purchaseForm.get('vendorId')?.valueChanges.subscribe(() => {
      this.onVendorChange();
    });
  }

  loadVendors(): void {
    this.customerService.getCustomers().subscribe((customers: any[]) => {
      this.vendors = customers.filter((customer: any) => customer.customerType === 'Vendor');
      console.log('All vendors loaded:', this.vendors); // Debug log
    });
  }

  onVendorChange(): void {
    const vendorId = this.purchaseForm.get('vendorId')?.value;
    if (vendorId) {
      this.selectedVendor = this.vendors.find(v => v.id === parseInt(vendorId));
    } else {
      this.selectedVendor = null;
    }
  }

  calculateTotalPrice(): void {
    const quantity = this.purchaseForm.get('quantity')?.value || 0;
    const pricePerQty = this.purchaseForm.get('pricePerQty')?.value || 0;
    const totalPrice = quantity * pricePerQty;
    
    this.purchaseForm.patchValue({
      purchasePrice: totalPrice
    }, { emitEvent: false });
  }

  addItemToList(): void {
    const itemId = this.purchaseForm.get('itemId')?.value;
    const quantity = parseInt(this.purchaseForm.get('quantity')?.value) || 0;
    const purchasePrice = parseFloat(this.purchaseForm.get('purchasePrice')?.value) || 0;

    console.log('=== ADD ITEM TO LIST DEBUG ===');
    console.log('Form values - itemId:', itemId, 'quantity:', quantity, 'purchasePrice:', purchasePrice);
    console.log('Type of quantity:', typeof quantity, 'Type of purchasePrice:', typeof purchasePrice);

    if (!itemId || !quantity || !purchasePrice || !this.purchaseForm.valid) {
      this.snackBar.open('Please fill all required fields with valid values', 'Error', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    const selectedItem = this.availableItems.find(item => item.id === parseInt(itemId));
    if (selectedItem) {
      const existingItem = this.purchaseItems.find(p => p.itemId === parseInt(itemId));
      if (existingItem) {
        console.log('Existing item found, updating quantity from', existingItem.quantity, 'to', existingItem.quantity + quantity);
        existingItem.quantity += quantity;
        // Calculate new total price based on updated quantity and unit price
        const unitPrice = existingItem.purchasePrice / (existingItem.quantity - quantity);
        existingItem.purchasePrice = existingItem.quantity * unitPrice;
      } else {
        console.log('Adding new item with quantity:', quantity);
        this.purchaseItems.push({
          itemId: parseInt(itemId),
          itemName: selectedItem.name,
          quantity: quantity,
          purchasePrice: purchasePrice
        });
      }
      console.log('Current purchaseItems array:', this.purchaseItems);
      
      // Update the dataSource for the table
      this.dataSource.data = [...this.purchaseItems];
    }

    this.purchaseForm.patchValue({
      itemId: '',
      quantity: '',
      pricePerQty: '',
      purchasePrice: ''
    });
  }

  removeItem(index: number): void {
    if (index >= 0 && index < this.purchaseItems.length) {
      this.purchaseItems.splice(index, 1);
      // Update the dataSource for the table
      this.dataSource.data = [...this.purchaseItems];
    }
  }

  calculateTotal(): number {
    return this.purchaseItems.reduce((total, item) => total + (item.quantity * item.purchasePrice), 0);
  }

  testApiEndpoint(): void {
    console.log('Testing API endpoint...');
    this.http.get(`${environment.apiUrl}/Purchase/test`).subscribe({
      next: (response: any) => {
        console.log('API Test Response:', response);
        this.snackBar.open('API endpoint is working', 'Success', { duration: 2000 });
      },
      error: (error: any) => {
        console.error('API Test Error:', error);
        this.snackBar.open('API endpoint test failed', 'Error', { duration: 2000 });
      }
    });
  }

  onSubmit(): void {
    if (this.purchaseItems.length === 0) {
      this.snackBar.open('Please add at least one item to the purchase list', 'Error', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    // Validate vendor selection
    const vendorId = this.purchaseForm.get('vendorId')?.value;
    if (!vendorId) {
      this.snackBar.open('Please select a vendor', 'Error', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    // Validate purchase items
    if (!this.purchaseItems || this.purchaseItems.length === 0) {
      this.snackBar.open('Please add items to the purchase', 'Error', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    // Validate each item has required properties
    for (const item of this.purchaseItems) {
      if (!item.itemId || !item.quantity || !item.purchasePrice) {
        this.snackBar.open('Invalid item data detected', 'Error', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        return;
      }
    }

    this.isLoading = true;
    
    // Create purchase request
    const purchaseRequest = {
      VendorId: parseInt(this.purchaseForm.get('vendorId')?.value || '0'),
      Items: this.purchaseItems.map(item => ({
        ItemId: item.itemId,
        Quantity: item.quantity,
        UnitPrice: item.purchasePrice
      }))
    };

    console.log('=== SUBMIT PURCHASE DEBUG ===');
    console.log('Purchase items before mapping:', this.purchaseItems);
    console.log('Purchase items details:', this.purchaseItems.map(item => ({
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice
    })));
    console.log('Purchase request being sent to database:', purchaseRequest);
    console.log('Request structure:', JSON.stringify(purchaseRequest, null, 2));

    // Call purchase API
    this.http.post(`${environment.apiUrl}/Purchase`, purchaseRequest).subscribe({
      next: (response: any) => {
        this.snackBar.open('Purchase created successfully!', 'Success', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        
        // Reset form and clear items
        this.purchaseItems = [];
        this.purchaseForm.patchValue({
          itemId: '',
          quantity: '',
          pricePerQty: '',
          purchasePrice: ''
        });
        
        // Reload available items to update stock quantities
        this.loadAvailableItems();
        
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('=== API ERROR DETAILS ===');
        console.error('Full error object:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        this.snackBar.open(`Failed to create purchase: ${error.message || 'Unknown error'}`, 'Error', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        this.isLoading = false;
      }
    });
  }

  onSubmitWithPrint(): void {
    if (this.purchaseItems.length === 0) {
      this.snackBar.open('Please add at least one item to purchase list', 'Error', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    // Validate vendor selection
    const vendorId = this.purchaseForm.get('vendorId')?.value;
    if (!vendorId) {
      this.snackBar.open('Please select a vendor', 'Error', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    // Validate purchase items
    if (!this.purchaseItems || this.purchaseItems.length === 0) {
      this.snackBar.open('Please add items to the purchase', 'Error', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    // Validate each item has required properties
    for (const item of this.purchaseItems) {
      if (!item.itemId || !item.quantity || !item.purchasePrice) {
        this.snackBar.open('Invalid item data detected', 'Error', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        return;
      }
    }

    this.isLoading = true;
    
    // Create purchase request
    const purchaseRequest = {
      VendorId: parseInt(this.purchaseForm.get('vendorId')?.value || '0'),
      Items: this.purchaseItems.map(item => ({
        ItemId: item.itemId,
        Quantity: item.quantity,
        UnitPrice: item.purchasePrice
      }))
    };

    console.log('=== SUBMIT PURCHASE WITH PRINT DEBUG ===');
    console.log('Purchase items before mapping:', this.purchaseItems);
    console.log('Purchase items details:', this.purchaseItems.map(item => ({
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice
    })));
    console.log('Purchase request being sent to database:', purchaseRequest);
    console.log('Request structure:', JSON.stringify(purchaseRequest, null, 2));

    // Call purchase API
    this.http.post(`${environment.apiUrl}/Purchase`, purchaseRequest).subscribe({
      next: (response: any) => {
        this.snackBar.open('Purchase created successfully! Opening print dialog...', 'Success', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        
        // Reset form and clear items
        this.purchaseItems = [];
        this.purchaseForm.patchValue({
          itemId: '',
          quantity: '',
          pricePerQty: '',
          purchasePrice: ''
        });
        
        // Reload available items to update stock quantities
        this.loadAvailableItems();
        
        this.isLoading = false;
        
        // Open print dialog with actual purchase data
        setTimeout(() => {
          this.openBillInNewWindow(response);
        }, 1000);
      },
      error: (error: any) => {
        console.error('=== API ERROR DETAILS ===');
        console.error('Full error object:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);
        
        this.snackBar.open('Failed to create purchase order', 'Error', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        this.isLoading = false;
      }
    });
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
    
    // Auto-print after content loads
    setTimeout(() => {
      billWindow.print();
    }, 500);
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
              <p><strong>Date:</strong> ${new Date(purchase.createdDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span class="status-badge">${purchase.status}</span></p>
            </div>
            <div class="bill-info-right">
              <p><strong>Total Items:</strong> ${purchase.items?.length || 0}</p>
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
                ${purchase.items.map((item: any) => `
                  <tr>
                    <td>${this.getItemNameForBill(item.itemId)}</td>
                    <td>${item.quantity}</td>
                    <td>${item.purchasePrice.toFixed(2)}</td>
                    <td>${(item.quantity * item.purchasePrice).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="bill-total">
            <h3>Total Amount: ${purchase.items?.reduce((total: number, item: any) => total + (item.quantity * item.purchasePrice), 0).toFixed(2)}</h3>
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

  getItemNameForBill(itemId: number): string {
    const item = this.availableItems.find(item => item.id === itemId);
    return item ? item.name : `Item ID: ${itemId}`;
  }

  
  // Modal methods
  openAddItemModal(): void {
    this.showAddItemModal = true;
    this.addItemForm.reset();
  }

  closeAddItemModal(): void {
    this.showAddItemModal = false;
    this.addItemForm.reset();
  }

  saveNewItem(): void {
    if (this.addItemForm.invalid) {
      return;
    }

    const newItemData = this.addItemForm.value;
    
    // Check for duplicate item name
    const existingItem = this.availableItems.find(item => 
      item.name.toLowerCase() === newItemData.itemName.toLowerCase()
    );
    
    if (existingItem) {
      this.snackBar.open('An item with this name already exists!', 'Error', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    const newItem = {
      name: newItemData.itemName,
      categoryId: parseInt(newItemData.category),
      price: newItemData.price,
      stockQuantity: 0, // Initial stock is 0 until purchase is made
      minimumStock: 5
    };

    // Add new item using API
    this.inventoryService.addItem(newItem).subscribe({
      next: () => {
        // Reload available items to include the new item
        this.loadAvailableItems();

        // Auto-select the newly added item
        setTimeout(() => {
          const latestItem = this.availableItems[this.availableItems.length - 1];
          if (latestItem) {
            this.purchaseForm.patchValue({
              itemId: latestItem.id,
              pricePerQty: latestItem.price,
              purchasePrice: latestItem.price
            });
          }
        }, 100);

        this.snackBar.open('New item added successfully!', 'Success', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });

        this.closeAddItemModal();
      },
      error: (error) => {
        this.snackBar.open('Failed to add new item', 'Error', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    });
  }
}
