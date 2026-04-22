import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from '../../services/database.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss']
})
export class CustomerListComponent implements OnInit {
  title = 'Customer Management';
  customers: any[] = [];
  filteredCustomers: any[] = [];
  displayedColumns = ['id', 'name', 'customerType', 'email', 'phone', 'createdDate', 'actions'];
  isLoading = false;
  editingCustomer: any = null;
  editForm: FormGroup;
  filterForm: FormGroup;
  customerTypes = ['Customer', 'Vendor'];

  constructor(
    private snackBar: MatSnackBar,
    private databaseService: DatabaseService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      address: [''],
      customerType: ['Customer', Validators.required]
    });
    
    this.filterForm = this.fb.group({
      searchName: [''],
      customerType: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.databaseService.getCustomers().subscribe(customers => {
      this.customers = customers.map(customer => ({
        ...customer,
        status: customer.status || 'active', // Set default status to active if not present
        createdDate: new Date(customer.createdDate).toLocaleDateString()
      }));
      this.filteredCustomers = [...this.customers]; // Initialize filtered customers
      this.isLoading = false;
    });
  }

  editCustomer(customer: any) {
    this.editingCustomer = customer;
    this.editForm.patchValue({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      customerType: customer.customerType
    });
  }

  saveCustomer(): void {
    if (this.editForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly', 'Error', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    const updatedData = {
      ...this.editingCustomer,
      ...this.editForm.value
    };

    // Update customer in the database service
    this.databaseService.updateCustomer(updatedData);

    // Update customer in the local array for immediate UI update
    const index = this.customers.findIndex(c => c.id === this.editingCustomer.id);
    if (index > -1) {
      this.customers[index] = updatedData;
    }

    this.snackBar.open(`${updatedData.name} updated successfully!`, 'Success', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });

    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingCustomer = null;
    this.editForm.reset();
  }

  deactivateCustomer(customer: any) {
    if (confirm(`Are you sure you want to deactivate "${customer.name}"?`)) {
      // Update customer status to inactive
      customer.status = 'inactive';
      
      // Update customer in database service
      this.databaseService.updateCustomer(customer);
      
      // Update in local array
      const index = this.customers.findIndex(c => c.id === customer.id);
      if (index > -1) {
        this.customers[index] = customer;
      }
      
      this.snackBar.open(`${customer.name} deactivated successfully`, 'Deactivated', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  }

  toggleCustomerStatus(customer: any) {
    if (customer.status === 'active') {
      this.deactivateCustomer(customer);
    } else {
      customer.status = 'active';
      // Update customer in database service
      this.databaseService.updateCustomer(customer);
      
      // Update in local array
      const index = this.customers.findIndex(c => c.id === customer.id);
      if (index > -1) {
        this.customers[index] = customer;
      }
      
      this.snackBar.open(`${customer.name} activated successfully`, 'Activated', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredCustomers = this.customers.filter(customer => {
      // Customer name search filter
      if (filters.searchName && !customer.name.toLowerCase().includes(filters.searchName.toLowerCase())) {
        return false;
      }
      
      // Customer type filter
      if (filters.customerType && customer.customerType !== filters.customerType) {
        return false;
      }
      
      // Status filter
      if (filters.status && customer.status !== filters.status) {
        return false;
      }
      
      return true;
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      searchName: '',
      customerType: '',
      status: ''
    });
    this.filteredCustomers = [...this.customers];
  }
}
