import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss']
})
export class ItemDetailComponent implements OnInit {
  title = 'Item Details';
  
  item: any = {};
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadItem();
  }

  loadItem(): void {
    this.isLoading = true;
    const itemId = this.route.snapshot.paramMap.get('id');
    
    if (itemId) {
      this.http.get<any>(`${environment.apiUrl}/inventory/items/${itemId}`).subscribe({
        next: (item) => {
          this.item = item;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading item:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  onEdit() {
    console.log('Edit item:', this.item);
  }

  onDelete() {
    console.log('Delete item:', this.item);
  }
}
