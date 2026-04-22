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
}
