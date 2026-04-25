import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReportsRoutingModule } from './reports-routing.module';
import { SalesReportComponent } from './sales-report/sales-report.component';
import { SalesReportEnhancedComponent } from './sales-report/sales-report-enhanced.component';
import { PurchaseReportComponent } from './purchase-report/purchase-report.component';
import { InventoryReportComponent } from './inventory-report/inventory-report.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CustomerLedgerComponent } from './customer-ledger/customer-ledger.component';
import { DayBookComponent } from './day-book/day-book.component';
import { TopCustomersComponent } from './top-customers/top-customers.component';
import { PurchaseItemWiseComponent } from './purchase-item-wise/purchase-item-wise.component';
import { SupplierLedgerComponent } from './supplier-ledger/supplier-ledger.component';
import { ItemWiseSalesComponent } from './item-wise-sales/item-wise-sales.component';
import { TopSuppliersComponent } from './top-suppliers/top-suppliers.component';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatNativeDateModule } from '@angular/material/core';

@NgModule({
  declarations: [
    SalesReportComponent,
    SalesReportEnhancedComponent,
    PurchaseReportComponent,
    InventoryReportComponent,
    DashboardComponent,
    CustomerLedgerComponent,
    DayBookComponent,
    TopCustomersComponent,
    PurchaseItemWiseComponent,
    SupplierLedgerComponent,
    ItemWiseSalesComponent,
    TopSuppliersComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ReportsRoutingModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class ReportsModule { }
