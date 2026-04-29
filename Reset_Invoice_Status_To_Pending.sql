-- Reset All Invoice Status to Pending
-- This script will reset all invoices to 'Pending' status to ensure new orders start with correct status

USE ERP_Database;
GO

PRINT 'Resetting all invoice statuses to Pending...';
GO

-- Update all Invoices to 'Pending' status
UPDATE Invoices 
SET Status = 'Pending', 
    LastModifiedDate = GETDATE()
WHERE Status != 'Pending';

DECLARE @InvoiceCount INT = @@ROWCOUNT;
PRINT 'Reset ' + CAST(@InvoiceCount AS NVARCHAR(10)) + ' invoices to Pending status';
GO

-- Display summary of updated records
PRINT '=== SUMMARY ===';
PRINT 'Total Invoices Reset to Pending: ' + CAST(@InvoiceCount AS NVARCHAR(10));
PRINT 'All invoices have been reset to Pending status!';
GO

-- Verify the updates by showing current status counts
PRINT '=== VERIFICATION ===';
PRINT 'Current Invoice Status Counts:';
SELECT Status, COUNT(*) as Count 
FROM Invoices 
GROUP BY Status 
ORDER BY Status;
GO

PRINT 'Invoice status reset completed successfully!';
