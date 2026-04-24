-- Reset Database: Delete all data and insert only hardware/software categories
USE ERP_Database;
GO

-- Disable foreign key constraints
EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT ALL"
GO

-- Delete all data from all tables in correct order (child tables first)
DELETE FROM StockTransactions;
DELETE FROM LedgerEntries;
DELETE FROM InvoiceItems;
DELETE FROM PurchaseOrderItems;
DELETE FROM Invoices;
DELETE FROM PurchaseOrders;
DELETE FROM Items;
DELETE FROM Customers;
DELETE FROM Vendors;
DELETE FROM Categories;
GO

-- Reset identity columns
DBCC CHECKIDENT ('Categories', RESEED, 0);
DBCC CHECKIDENT ('Items', RESEED, 0);
DBCC CHECKIDENT ('Customers', RESEED, 0);
DBCC CHECKIDENT ('Vendors', RESEED, 0);
DBCC CHECKIDENT ('Invoices', RESEED, 0);
DBCC CHECKIDENT ('InvoiceItems', RESEED, 0);
DBCC CHECKIDENT ('PurchaseOrders', RESEED, 0);
DBCC CHECKIDENT ('PurchaseOrderItems', RESEED, 0);
DBCC CHECKIDENT ('StockTransactions', RESEED, 0);
DBCC CHECKIDENT ('LedgerEntries', RESEED, 0);
GO

-- Insert only Hardware and Software categories
INSERT INTO Categories (Name, Description, CreatedDate, IsActive) VALUES 
('Hardware', 'Computer hardware components and peripherals', GETDATE(), 1),
('Software', 'Software applications and licenses', GETDATE(), 1);
GO

-- Re-enable foreign key constraints
EXEC sp_msforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL"
GO

PRINT 'Database reset complete! Only Hardware and Software categories inserted.';
GO
