using Microsoft.AspNetCore.Mvc;
using GrowURBuisness.API.Models;

namespace GrowURBuisness.API.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        [HttpGet("stats")]
        public ActionResult<DashboardStats> GetStats()
        {
            // Calculate stats from sample data
            var stats = new DashboardStats
            {
                TotalOrders = SampleData.Orders.Count,
                TotalQuantitySold = SampleData.Orders.Sum(o => o.Items),
                TotalPurchase = SampleData.Orders.Where(o => o.Status == "Completed").Sum(o => o.Amount),
                TodaysTotal = SampleData.Orders.Where(o => o.Date.Date == DateTime.Today).Sum(o => o.Amount),
                InventoryCount = SampleData.InventoryItems.Count,
                TotalAmount = SampleData.Invoices.Sum(i => i.Amount),
                TotalCustomers = SampleData.Customers.Count,
                TotalInvoices = SampleData.Invoices.Count,
                TotalRevenue = SampleData.Invoices.Where(i => i.Status == "Paid").Sum(i => i.Amount),
                LowStockItems = SampleData.InventoryItems.Count(item => item.Stock < 10),
                PendingInvoices = SampleData.Invoices.Count(i => i.Status == "Pending")
            };

            return Ok(stats);
        }

        [HttpGet("recent-invoices")]
        public ActionResult<IEnumerable<Invoice>> GetRecentInvoices()
        {
            var recentInvoices = SampleData.Invoices
                .OrderByDescending(i => i.Date)
                .Take(5)
                .ToList();

            return Ok(recentInvoices);
        }

        [HttpGet("recent-orders")]
        public ActionResult<IEnumerable<Order>> GetRecentOrders()
        {
            var recentOrders = SampleData.Orders
                .OrderByDescending(o => o.Date)
                .Take(5)
                .ToList();

            return Ok(recentOrders);
        }

        [HttpGet("low-stock-items")]
        public ActionResult<IEnumerable<InventoryItem>> GetLowStockItems()
        {
            var lowStockItems = SampleData.InventoryItems
                .Where(item => item.Stock < 10)
                .OrderBy(item => item.Stock)
                .Take(10)
                .ToList();

            return Ok(lowStockItems);
        }
    }
}
