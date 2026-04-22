// Reports routing configuration
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SalesReportComponent } from './sales-report/sales-report.component';
import { SalesReportEnhancedComponent } from './sales-report/sales-report-enhanced.component';
import { PurchaseReportComponent } from './purchase-report/purchase-report.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'sales', component: SalesReportComponent },
  { path: 'sales-enhanced', component: SalesReportEnhancedComponent },
  { path: 'purchase', component: PurchaseReportComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
