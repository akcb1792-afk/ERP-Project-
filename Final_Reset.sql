-- Final Database Reset: Clear ALL data properly with foreign key handling
USE ERP_Database;
GO

-- Disable all foreign key constraints
EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT ALL"
GO

-- Delete data from all tables in correct order (child tables first)
DELETE FROM StockTransactions;
DELETE FROM LedgerEntries;
DELETE FROM InvoiceItems;
DELETE FROM PurchaseOrderItems;
DELETE FROM Invoices;
DELETE FROM PurchaseOrders;
DELETE FROM Items;
DELETE FROM Customers;
DELETE FROM Categories;
GO

-- Reset identity columns to start from 0
DBCC CHECKIDENT ('Categories', RESEED, 0);
DBCC CHECKIDENT ('Items', RESEED, 0);
DBCC CHECKIDENT ('Customers', RESEED, 0);
DBCC CHECKIDENT ('Invoices', RESEED, 0);
DBCC CHECKIDENT ('InvoiceItems', RESEED, 0);
DBCC CHECKIDENT ('PurchaseOrders', RESEED, 0);
DBCC CHECKIDENT ('PurchaseOrderItems', RESEED, 0);
DBCC CHECKIDENT ('StockTransactions', RESEED, 0);
DBCC CHECKIDENT ('LedgerEntries', RESEED, 0);
GO

-- Insert ONLY Hardware and Software categories
INSERT INTO Categories (Name, Description, CreatedDate, IsActive) VALUES 
('Hardware', 'Computer hardware components and peripherals', GETDATE(), 1),
('Software', 'Software applications and licenses', GETDATE(), 1);
GO

-- Re-enable all foreign key constraints
EXEC sp_msforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL"
GO

-- Verify the results
SELECT COUNT(*) AS TotalCategories FROM Categories;
SELECT * FROM Categories ORDER BY Id;
GO

PRINT 'Database completely reset! Only Hardware and Software categories exist.';
GO
