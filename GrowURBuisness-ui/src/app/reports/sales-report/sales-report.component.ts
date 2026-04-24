import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sales-report',
  templateUrl: './sales-report.component.html',
  styleUrls: ['./sales-report.component.scss']
})
export class SalesReportComponent implements OnInit {
  title = 'Sales Report';
  
  salesData: any[] = [];
  displayedColumns = ['date', 'totalSales', 'invoiceCount'];
  isLoading = false;
  totalSales = 0;
  totalInvoices = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSalesReport();
  }

  loadSalesReport(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/dashboard/invoices`).subscribe({
      next: (invoices) => {
        // Group invoices by date and calculate totals
        const groupedData = invoices.reduce((acc: any, invoice) => {
          const date = new Date(invoice.invoiceDate).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = { date, totalSales: 0, invoiceCount: 0 };
          }
          acc[date].totalSales += invoice.totalAmount || 0;
          acc[date].invoiceCount += 1;
          return acc;
        }, {});

        this.salesData = Object.values(groupedData);
        
        // Calculate totals for the template
        this.totalSales = this.salesData.reduce((sum, item) => sum + (item.totalSales || 0), 0);
        this.totalInvoices = this.salesData.reduce((sum, item) => sum + (item.invoiceCount || 0), 0);
        
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading sales report:', error);
        this.salesData = [];
        this.totalSales = 0;
        this.totalInvoices = 0;
        this.isLoading = false;
      }
    });
  }
}
