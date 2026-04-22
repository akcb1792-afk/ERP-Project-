namespace GrowURBuisness.API.Models
{
    public static class SampleData
    {
        public static List<Customer> Customers => new List<Customer>
        {
            new Customer { Id = 1, Name = "John Doe", Email = "john.doe@email.com", Phone = "555-0101" },
            new Customer { Id = 2, Name = "Jane Smith", Email = "jane.smith@email.com", Phone = "555-0102" },
            new Customer { Id = 3, Name = "Bob Johnson", Email = "bob.johnson@email.com", Phone = "555-0103" },
            new Customer { Id = 4, Name = "Alice Brown", Email = "alice.brown@email.com", Phone = "555-0104" },
            new Customer { Id = 5, Name = "Charlie Wilson", Email = "charlie.wilson@email.com", Phone = "555-0105" },
            new Customer { Id = 6, Name = "Diana Martinez", Email = "diana.martinez@email.com", Phone = "555-0106" },
            new Customer { Id = 7, Name = "Edward Davis", Email = "edward.davis@email.com", Phone = "555-0107" },
            new Customer { Id = 8, Name = "Fiona Garcia", Email = "fiona.garcia@email.com", Phone = "555-0108" },
            new Customer { Id = 9, Name = "George Miller", Email = "george.miller@email.com", Phone = "555-0109" },
            new Customer { Id = 10, Name = "Hannah Anderson", Email = "hannah.anderson@email.com", Phone = "555-0110" }
        };

        public static List<InventoryItem> InventoryItems => new List<InventoryItem>
        {
            new InventoryItem { Name = "Wireless Mouse", Stock = 5, Category = "Electronics", Price = 25.00 },
            new InventoryItem { Name = "Mechanical Keyboard", Stock = 8, Category = "Electronics", Price = 75.00 },
            new InventoryItem { Name = "24\" Monitor", Stock = 3, Category = "Electronics", Price = 199.99 },
            new InventoryItem { Name = "USB-C Hub", Stock = 2, Category = "Accessories", Price = 35.00 },
            new InventoryItem { Name = "Laptop Stand", Stock = 4, Category = "Accessories", Price = 45.00 },
            new InventoryItem { Name = "Webcam HD", Stock = 12, Category = "Electronics", Price = 59.99 },
            new InventoryItem { Name = "Desk Lamp", Stock = 7, Category = "Office", Price = 29.99 },
            new InventoryItem { Name = "Notebook Set", Stock = 25, Category = "Stationery", Price = 12.99 },
            new InventoryItem { Name = "Pen Holder", Stock = 18, Category = "Stationery", Price = 8.99 },
            new InventoryItem { Name = "Phone Stand", Stock = 9, Category = "Accessories", Price = 15.99 }
        };

        public static List<Invoice> Invoices => new List<Invoice>
        {
            new Invoice { Id = 1, Customer = "John Doe", Amount = 175.00, Date = DateTime.Now, Items = 5, Status = "Paid" },
            new Invoice { Id = 2, Customer = "Jane Smith", Amount = 299.99, Date = DateTime.Now.AddDays(-1), Items = 3, Status = "Pending" },
            new Invoice { Id = 3, Customer = "Bob Johnson", Amount = 450.50, Date = DateTime.Now.AddDays(-2), Items = 8, Status = "Paid" },
            new Invoice { Id = 4, Customer = "Alice Brown", Amount = 125.00, Date = DateTime.Now.AddDays(-3), Items = 2, Status = "Paid" },
            new Invoice { Id = 5, Customer = "Charlie Wilson", Amount = 675.25, Date = DateTime.Now.AddDays(-4), Items = 12, Status = "Pending" },
            new Invoice { Id = 6, Customer = "Diana Martinez", Amount = 89.99, Date = DateTime.Now.AddDays(-5), Items = 1, Status = "Paid" },
            new Invoice { Id = 7, Customer = "Edward Davis", Amount = 234.50, Date = DateTime.Now.AddDays(-6), Items = 4, Status = "Pending" },
            new Invoice { Id = 8, Customer = "Fiona Garcia", Amount = 567.00, Date = DateTime.Now.AddDays(-7), Items = 7, Status = "Paid" },
            new Invoice { Id = 9, Customer = "George Miller", Amount = 145.75, Date = DateTime.Now.AddDays(-8), Items = 3, Status = "Paid" },
            new Invoice { Id = 10, Customer = "Hannah Anderson", Amount = 398.25, Date = DateTime.Now.AddDays(-9), Items = 6, Status = "Pending" }
        };

        public static List<Order> Orders => new List<Order>
        {
            new Order { Id = "ORD-001", Customer = "John Doe", Amount = 175.00, Date = DateTime.Now, Items = 5, Status = "Completed" },
            new Order { Id = "ORD-002", Customer = "Jane Smith", Amount = 299.99, Date = DateTime.Now.AddHours(-1), Items = 3, Status = "Processing" },
            new Order { Id = "ORD-003", Customer = "Bob Johnson", Amount = 450.50, Date = DateTime.Now.AddHours(-2), Items = 8, Status = "Completed" },
            new Order { Id = "ORD-004", Customer = "Alice Brown", Amount = 125.00, Date = DateTime.Now.AddHours(-3), Items = 2, Status = "Shipped" },
            new Order { Id = "ORD-005", Customer = "Charlie Wilson", Amount = 675.25, Date = DateTime.Now.AddHours(-4), Items = 12, Status = "Processing" },
            new Order { Id = "ORD-006", Customer = "Diana Martinez", Amount = 89.99, Date = DateTime.Now.AddHours(-5), Items = 1, Status = "Completed" },
            new Order { Id = "ORD-007", Customer = "Edward Davis", Amount = 234.50, Date = DateTime.Now.AddHours(-6), Items = 4, Status = "Shipped" },
            new Order { Id = "ORD-008", Customer = "Fiona Garcia", Amount = 567.00, Date = DateTime.Now.AddHours(-7), Items = 7, Status = "Processing" },
            new Order { Id = "ORD-009", Customer = "George Miller", Amount = 145.75, Date = DateTime.Now.AddHours(-8), Items = 3, Status = "Completed" },
            new Order { Id = "ORD-010", Customer = "Hannah Anderson", Amount = 398.25, Date = DateTime.Now.AddHours(-9), Items = 6, Status = "Shipped" }
        };

        // Report Data Methods
        public static SalesReport GetSalesReportData(DateTime? fromDate, DateTime? toDate)
        {
            var salesData = Orders;
            
            if (fromDate.HasValue)
                salesData = salesData.Where(o => o.Date >= fromDate.Value).ToList();
            if (toDate.HasValue)
                salesData = salesData.Where(o => o.Date <= toDate.Value).ToList();

            var dailySales = salesData
                .GroupBy(o => o.Date.Date)
                .Select(g => new DailySalesItem
                {
                    Date = g.Key,
                    TotalSales = g.Sum(o => o.Amount),
                    SalesCount = g.Count()
                })
                .OrderBy(d => d.Date)
                .ToList();

            return new SalesReport
            {
                DailySalesList = dailySales,
                TotalSalesAmount = salesData.Sum(o => o.Amount),
                TotalSalesCount = salesData.Count
            };
        }

        public static PurchaseReport GetPurchaseReportData(DateTime? fromDate, DateTime? toDate, string? vendorId)
        {
            var purchaseData = GetSamplePurchases();
            
            if (fromDate.HasValue)
                purchaseData = purchaseData.Where(p => p.PurchaseDate >= fromDate.Value).ToList();
            if (toDate.HasValue)
                purchaseData = purchaseData.Where(p => p.PurchaseDate <= toDate.Value).ToList();
            if (!string.IsNullOrEmpty(vendorId))
                purchaseData = purchaseData.Where(p => p.VendorId == vendorId).ToList();

            var dailyPurchases = purchaseData
                .GroupBy(p => p.PurchaseDate.Date)
                .Select(g => new DailyPurchaseItem
                {
                    Date = g.Key,
                    TotalPurchase = g.Sum(p => p.TotalAmount),
                    PurchaseCount = g.Count()
                })
                .OrderBy(d => d.Date)
                .ToList();

            return new PurchaseReport
            {
                DailyPurchaseList = dailyPurchases,
                TotalPurchaseAmount = purchaseData.Sum(p => p.TotalAmount),
                TotalPurchaseCount = purchaseData.Count
            };
        }

        public static List<DetailedPurchaseItem> GetDetailedPurchaseData(DateTime? fromDate, DateTime? toDate, string? vendorId)
        {
            var purchaseData = GetSamplePurchases();
            
            if (fromDate.HasValue)
                purchaseData = purchaseData.Where(p => p.PurchaseDate >= fromDate.Value).ToList();
            if (toDate.HasValue)
                purchaseData = purchaseData.Where(p => p.PurchaseDate <= toDate.Value).ToList();
            if (!string.IsNullOrEmpty(vendorId))
                purchaseData = purchaseData.Where(p => p.VendorId == vendorId).ToList();

            return purchaseData.Select(p => new DetailedPurchaseItem
            {
                OrderId = p.OrderId,
                PurchaseDate = p.PurchaseDate,
                VendorName = p.VendorName,
                TotalAmount = p.TotalAmount,
                TotalItems = p.TotalItems
            }).ToList();
        }

        public static List<Controllers.PurchaseItem> GetPurchaseItems(int orderId)
        {
            var items = new List<Controllers.PurchaseItem>
            {
                new Controllers.PurchaseItem { ProductName = "Wireless Mouse", Quantity = 5, Rate = 25.00, Amount = 125.00 },
                new Controllers.PurchaseItem { ProductName = "Mechanical Keyboard", Quantity = 3, Rate = 75.00, Amount = 225.00 },
                new Controllers.PurchaseItem { ProductName = "USB-C Hub", Quantity = 2, Rate = 35.00, Amount = 70.00 }
            };
            return items;
        }

        private static List<SamplePurchase> GetSamplePurchases()
        {
            return new List<SamplePurchase>
            {
                new SamplePurchase { OrderId = 1, PurchaseDate = DateTime.Now, VendorId = "1", VendorName = "ABC Supplies", TotalAmount = 420.00, TotalItems = 10 },
                new SamplePurchase { OrderId = 2, PurchaseDate = DateTime.Now.AddDays(-1), VendorId = "2", VendorName = "XYZ Electronics", TotalAmount = 875.50, TotalItems = 15 },
                new SamplePurchase { OrderId = 3, PurchaseDate = DateTime.Now.AddDays(-2), VendorId = "3", VendorName = "Global Trading Co", TotalAmount = 320.00, TotalItems = 8 },
                new SamplePurchase { OrderId = 4, PurchaseDate = DateTime.Now.AddDays(-3), VendorId = "1", VendorName = "ABC Supplies", TotalAmount = 650.25, TotalItems = 12 },
                new SamplePurchase { OrderId = 5, PurchaseDate = DateTime.Now.AddDays(-4), VendorId = "4", VendorName = "Tech Components Ltd", TotalAmount = 980.00, TotalItems = 20 }
            };
        }
    }

    // Helper class for purchase data
    public class SamplePurchase
    {
        public int OrderId { get; set; }
        public DateTime PurchaseDate { get; set; }
        public string VendorId { get; set; } = string.Empty;
        public string VendorName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public int TotalItems { get; set; }
    }
}
