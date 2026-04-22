import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReportsService, SalesReportItem } from '../../services/reports.service';

@Component({
  selector: 'app-sales-report',
  templateUrl: './sales-report.component.html',
  styleUrls: ['./sales-report.component.scss']
})
export class SalesReportComponent implements OnInit {
  title = 'Sales Report';
  
  salesData = [
    { date: '2024-01-15', totalSales: 1250.50, invoiceCount: 8 },
    { date: '2024-01-14', totalSales: 980.25, invoiceCount: 6 },
    { date: '2024-01-13', totalSales: 1450.75, invoiceCount: 10 }
  ];

  displayedColumns = ['date', 'totalSales', 'invoiceCount'];
  
  totalSales = this.salesData.reduce((sum, item) => sum + item.totalSales, 0);
  totalInvoices = this.salesData.reduce((sum, item) => sum + item.invoiceCount, 0);

  ngOnInit() {
    // Initialize component
  }
}
