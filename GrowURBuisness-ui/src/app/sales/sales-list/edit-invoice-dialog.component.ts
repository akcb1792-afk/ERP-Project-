import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DialogData {
  invoice: any;
  customers: any[];
}

@Component({
  selector: 'app-edit-invoice-dialog',
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>View/Edit Invoice</h2>
      <mat-dialog-content>
        <form [formGroup]="editForm" class="edit-form">
          <!-- Invoice Number (Readonly) -->
          <mat-form-field appearance="outline">
            <mat-label>Invoice Number</mat-label>
            <input matInput formControlName="invoiceNo" readonly>
          </mat-form-field>

          <!-- Customer Selection (Readonly) -->
          <mat-form-field appearance="outline">
            <mat-label>Customer</mat-label>
            <input matInput [value]="getCustomerName()" readonly>
          </mat-form-field>

          <!-- Payment Type (Editable) -->
          <mat-form-field appearance="outline">
            <mat-label>Payment Type</mat-label>
            <mat-select formControlName="paymentType">
              <mat-option value="Cash">Cash</mat-option>
              <mat-option value="UPI">UPI</mat-option>
              <mat-option value="Credit">Credit</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Status (Readonly - will be set based on payment type) -->
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <input matInput formControlName="status" readonly>
          </mat-form-field>

          <!-- Items Section (Readonly) -->
          <div class="items-section">
            <h3>Items</h3>
            <div class="items-list" *ngIf="items.length > 0">
              <div class="item-row" *ngFor="let item of items; let i = index">
                <mat-form-field appearance="outline">
                  <mat-label>Item Name</mat-label>
                  <input matInput formControlName="itemName_{{i}}" readonly>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Quantity</mat-label>
                  <input matInput type="number" formControlName="quantity_{{i}}" readonly>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Price</mat-label>
                  <input matInput type="number" formControlName="price_{{i}}" readonly>
                </mat-form-field>
              </div>
            </div>
          </div>
        </form>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="onSave()">
          Update
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 20px;
      max-width: 600px;
    }
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .items-section {
      margin-top: 20px;
    }
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    .item-row {
      display: flex;
      gap: 12px;
      align-items: end;
    }
    .item-row mat-form-field {
      flex: 1;
    }
    h3 {
      margin-bottom: 16px;
      color: #333;
    }
    input[readonly] {
      color: #666;
      background-color: #f5f5f5;
    }
  `]
})
export class EditInvoiceDialogComponent implements OnInit {
  editForm: FormGroup;
  items: any[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditInvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.editForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    const invoice = this.data.invoice;
    
    // Initialize items
    this.items = invoice.items || invoice.invoiceItems || [];
    if (this.items.length === 0) {
      this.items = [{ itemName: '', quantity: 1, price: 0 }];
    }

    // Build form controls - remove validation since only payment type is editable
    const formControls: any = {
      invoiceNo: [invoice.invoiceNo || invoice.invoiceNumber || ''],
      customerId: [invoice.customerId || ''],
      paymentType: [invoice.paymentType || 'Cash', Validators.required],
      status: [invoice.status || '']
    };

    // Add item controls - no validation since they're readonly
    this.items.forEach((item, index) => {
      formControls[`itemName_${index}`] = [item.name || item.itemName || ''];
      formControls[`quantity_${index}`] = [item.quantity || 1];
      formControls[`price_${index}`] = [item.price || item.salePrice || item.unitPrice || 0];
    });

    this.editForm = this.fb.group(formControls);

    // Update status when payment type changes
    this.editForm.get('paymentType')?.valueChanges.subscribe(paymentType => {
      const status = paymentType === 'Credit' ? 'Pending' : 'Paid';
      this.editForm.get('status')?.setValue(status);
    });
  }

  addItem(): void {
    const newIndex = this.items.length;
    this.items.push({ itemName: '', quantity: 1, price: 0 });

    // Add new form controls
    this.editForm.addControl(`itemName_${newIndex}`, this.fb.control('', Validators.required));
    this.editForm.addControl(`quantity_${newIndex}`, this.fb.control(1, [Validators.required, Validators.min(1)]));
    this.editForm.addControl(`price_${newIndex}`, this.fb.control(0, [Validators.required, Validators.min(0)]));
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    
    // Remove form controls
    this.editForm.removeControl(`itemName_${index}`);
    this.editForm.removeControl(`quantity_${index}`);
    this.editForm.removeControl(`price_${index}`);

    // Rebuild form with updated indices
    this.initializeForm();
  }

  getCustomerName(): string {
    const invoice = this.data.invoice;
    
    // Enhanced customer lookup similar to sales list component
    const customer = this.data.customers.find((c: any) => {
      const cId = c.id || c.customerId || c.Id || c.CustomerId;
      const invoiceCustomerId = invoice.customerId || invoice.customer_id || invoice.CustomerId;
      return cId?.toString() === invoiceCustomerId?.toString() || 
             cId === invoiceCustomerId ||
             parseInt(cId) === parseInt(invoiceCustomerId);
    });
    
    // Try multiple name fields
    if (customer) {
      return customer.name || customer.customerName || customer.CustomerName || customer.customer_name || 'Unknown Customer';
    } else if (invoice.customerName || invoice.CustomerName || invoice.customer_name) {
      return invoice.customerName || invoice.CustomerName || invoice.customer_name;
    } else if (invoice.customer?.name || invoice.customer?.customerName) {
      return invoice.customer?.name || invoice.customer?.customerName;
    }
    
    return 'Unknown Customer';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    const formValue = this.editForm.value;
    
    // Send only the data that the backend API expects
    const updatedInvoice = {
      id: this.data.invoice.id,
      paymentType: formValue.paymentType,
      status: formValue.status
    };

    console.log('Dialog sending updated invoice:', updatedInvoice);
    this.dialogRef.close(updatedInvoice);
  }
}
