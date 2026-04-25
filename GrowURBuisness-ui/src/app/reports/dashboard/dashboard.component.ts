import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  title = 'Reports Dashboard';

  constructor(private router: Router) {}

  navigateToPurchaseReport(): void {
    this.router.navigate(['/reports/purchase']);
  }

  navigateToSalesReport(): void {
    this.router.navigate(['/reports/sales']);
  }

  navigateToCustomerLedger(): void {
    this.router.navigate(['/reports/customer-ledger']);
  }

  navigateToDayBook(): void {
    this.router.navigate(['/reports/day-book']);
  }

  navigateToTopCustomers(): void {
    this.router.navigate(['/reports/top-customers']);
  }

  navigateToPurchaseItemWise(): void {
    this.router.navigate(['/reports/purchase-item-wise']);
  }

  navigateToSupplierLedger(): void {
    this.router.navigate(['/reports/supplier-ledger']);
  }

  navigateToItemWiseSales(): void {
    this.router.navigate(['/reports/item-wise-sales']);
  }

  navigateToTopSuppliers(): void {
    this.router.navigate(['/reports/top-suppliers']);
  }
}
