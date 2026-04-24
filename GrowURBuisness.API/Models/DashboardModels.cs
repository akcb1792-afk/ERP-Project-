namespace GrowURBuisness.API.Models
{
    public class DashboardStats
    {
        public int TotalOrders { get; set; }
        public int TotalQuantitySold { get; set; }
        public double TotalPurchase { get; set; }
        public double TodaysTotal { get; set; }
        public int InventoryCount { get; set; }
        public double TotalAmount { get; set; }
        public int TotalCustomers { get; set; }
        public int TotalInvoices { get; set; }
        public double TotalRevenue { get; set; }
        public int LowStockItems { get; set; }
        public int PendingInvoices { get; set; }
    }

    public class Order
    {
        public string Id { get; set; }
        public string Customer { get; set; }
        public double Amount { get; set; }
        public DateTime Date { get; set; }
        public int Items { get; set; }
        public string Status { get; set; }
    }

    public class InventoryItem
    {
        public string Name { get; set; }
        public int Stock { get; set; }
        public string Category { get; set; }
        public double Price { get; set; }
    }
}
