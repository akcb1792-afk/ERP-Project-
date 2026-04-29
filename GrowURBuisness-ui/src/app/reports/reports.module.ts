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
import { ItemWiseSalesComponent } from './item-wise-sales/item-wise-sales.component';
import { TopCustomersComponent } from './top-customers/top-customers.component';
import { PurchaseItemWiseComponent } from './purchase-item-wise/purchase-item-wise.component';
import { SupplierLedgerComponent } from './supplier-ledger/supplier-ledger.component';
import { MaterialModule } from '../shared/material.module';

@NgModule({
  declarations: [
    SalesReportComponent,
    SalesReportEnhancedComponent,
    PurchaseReportComponent,
    InventoryReportComponent,
    DashboardComponent,
    CustomerLedgerComponent,
    DayBookComponent,
    ItemWiseSalesComponent,
    TopCustomersComponent,
    PurchaseItemWiseComponent,
    SupplierLedgerComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ReportsRoutingModule,
    MaterialModule
  ]
})
export class ReportsModule { }
