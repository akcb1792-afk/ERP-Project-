import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2>{{ data.title }}</h2>
    <p>{{ data.message }}</p>
    <div style="text-align: right; margin-top: 20px;">
      <button (click)="onCancel()" style="margin-right: 10px; padding: 8px 16px; background: #f5f5f5; border: 1px solid #ddd; cursor: pointer;">{{ data.cancelText }}</button>
      <button (click)="onConfirm()" style="margin-right: 10px; padding: 8px 16px; background: #f44336; color: white; border: 1px solid #f44336; cursor: pointer;">{{ data.confirmText }}</button>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ConfirmDialogComponent>
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
