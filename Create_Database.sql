-- Create ERP Database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ERP_Database')
BEGIN
    CREATE DATABASE ERP_Database;
END
GO

USE ERP_Database;
GO

-- Create Categories Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Categories' AND xtype='U')
BEGIN
    CREATE TABLE Categories (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500),
        CreatedDate DATETIME DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1
    );
END
GO

-- Create Items Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Items' AND xtype='U')
BEGIN
    CREATE TABLE Items (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000),
        CategoryId INT FOREIGN KEY REFERENCES Categories(Id),
        Price DECIMAL(18,2) NOT NULL,
        StockQuantity INT DEFAULT 0,
        MinimumStock INT DEFAULT 0,
        Unit NVARCHAR(50) DEFAULT 'PCS',
        CreatedDate DATETIME DEFAULT GETDATE(),
        LastModifiedDate DATETIME DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1
    );
END
GO

-- Create Customers Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Customers' AND xtype='U')
BEGIN
    CREATE TABLE Customers (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Email NVARCHAR(100),
        Phone NVARCHAR(20),
        Address NVARCHAR(500),
        CustomerType NVARCHAR(50) DEFAULT 'Regular',
        CreatedDate DATETIME DEFAULT GETDATE(),
        LastModifiedDate DATETIME DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1
    );
END
GO

-- Create Vendors Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Vendors' AND xtype='U')
BEGIN
    CREATE TABLE Vendors (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Email NVARCHAR(100),
        Phone NVARCHAR(20),
        Address NVARCHAR(500),
        GSTNumber NVARCHAR(50),
        CreatedDate DATETIME DEFAULT GETDATE(),
        LastModifiedDate DATETIME DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1
    );
END
GO

-- Create Invoices Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Invoices' AND xtype='U')
BEGIN
    CREATE TABLE Invoices (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        InvoiceNumber NVARCHAR(50) UNIQUE NOT NULL,
        CustomerId INT FOREIGN KEY REFERENCES Customers(Id),
        TotalAmount DECIMAL(18,2) NOT NULL,
        DiscountAmount DECIMAL(18,2) DEFAULT 0,
        TaxAmount DECIMAL(18,2) DEFAULT 0,
        FinalAmount DECIMAL(18,2) NOT NULL,
        PaymentType NVARCHAR(50) DEFAULT 'Cash',
        Status NVARCHAR(50) DEFAULT 'Pending',
        InvoiceDate DATETIME DEFAULT GETDATE(),
        DueDate DATETIME,
        CreatedDate DATETIME DEFAULT GETDATE(),
        LastModifiedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create Invoice Items Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='InvoiceItems' AND xtype='U')
BEGIN
    CREATE TABLE InvoiceItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        InvoiceId INT FOREIGN KEY REFERENCES Invoices(Id) ON DELETE CASCADE,
        ItemId INT FOREIGN KEY REFERENCES Items(Id),
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(18,2) NOT NULL,
        DiscountAmount DECIMAL(18,2) DEFAULT 0,
        TotalAmount DECIMAL(18,2) NOT NULL,
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create Purchase Orders Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PurchaseOrders' AND xtype='U')
BEGIN
    CREATE TABLE PurchaseOrders (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        PurchaseOrderNumber NVARCHAR(50) UNIQUE NOT NULL,
        VendorId INT FOREIGN KEY REFERENCES Vendors(Id),
        TotalAmount DECIMAL(18,2) NOT NULL,
        Status NVARCHAR(50) DEFAULT 'Pending',
        OrderDate DATETIME DEFAULT GETDATE(),
        ExpectedDeliveryDate DATETIME,
        CreatedDate DATETIME DEFAULT GETDATE(),
        LastModifiedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create Purchase Order Items Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PurchaseOrderItems' AND xtype='U')
BEGIN
    CREATE TABLE PurchaseOrderItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        PurchaseOrderId INT FOREIGN KEY REFERENCES PurchaseOrders(Id) ON DELETE CASCADE,
        ItemId INT FOREIGN KEY REFERENCES Items(Id),
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(18,2) NOT NULL,
        TotalAmount DECIMAL(18,2) NOT NULL,
        ReceivedQuantity INT DEFAULT 0,
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create Stock Transactions Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StockTransactions' AND xtype='U')
BEGIN
    CREATE TABLE StockTransactions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ItemId INT FOREIGN KEY REFERENCES Items(Id),
        TransactionType NVARCHAR(50) NOT NULL, -- 'Purchase', 'Sale', 'Adjustment', 'Opening'
        QuantityChange INT NOT NULL, -- Positive for stock in, negative for stock out
        ReferenceType NVARCHAR(50), -- 'Invoice', 'PurchaseOrder', 'Adjustment'
        ReferenceId INT,
        UnitPrice DECIMAL(18,2),
        Notes NVARCHAR(500),
        TransactionDate DATETIME DEFAULT GETDATE(),
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create Ledger Entries Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LedgerEntries' AND xtype='U')
BEGIN
    CREATE TABLE LedgerEntries (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TransactionType NVARCHAR(50) NOT NULL, -- 'Sale', 'Purchase', 'Payment', 'Receipt'
        ReferenceType NVARCHAR(50), -- 'Invoice', 'PurchaseOrder'
        ReferenceId INT,
        AccountType NVARCHAR(50) NOT NULL, -- 'Cash', 'Bank', 'Accounts Receivable', 'Accounts Payable'
        DebitAmount DECIMAL(18,2) DEFAULT 0,
        CreditAmount DECIMAL(18,2) DEFAULT 0,
        Balance DECIMAL(18,2),
        Description NVARCHAR(500),
        TransactionDate DATETIME DEFAULT GETDATE(),
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

PRINT 'Database schema created successfully!';
GO
