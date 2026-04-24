@echo off
echo === Testing ERP API CRUD Endpoints ===
echo.

echo Testing Categories CRUD...
echo 1. Create Category:
curl -X POST -H "Content-Type: application/json" -d "{\"name\":\"Test Category\",\"description\":\"Test Description\"}" http://localhost:5197/api/inventory/categories
echo.
echo 2. Get All Categories:
curl -X GET http://localhost:5197/api/inventory/categories
echo.
echo 3. Update Category (ID 1):
curl -X PUT -H "Content-Type: application/json" -d "{\"id\":1,\"name\":\"Updated Category\",\"description\":\"Updated Description\"}" http://localhost:5197/api/inventory/categories/1
echo.
echo 4. Delete Category (ID 1):
curl -X DELETE http://localhost:5197/api/inventory/categories/1
echo.
echo.

echo Testing Items CRUD...
echo 5. Create Item:
curl -X POST -H "Content-Type: application/json" -d "{\"name\":\"Test Item\",\"description\":\"Test Item Description\",\"categoryId\":1,\"price\":99.99,\"stockQuantity\":50,\"minimumStock\":10,\"unit\":\"PCS\"}" http://localhost:5197/api/inventory/items
echo.
echo 6. Get All Items:
curl -X GET http://localhost:5197/api/inventory/items
echo.
echo 7. Get Item by ID (ID 1):
curl -X GET http://localhost:5197/api/inventory/items/1
echo.
echo 8. Update Item (ID 1):
curl -X PUT -H "Content-Type: application/json" -d "{\"id\":1,\"name\":\"Updated Item\",\"description\":\"Updated Description\",\"categoryId\":1,\"price\":149.99,\"stockQuantity\":75,\"minimumStock\":15,\"unit\":\"PCS\"}" http://localhost:5197/api/inventory/items/1
echo.
echo 9. Delete Item (ID 1):
curl -X DELETE http://localhost:5197/api/inventory/items/1
echo.
echo.

echo Testing Customers CRUD...
echo 10. Create Customer:
curl -X POST -H "Content-Type: application/json" -d "{\"name\":\"Test Customer\",\"email\":\"test@example.com\",\"phone\":\"555-1234\",\"address\":\"123 Test St\",\"customerType\":\"Regular\"}" http://localhost:5197/api/customers
echo.
echo 11. Get All Customers:
curl -X GET http://localhost:5197/api/customers
echo.
echo 12. Update Customer (ID 1):
curl -X PUT -H "Content-Type: application/json" -d "{\"id\":1,\"name\":\"Updated Customer\",\"email\":\"updated@example.com\",\"phone\":\"555-5678\",\"address\":\"456 Updated Ave\",\"customerType\":\"Premium\"}" http://localhost:5197/api/customers/1
echo.
echo 13. Delete Customer (ID 1):
curl -X DELETE http://localhost:5197/api/customers/1
echo.
echo.

echo Testing Billing/Invoice CRUD...
echo 14. Create Invoice:
curl -X POST -H "Content-Type: application/json" -d "{\"customerId\":1,\"paymentType\":\"Cash\",\"items\":[{\"itemId\":1,\"quantity\":2,\"price\":99.99}]}" http://localhost:5197/api/billing/create
echo.
echo 15. Get All Invoices:
curl -X GET http://localhost:5197/api/billing/invoices
echo.
echo 16. Get Invoice by ID (ID 1):
curl -X GET http://localhost:5197/api/billing/invoices/1
echo.
echo.

echo Testing Stock Transactions...
echo 17. Create Stock Transaction:
curl -X POST -H "Content-Type: application/json" -d "{\"itemId\":1,\"transactionType\":\"Purchase\",\"quantityChange\":100,\"referenceType\":\"Adjustment\",\"unitPrice\":99.99,\"notes\":\"Opening Stock\"}" http://localhost:5197/api/inventory/stock-transactions
echo.
echo 18. Get All Stock Transactions:
curl -X GET http://localhost:5197/api/inventory/stock-transactions
echo.
echo 19. Get Current Stock:
curl -X GET http://localhost:5197/api/inventory/current-stock
echo.
echo 20. Get Low Stock Items:
curl -X GET http://localhost:5197/api/inventory/low-stock
echo.
echo.

echo === API Testing Complete ===
echo.
echo Check the responses above to verify all CRUD operations are working with SQL database.
echo.
echo Database: ERP_Database
echo Server: localhost (SQL Server)
echo Connection: Trusted Connection (Windows Authentication)
pause
