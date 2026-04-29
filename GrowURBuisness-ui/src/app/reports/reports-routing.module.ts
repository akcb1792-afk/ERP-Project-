// Reports routing configuration
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SalesReportComponent } from './sales-report/sales-report.component';
import { SalesReportEnhancedComponent } from './sales-report/sales-report-enhanced.component';
import { PurchaseReportComponent } from './purchase-report/purchase-report.component';
import { CustomerLedgerComponent } from './customer-ledger/customer-ledger.component';
import { DayBookComponent } from './day-book/day-book.component';
import { ItemWiseSalesComponent } from './item-wise-sales/item-wise-sales.component';
import { TopCustomersComponent } from './top-customers/top-customers.component';
import { PurchaseItemWiseComponent } from './purchase-item-wise/purchase-item-wise.component';
import { SupplierLedgerComponent } from './supplier-ledger/supplier-ledger.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'sales', component: SalesReportComponent },
  { path: 'sales-enhanced', component: SalesReportEnhancedComponent },
  { path: 'purchase', component: PurchaseReportComponent },
  { path: 'customer-ledger', component: CustomerLedgerComponent },
  { path: 'day-book', component: DayBookComponent },
  { path: 'item-wise-sales', component: ItemWiseSalesComponent },
  { path: 'top-customers', component: TopCustomersComponent },
  { path: 'purchase-item-wise', component: PurchaseItemWiseComponent },
  { path: 'supplier-ledger', component: SupplierLedgerComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
