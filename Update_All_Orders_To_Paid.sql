-- Update All Orders to Paid Status
-- This script will update both Invoices (Sales Orders) and Purchase Orders to 'Paid' status

USE ERP_Database;
GO

PRINT 'Starting update of all orders to paid status...';
GO

-- Update all Invoices (Sales Orders) to 'Paid' status
PRINT 'Updating Invoices to Paid status...';
UPDATE Invoices 
SET Status = 'Paid', 
    LastModifiedDate = GETDATE()
WHERE Status != 'Paid';

DECLARE @InvoiceCount INT = @@ROWCOUNT;
PRINT 'Updated ' + CAST(@InvoiceCount AS NVARCHAR(10)) + ' invoices to Paid status';
GO

-- Update all Purchase Orders to 'Paid' status
PRINT 'Updating Purchase Orders to Paid status...';
UPDATE PurchaseOrders 
SET Status = 'Paid', 
    LastModifiedDate = GETDATE()
WHERE Status != 'Paid';

DECLARE @PurchaseOrderCount INT = @@ROWCOUNT;
PRINT 'Updated ' + CAST(@PurchaseOrderCount AS NVARCHAR(10)) + ' purchase orders to Paid status';
GO

-- Display summary of updated records
PRINT '=== SUMMARY ===';
PRINT 'Total Invoices Updated: ' + CAST(@InvoiceCount AS NVARCHAR(10));
PRINT 'Total Purchase Orders Updated: ' + CAST(@PurchaseOrderCount AS NVARCHAR(10));
PRINT 'All orders have been successfully updated to Paid status!';
GO

-- Verify the updates by showing current status counts
PRINT '=== VERIFICATION ===';
PRINT 'Current Invoice Status Counts:';
SELECT Status, COUNT(*) as Count 
FROM Invoices 
GROUP BY Status 
ORDER BY Status;
GO

PRINT 'Current Purchase Order Status Counts:';
SELECT Status, COUNT(*) as Count 
FROM PurchaseOrders 
GROUP BY Status 
ORDER BY Status;
GO

PRINT 'Update completed successfully!';
