-- Complete Database Reset: Clear ALL data and insert only Hardware/Software
USE ERP_Database;
GO

-- First, disable all foreign key constraints
EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT ALL"
GO

-- Clear all tables in correct order (child tables first)
TRUNCATE TABLE StockTransactions;
TRUNCATE TABLE LedgerEntries;
TRUNCATE TABLE InvoiceItems;
TRUNCATE TABLE PurchaseOrderItems;
TRUNCATE TABLE Invoices;
TRUNCATE TABLE PurchaseOrders;
TRUNCATE TABLE Items;
TRUNCATE TABLE Customers;
TRUNCATE TABLE Categories;
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
SELECT * FROM Categories;
GO

PRINT 'Database completely reset! Only Hardware and Software categories exist.';
GO
