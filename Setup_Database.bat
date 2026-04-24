@echo off
echo === ERP Database Setup ===
echo.

echo Step 1: Creating database and tables...
sqlcmd -S localhost -E -i "Create_Database.sql"

if %ERRORLEVEL% EQU 0 (
    echo Database schema created successfully!
) else (
    echo Error creating database schema. Please check SQL Server is running.
    pause
    exit /b 1
)

echo.
echo Step 2: Inserting sample data...
sqlcmd -S localhost -E -i "Insert_Sample_Data.sql"

if %ERRORLEVEL% EQU 0 (
    echo Sample data inserted successfully!
) else (
    echo Error inserting sample data.
    pause
    exit /b 1
)

echo.
echo === Database Setup Complete ===
echo.
echo Database: ERP_Database
echo Server: localhost
echo Tables created: Categories, Items, Customers, Vendors, Invoices, InvoiceItems, PurchaseOrders, PurchaseOrderItems, StockTransactions, LedgerEntries
echo Sample data inserted for testing
echo.
echo You can now connect to the database using:
echo - SQL Server Management Studio
echo - Visual Studio Server Explorer
echo - Any SQL Server client
echo.
echo Connection string for application:
echo Server=localhost;Database=ERP_Database;Trusted_Connection=true;
echo.
pause
