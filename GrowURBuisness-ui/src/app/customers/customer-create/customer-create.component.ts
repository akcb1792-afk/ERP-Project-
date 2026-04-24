import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-create',
  templateUrl: './customer-create.component.html',
  styleUrls: ['./customer-create.component.scss']
})
export class CustomerCreateComponent implements OnInit {
  title = 'Create New Customer';
  customerForm: FormGroup;
  isLoading = false;
  
  customerTypes = ['Customer', 'Vendor'];

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      address: [''],
      customerType: ['Customer', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly', 'Error', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    this.isLoading = true;
    
    const customerData = {
      ...this.customerForm.value,
      createdDate: new Date().toISOString()
    };

    this.customerService.addCustomer(customerData).subscribe({
      next: () => {
        this.snackBar.open('Customer created successfully!', 'Success', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });

        this.customerForm.reset();
        this.isLoading = false;
        this.router.navigate(['/customers/list']);
      },
      error: (error) => {
        console.error('Error creating customer:', error);
        this.snackBar.open('Failed to create customer', 'Error', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/customers/list']);
  }
}
