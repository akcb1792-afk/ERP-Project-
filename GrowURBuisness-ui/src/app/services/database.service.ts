import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private inventoryItems: any[] = [];
  private stockTransactions: any[] = [];
  private purchases: any[] = [];
  private sales: any[] = [];
  private customers: any[] = [];
  private itemsSubject = new BehaviorSubject<any[]>([]);
  private transactionsSubject = new BehaviorSubject<any[]>([]);
  private purchasesSubject = new BehaviorSubject<any[]>([]);
  private salesSubject = new BehaviorSubject<any[]>([]);
  private customersSubject = new BehaviorSubject<any[]>([]);

  constructor() {
    this.loadFromLocalStorage();
  }

  // Inventory Items Management
  getInventoryItems(): Observable<any[]> {
    // Calculate current stock from transactions and update items
    const currentItems = this.calculateCurrentStockFromTransactions();
    // Update the items subject with current stock data
    this.itemsSubject.next(currentItems);
    return this.itemsSubject.asObservable();
  }

  private calculateCurrentStockFromTransactions(): any[] {
    const stockTransactions = JSON.parse(localStorage.getItem('stockTransactions') || '[]');
    const items = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
    
    return items.map((item: any) => {
      const itemTransactions = stockTransactions.filter((t: any) => t.ItemId === item.id);
      const quantityChange = itemTransactions.reduce((sum: number, t: any) => sum + t.QuantityChange, 0);
      const currentStock = (item.stockQuantity || 0) + quantityChange;
      
      return {
        ...item,
        stockQuantity: Math.max(0, currentStock) // Ensure stock never goes negative
      };
    });
  }

  addInventoryItem(item: any): void {
    const newItem = {
      ...item,
      id: Date.now() // Simple ID generation
    };
    this.inventoryItems.push(newItem);
    this.saveToLocalStorage();
    this.itemsSubject.next([...this.inventoryItems]);
    
    // Add opening stock transaction if stock quantity is provided
    if (item.stockQuantity > 0) {
      const stockTransaction = {
        ItemId: newItem.id,
        QuantityChange: item.stockQuantity, // Positive for stock in
        Type: "Opening",
        ReferenceId: 0, // Opening balance transaction
        Price: item.price || 0,
        CreatedDate: new Date().toISOString()
      };
      
      // Save stock transaction directly to localStorage
      const existingTransactions = JSON.parse(localStorage.getItem('stockTransactions') || '[]');
      existingTransactions.push(stockTransaction);
      localStorage.setItem('stockTransactions', JSON.stringify(existingTransactions));
    }
  }

  updateInventoryItem(id: number, updatedItem: any): void {
    const index = this.inventoryItems.findIndex(item => item.id === id);
    if (index > -1) {
      this.inventoryItems[index] = { ...updatedItem, id };
      this.saveToLocalStorage();
      this.itemsSubject.next([...this.inventoryItems]);
    }
  }

  deleteInventoryItem(id: number): void {
    this.inventoryItems = this.inventoryItems.filter(item => item.id !== id);
    this.saveToLocalStorage();
    this.itemsSubject.next([...this.inventoryItems]);
  }

  // Purchase Management
  getPurchases(): Observable<any[]> {
    return this.purchasesSubject.asObservable();
  }

  addPurchase(purchaseData: any): void {
    this.addPurchaseAndReturn(purchaseData);
  }

  addPurchaseAndReturn(purchaseData: any): any {
    console.log('=== DATABASE SERVICE DEBUG ===');
    console.log('Purchase data received:', purchaseData);
    console.log('Items in purchase data:', purchaseData.items);
    
    const purchase = {
      ...purchaseData,
      id: Date.now(),
      createdDate: new Date().toISOString(),
      status: 'Completed'
    };
    
    console.log('Final purchase object being saved:', purchase);
    
    this.purchases.push(purchase);
    this.savePurchasesToLocalStorage();
    this.purchasesSubject.next([...this.purchases]);

    // Add stock transactions for each item and update inventory
    purchaseData.items.forEach((item: any) => {
      const stockTransaction = {
        ItemId: item.itemId,
        QuantityChange: item.quantity, // Positive for stock in
        Type: "Purchase",
        ReferenceId: purchase.id,
        Price: item.purchasePrice,
        CreatedDate: new Date().toISOString()
      };
      
      this.stockTransactions.push(stockTransaction);
      
      // Update the inventory item's stock quantity
      const inventoryItem = this.inventoryItems.find(invItem => invItem.id === item.itemId);
      if (inventoryItem) {
        // Update stock quantity - add to existing stock or set if not present
        inventoryItem.stock = (inventoryItem.stock || 0) + item.quantity;
        inventoryItem.stockQuantity = inventoryItem.stock; // Keep both fields in sync
      }
    });
    
    this.saveTransactionsToLocalStorage();
    this.transactionsSubject.next([...this.stockTransactions]);
    
    // Save updated inventory items
    this.saveToLocalStorage();
    this.itemsSubject.next([...this.inventoryItems]);
    
    return purchase;
  }

  deletePurchase(id: number): void {
    this.purchases = this.purchases.filter(p => p.id !== id);
    this.savePurchasesToLocalStorage();
    this.purchasesSubject.next([...this.purchases]);
  }

  // Sales/Invoice Management
  getSales(): Observable<any[]> {
    console.log('Database service - current sales:', this.sales); // Debug log
    // Ensure the current sales data is emitted
    this.salesSubject.next([...this.sales]);
    return this.salesSubject.asObservable();
  }

  addSale(saleData: any): void {
    const sale = {
      ...saleData,
      id: Date.now(),
      createdDate: new Date().toISOString(),
      status: 'Completed'
    };
    
    this.sales.push(sale);
    this.saveSalesToLocalStorage();
    this.salesSubject.next([...this.sales]);

    // Add stock transactions for each item (negative for sales) and update inventory
    saleData.items.forEach((item: any) => {
      const stockTransaction = {
        ItemId: item.itemId,
        QuantityChange: -item.quantity, // Negative for stock out
        Type: "Sale",
        ReferenceId: sale.id,
        Price: item.price,
        CreatedDate: new Date().toISOString()
      };
      
      this.stockTransactions.push(stockTransaction);
      
      // Update inventory item stock quantity
      const inventoryItem = this.inventoryItems.find(invItem => invItem.id === item.itemId);
      if (inventoryItem) {
        inventoryItem.stock = (inventoryItem.stock || 0) - item.quantity;
        inventoryItem.stockQuantity = (inventoryItem.stockQuantity || 0) - item.quantity;
        
        // Ensure stock doesn't go below 0
        if (inventoryItem.stock < 0) {
          inventoryItem.stock = 0;
        }
        if (inventoryItem.stockQuantity < 0) {
          inventoryItem.stockQuantity = 0;
        }
      }
    });
    
    this.saveTransactionsToLocalStorage();
    this.saveToLocalStorage();
    this.transactionsSubject.next([...this.stockTransactions]);
    this.itemsSubject.next([...this.inventoryItems]);
  }

  addSaleAndReturn(saleData: any): any {
    const sale = {
      ...saleData,
      id: Date.now(),
      createdDate: new Date().toISOString(),
      status: 'Completed'
    };
    
    this.sales.push(sale);
    this.saveSalesToLocalStorage();
    this.salesSubject.next([...this.sales]);

    // Add stock transactions for each item (negative for sales) and update inventory
    saleData.items.forEach((item: any) => {
      const stockTransaction = {
        ItemId: item.itemId,
        QuantityChange: -item.quantity, // Negative for stock out
        Type: "Sale",
        ReferenceId: sale.id,
        Price: item.price,
        CreatedDate: new Date().toISOString()
      };
      
      this.stockTransactions.push(stockTransaction);
      
      // Update inventory item stock quantity
      const inventoryItem = this.inventoryItems.find(invItem => invItem.id === item.itemId);
      if (inventoryItem) {
        inventoryItem.stock = (inventoryItem.stock || 0) - item.quantity;
        inventoryItem.stockQuantity = (inventoryItem.stockQuantity || 0) - item.quantity;
        
        // Ensure stock doesn't go below 0
        if (inventoryItem.stock < 0) {
          inventoryItem.stock = 0;
        }
        if (inventoryItem.stockQuantity < 0) {
          inventoryItem.stockQuantity = 0;
        }
      }
    });
    
    this.saveTransactionsToLocalStorage();
    this.saveToLocalStorage();
    this.transactionsSubject.next([...this.stockTransactions]);
    this.itemsSubject.next([...this.inventoryItems]);
    
    return sale;
  }

  deleteSale(id: number): void {
    this.sales = this.sales.filter(s => s.id !== id);
    this.saveSalesToLocalStorage();
    this.salesSubject.next([...this.sales]);
  }

  // Customer Management
  getCustomers(): Observable<any[]> {
    return this.customersSubject.asObservable();
  }

  addCustomer(customerData: any): void {
    const customer = {
      ...customerData,
      status: 'active' // Set all customers as active by default
    };
    this.customers.push(customer);
    this.saveCustomersToLocalStorage();
    this.customersSubject.next([...this.customers]);
  }

  getCustomersByType(customerType: string): Observable<any[]> {
    const filteredCustomers = this.customers.filter(customer => 
      customer.customerType === customerType && customer.status === 'active'
    );
    return new Observable(observer => {
      observer.next(filteredCustomers);
      observer.complete();
    });
  }

  getAllCustomersByType(customerType: string): Observable<any[]> {
    const filteredCustomers = this.customers.filter(customer => 
      customer.customerType === customerType
    );
    return new Observable(observer => {
      observer.next(filteredCustomers);
      observer.complete();
    });
  }

  getActiveCustomers(): Observable<any[]> {
    const activeCustomers = this.customers.filter(customer => customer.status === 'active');
    return new Observable(observer => {
      observer.next(activeCustomers);
      observer.complete();
    });
  }

  getActiveCustomersByType(customerType: string): Observable<any[]> {
    const filteredCustomers = this.customers.filter(customer => 
      customer.customerType === customerType && customer.status === 'active'
    );
    return new Observable(observer => {
      observer.next(filteredCustomers);
      observer.complete();
    });
  }

  updateCustomer(updatedCustomer: any): void {
    const index = this.customers.findIndex(c => c.id === updatedCustomer.id);
    if (index > -1) {
      this.customers[index] = updatedCustomer;
      this.saveCustomersToLocalStorage();
      this.customersSubject.next([...this.customers]);
    }
  }

  deleteCustomer(id: number): void {
    this.customers = this.customers.filter(c => c.id !== id);
    this.saveCustomersToLocalStorage();
    this.customersSubject.next([...this.customers]);
  }

  // Local Storage Methods
  private saveToLocalStorage(): void {
    localStorage.setItem('inventoryItems', JSON.stringify(this.inventoryItems));
  }

  private saveTransactionsToLocalStorage(): void {
    localStorage.setItem('stockTransactions', JSON.stringify(this.stockTransactions));
  }

  private savePurchasesToLocalStorage(): void {
    localStorage.setItem('purchases', JSON.stringify(this.purchases));
  }

  private saveSalesToLocalStorage(): void {
    localStorage.setItem('sales', JSON.stringify(this.sales));
  }

  private saveCustomersToLocalStorage(): void {
    localStorage.setItem('customers', JSON.stringify(this.customers));
  }

  private loadFromLocalStorage(): void {
    // Load inventory items
    const stored = localStorage.getItem('inventoryItems');
    if (stored) {
      this.inventoryItems = JSON.parse(stored);
      this.itemsSubject.next(this.inventoryItems);
    }

    // Load stock transactions
    const storedTransactions = localStorage.getItem('stockTransactions');
    if (storedTransactions) {
      this.stockTransactions = JSON.parse(storedTransactions);
      this.transactionsSubject.next(this.stockTransactions);
    }

    // Load purchases
    const storedPurchases = localStorage.getItem('purchases');
    if (storedPurchases) {
      this.purchases = JSON.parse(storedPurchases);
      this.purchasesSubject.next(this.purchases);
    }

    // Load sales
    const storedSales = localStorage.getItem('sales');
    if (storedSales) {
      this.sales = JSON.parse(storedSales);
      this.salesSubject.next(this.sales);
    } else {
      // Initialize with empty array if no sales exist
      this.sales = [];
      this.salesSubject.next(this.sales);
    }

    // Load customers
    const storedCustomers = localStorage.getItem('customers');
    if (storedCustomers) {
      this.customers = JSON.parse(storedCustomers);
      this.customersSubject.next(this.customers);
    }
  }

  // Clear all data (for testing)
  clearAllData(): void {
    this.inventoryItems = [];
    this.stockTransactions = [];
    this.purchases = [];
    this.sales = [];
    this.customers = [];
    this.saveToLocalStorage();
    this.saveTransactionsToLocalStorage();
    this.savePurchasesToLocalStorage();
    this.saveSalesToLocalStorage();
    this.saveCustomersToLocalStorage();
    this.itemsSubject.next([]);
    this.transactionsSubject.next([]);
    this.purchasesSubject.next([]);
    this.salesSubject.next([]);
    this.customersSubject.next([]);
  }
}
