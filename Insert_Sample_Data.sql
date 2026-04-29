USE ERP_Database;
GO

-- Clear existing data
DELETE FROM StockTransactions;
DELETE FROM LedgerEntries;
DELETE FROM InvoiceItems;
DELETE FROM Invoices;
DELETE FROM PurchaseOrderItems;
DELETE FROM PurchaseOrders;
DELETE FROM Items;
DELETE FROM Customers;
DELETE FROM Vendors;
DELETE FROM Categories;
GO

-- Insert Categories
INSERT INTO Categories (Name, Description) VALUES
('Electronics', 'Electronic devices and components'),
('Office Supplies', 'Stationery and office items'),
('Furniture', 'Office furniture and equipment'),
('Software', 'Software licenses and digital products'),
('Hardware', 'Computer hardware and peripherals'),
('Accessories', 'Mobile and computer accessories');
GO

-- Insert Customers
INSERT INTO Customers (Name, Email, Phone, Address, CustomerType) VALUES
('John Doe', 'john.doe@email.com', '555-0101', '123 Main St, City, State', 'Regular'),
('Jane Smith', 'jane.smith@email.com', '555-0102', '456 Oak Ave, City, State', 'Premium'),
('Bob Johnson', 'bob.johnson@email.com', '555-0103', '789 Pine Rd, City, State', 'Regular'),
('Alice Brown', 'alice.brown@email.com', '555-0104', '321 Elm St, City, State', 'Premium'),
('Charlie Wilson', 'charlie.wilson@email.com', '555-0105', '654 Maple Dr, City, State', 'Regular'),
('Diana Martinez', 'diana.martinez@email.com', '555-0106', '987 Cedar Ln, City, State', 'Premium'),
('Edward Davis', 'edward.davis@email.com', '555-0107', '147 Birch Way, City, State', 'Regular'),
('Fiona Garcia', 'fiona.garcia@email.com', '555-0108', '258 Spruce St, City, State', 'Premium'),
('George Miller', 'george.miller@email.com', '555-0109', '369 Willow Ave, City, State', 'Regular'),
('Hannah Anderson', 'hannah.anderson@email.com', '555-0110', '741 Poplar Dr, City, State', 'Premium');
GO

-- Insert Vendors
INSERT INTO Vendors (Name, Email, Phone, Address, GSTNumber) VALUES
('ABC Supplies', 'info@abc-supplies.com', '555-1001', '100 Vendor St, City, State', 'GST001'),
('XYZ Electronics', 'contact@xyz-electronics.com', '555-1002', '200 Tech Park, City, State', 'GST002'),
('Global Trading Co', 'sales@globaltrading.com', '555-1003', '300 Trade Center, City, State', 'GST003'),
('Tech Components Ltd', 'orders@techcomponents.com', '555-1004', '400 Component Ave, City, State', 'GST004'),
('Industrial Parts Inc', 'info@industrialparts.com', '555-1005', '500 Industrial Blvd, City, State', 'GST005');
GO

-- Insert Items
INSERT INTO Items (Name, Description, CategoryId, Price, StockQuantity, MinimumStock, Unit) VALUES
('Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 1, 25.00, 50, 10, 'PCS'),
('Mechanical Keyboard', 'RGB mechanical gaming keyboard', 1, 75.00, 30, 5, 'PCS'),
('24" Monitor', 'LED monitor 24 inch full HD', 1, 199.99, 20, 3, 'PCS'),
('USB-C Hub', '7-port USB-C hub with HDMI', 6, 35.00, 40, 8, 'PCS'),
('Laptop Stand', 'Adjustable aluminum laptop stand', 2, 45.00, 25, 5, 'PCS'),
('Webcam HD', '1080p HD webcam with microphone', 1, 59.99, 35, 7, 'PCS'),
('Desk Lamp', 'LED desk lamp with adjustable arm', 2, 29.99, 45, 10, 'PCS'),
('Notebook Set', 'Premium notebook set with pens', 2, 12.99, 100, 20, 'SET'),
('Pen Holder', 'Desktop pen organizer', 2, 8.99, 60, 12, 'PCS'),
('Phone Stand', 'Adjustable phone stand for desk', 6, 15.99, 80, 15, 'PCS');
GO

-- Insert Sample Invoices
INSERT INTO Invoices (InvoiceNumber, CustomerId, TotalAmount, DiscountAmount, TaxAmount, FinalAmount, PaymentType, Status, InvoiceDate, DueDate) VALUES
('INV-2024-001', 1, 175.00, 5.00, 8.75, 178.75, 'Cash', 'Pending', GETDATE(), DATEADD(DAY, 7, GETDATE())),
('INV-2024-002', 2, 299.99, 10.00, 14.50, 304.49, 'Card', 'Pending', GETDATE(), DATEADD(DAY, 7, GETDATE())),
('INV-2024-003', 3, 450.50, 15.00, 21.75, 457.25, 'Cash', 'Pending', GETDATE(), DATEADD(DAY, 7, GETDATE())),
('INV-2024-004', 4, 125.00, 0.00, 6.25, 131.25, 'Card', 'Pending', GETDATE(), DATEADD(DAY, 7, GETDATE())),
('INV-2024-005', 5, 675.25, 25.00, 32.51, 682.76, 'Cash', 'Pending', GETDATE(), DATEADD(DAY, 7, GETDATE()));
GO

-- Insert Invoice Items
INSERT INTO InvoiceItems (InvoiceId, ItemId, Quantity, UnitPrice, DiscountAmount, TotalAmount) VALUES
(1, 1, 3, 25.00, 0.00, 75.00),  -- 3 Wireless Mouse
(1, 2, 1, 75.00, 0.00, 75.00),  -- 1 Mechanical Keyboard
(1, 6, 1, 59.99, 5.00, 54.99), -- 1 Webcam HD (with discount)
(2, 3, 1, 199.99, 0.00, 199.99), -- 1 Monitor
(2, 4, 2, 35.00, 0.00, 70.00),  -- 2 USB-C Hub
(2, 5, 1, 45.00, 0.00, 45.00),  -- 1 Laptop Stand
(3, 2, 2, 75.00, 0.00, 150.00), -- 2 Mechanical Keyboard
(3, 3, 1, 199.99, 0.00, 199.99), -- 1 Monitor
(3, 6, 1, 59.99, 0.00, 59.99),  -- 1 Webcam HD
(3, 7, 1, 29.99, 0.00, 29.99),  -- 1 Desk Lamp
(4, 1, 2, 25.00, 0.00, 50.00),  -- 2 Wireless Mouse
(4, 8, 2, 12.99, 0.00, 25.98),  -- 2 Notebook Set
(4, 9, 1, 8.99, 0.00, 8.99),   -- 1 Pen Holder
(4, 10, 2, 15.99, 0.00, 31.98), -- 2 Phone Stand
(5, 3, 2, 199.99, 0.00, 399.98), -- 2 Monitor
(5, 2, 1, 75.00, 0.00, 75.00),  -- 1 Mechanical Keyboard
(5, 6, 2, 59.99, 0.00, 119.98), -- 2 Webcam HD
(5, 4, 1, 35.00, 0.00, 35.00),  -- 1 USB-C Hub
(5, 5, 1, 45.00, 0.00, 45.00);  -- 1 Laptop Stand
GO

-- Insert Sample Purchase Orders
INSERT INTO PurchaseOrders (PurchaseOrderNumber, VendorId, TotalAmount, Status, OrderDate, ExpectedDeliveryDate) VALUES
('PO-2024-001', 1, 420.00, 'Completed', GETDATE(), DATEADD(DAY, 3, GETDATE())),
('PO-2024-002', 2, 875.50, 'Completed', GETDATE(), DATEADD(DAY, 5, GETDATE())),
('PO-2024-003', 3, 320.00, 'Completed', GETDATE(), DATEADD(DAY, 4, GETDATE())),
('PO-2024-004', 4, 650.25, 'Pending', GETDATE(), DATEADD(DAY, 7, GETDATE())),
('PO-2024-005', 5, 980.00, 'Pending', GETDATE(), DATEADD(DAY, 10, GETDATE()));
GO

-- Insert Purchase Order Items
INSERT INTO PurchaseOrderItems (PurchaseOrderId, ItemId, Quantity, UnitPrice, TotalAmount, ReceivedQuantity) VALUES
(1, 1, 10, 20.00, 200.00, 10), -- 10 Wireless Mouse
(1, 2, 3, 40.00, 120.00, 3),   -- 3 Mechanical Keyboard
(1, 6, 2, 50.00, 100.00, 2),   -- 2 Webcam HD
(2, 3, 2, 180.00, 360.00, 2),  -- 2 Monitor
(2, 4, 5, 30.00, 150.00, 5),   -- 5 USB-C Hub
(2, 5, 1, 40.00, 40.00, 1),    -- 1 Laptop Stand
(2, 6, 3, 55.00, 165.00, 3),   -- 3 Webcam HD
(2, 7, 2, 25.00, 50.00, 2),    -- 2 Desk Lamp
(3, 8, 10, 10.00, 100.00, 10), -- 10 Notebook Set
(3, 9, 5, 8.00, 40.00, 5),     -- 5 Pen Holder
(3, 10, 8, 15.00, 120.00, 8),  -- 8 Phone Stand
(3, 1, 2, 20.00, 40.00, 2),    -- 2 Wireless Mouse
(4, 3, 3, 190.00, 570.00, 0),  -- 3 Monitor (not received)
(4, 2, 1, 70.00, 70.00, 0),    -- 1 Mechanical Keyboard (not received)
(4, 6, 1, 50.00, 50.00, 0);    -- 1 Webcam HD (not received)
GO

-- Insert Stock Transactions
INSERT INTO StockTransactions (ItemId, TransactionType, QuantityChange, ReferenceType, ReferenceId, UnitPrice, Notes, TransactionDate) VALUES
-- Opening Balance
(1, 'Opening', 50, NULL, NULL, 20.00, 'Opening stock - Wireless Mouse', GETDATE()),
(2, 'Opening', 30, NULL, NULL, 40.00, 'Opening stock - Mechanical Keyboard', GETDATE()),
(3, 'Opening', 20, NULL, NULL, 180.00, 'Opening stock - Monitor', GETDATE()),
(4, 'Opening', 40, NULL, NULL, 30.00, 'Opening stock - USB-C Hub', GETDATE()),
(5, 'Opening', 25, NULL, NULL, 40.00, 'Opening stock - Laptop Stand', GETDATE()),
(6, 'Opening', 35, NULL, NULL, 50.00, 'Opening stock - Webcam HD', GETDATE()),
(7, 'Opening', 45, NULL, NULL, 25.00, 'Opening stock - Desk Lamp', GETDATE()),
(8, 'Opening', 100, NULL, NULL, 10.00, 'Opening stock - Notebook Set', GETDATE()),
(9, 'Opening', 60, NULL, NULL, 8.00, 'Opening stock - Pen Holder', GETDATE()),
(10, 'Opening', 80, NULL, NULL, 15.00, 'Opening stock - Phone Stand', GETDATE()),
-- Purchase Receipts
(1, 'Purchase', 10, 'PurchaseOrder', 1, 20.00, 'Purchase receipt - PO-2024-001', GETDATE()),
(2, 'Purchase', 3, 'PurchaseOrder', 1, 40.00, 'Purchase receipt - PO-2024-001', GETDATE()),
(6, 'Purchase', 2, 'PurchaseOrder', 1, 50.00, 'Purchase receipt - PO-2024-001', GETDATE()),
-- Sales
(1, 'Sale', -3, 'Invoice', 1, 25.00, 'Sale - INV-2024-001', GETDATE()),
(2, 'Sale', -1, 'Invoice', 1, 75.00, 'Sale - INV-2024-001', GETDATE()),
(6, 'Sale', -1, 'Invoice', 1, 59.99, 'Sale - INV-2024-001', GETDATE());
GO

-- Insert Ledger Entries
INSERT INTO LedgerEntries (TransactionType, ReferenceType, ReferenceId, AccountType, DebitAmount, CreditAmount, Balance, Description, TransactionDate) VALUES
-- Sales entries
('Sale', 'Invoice', 1, 'Cash', 178.75, 0, 178.75, 'Cash payment for INV-2024-001', GETDATE()),
('Sale', 'Invoice', 1, 'Accounts Receivable', 0, 175.00, 175.00, 'Invoice amount for INV-2024-001', GETDATE()),
('Sale', 'Invoice', 2, 'Accounts Receivable', 0, 299.99, 299.99, 'Invoice amount for INV-2024-002', GETDATE()),
('Sale', 'Invoice', 3, 'Cash', 457.25, 0, 457.25, 'Cash payment for INV-2024-003', GETDATE()),
('Sale', 'Invoice', 3, 'Accounts Receivable', 0, 450.50, 450.50, 'Invoice amount for INV-2024-003', GETDATE()),
-- Purchase entries
('Purchase', 'PurchaseOrder', 1, 'Accounts Payable', 420.00, 0, 420.00, 'Purchase order PO-2024-001', GETDATE()),
('Purchase', 'PurchaseOrder', 2, 'Accounts Payable', 875.50, 0, 875.50, 'Purchase order PO-2024-002', GETDATE()),
('Purchase', 'PurchaseOrder', 3, 'Accounts Payable', 320.00, 0, 320.00, 'Purchase order PO-2024-003', GETDATE());
GO

PRINT 'Sample data inserted successfully!';
GO
