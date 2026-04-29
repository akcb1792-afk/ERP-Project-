using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GrowURBuisness.API.Data;
using GrowURBuisness.API.Models;

namespace GrowURBuisness.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/dashboard/stats
        [HttpGet("stats")]
        public async Task<ActionResult<object>> GetDashboardStats()
        {
            var totalCustomers = await _context.Customers.CountAsync(c => c.IsActive);
            var totalItems = await _context.Items.CountAsync(i => i.IsActive);
            var totalInvoices = await _context.Invoices.CountAsync();
            var totalStockQuantity = await _context.Items.Where(i => i.IsActive).SumAsync(i => i.StockQuantity);
            var lowStockItems = await _context.Items
                .Include(i => i.Category)
                .Where(i => i.IsActive && i.StockQuantity <= i.MinimumStock)
                .CountAsync();
            
            var totalRevenue = await _context.Invoices
                .SumAsync(i => i.TotalAmount);
            
            var today = DateTime.Today;
            var todayRevenue = await _context.Invoices
                .Where(i => i.InvoiceDate.Date == today)
                .SumAsync(i => i.TotalAmount);

            // Calculate purchase orders data
            var thisMonthStart = new DateTime(today.Year, today.Month, 1);
            
            var todaysSellOrders = await _context.Invoices
                .Where(i => i.InvoiceDate.Date == today)
                .CountAsync();
            
            var todaysPurchaseOrders = await _context.PurchaseOrders
                .Where(po => po.OrderDate.Date == today)
                .CountAsync();
            
            var thisMonthTotalSell = await _context.Invoices
                .Where(i => i.InvoiceDate >= thisMonthStart)
                .SumAsync(i => i.TotalAmount);
            
            var thisMonthTotalPurchase = await _context.PurchaseOrders
                .Where(po => po.OrderDate >= thisMonthStart)
                .SumAsync(po => po.TotalAmount);
            
            var todaysPurchase = await _context.PurchaseOrders
                .Where(po => po.OrderDate.Date == today)
                .SumAsync(po => po.TotalAmount);

            var stats = new
            {
                TodaysSell = todayRevenue,
                TodaysPurchase = todaysPurchase,
                TodaysSellOrder = todaysSellOrders,
                TodaysPurchaseOrder = todaysPurchaseOrders,
                LowStockItems = lowStockItems,
                ThisMonthTotalSell = thisMonthTotalSell,
                ThisMonthTotalPurchase = thisMonthTotalPurchase,
                TotalOrders = totalInvoices,
                TotalQuantitySold = totalStockQuantity,
                TotalPurchase = todaysPurchase,
                TodaysTotal = todayRevenue,
                InventoryCount = totalItems,
                TotalAmount = totalRevenue,
                TotalCustomers = totalCustomers,
                TotalInvoices = totalInvoices,
                TotalRevenue = totalRevenue,
                TotalSalesQuantity = totalStockQuantity,
                TotalPurchaseQuantity = 0,
                TotalSalesValue = totalRevenue,
                TotalPurchaseValue = thisMonthTotalPurchase,
                Profit = totalRevenue - thisMonthTotalPurchase,
                PendingInvoices = await _context.Invoices.CountAsync(i => i.Status == "Pending")
            };

            return Ok(stats);
        }

        // GET: api/dashboard/recent-invoices
        [HttpGet("recent-invoices")]
        public async Task<ActionResult<object>> GetRecentInvoices()
        {
            var recentInvoices = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.InvoiceItems)
                .OrderByDescending(i => i.InvoiceDate)
                .Take(5)
                .Select(i => new
                {
                    i.Id,
                    Customer = i.Customer.Name,
                    Amount = i.TotalAmount,
                    Date = i.InvoiceDate,
                    Items = i.InvoiceItems.Count,
                    Status = i.Status
                })
                .ToListAsync();

            return Ok(recentInvoices);
        }

        // GET: api/dashboard/recent-orders
        [HttpGet("recent-orders")]
        public async Task<ActionResult<object>> GetRecentOrders()
        {
            var recentOrders = await _context.Invoices
                .Include(i => i.Customer)
                .OrderByDescending(i => i.InvoiceDate)
                .Take(5)
                .Select(i => new
                {
                    Id = $"INV-{i.Id:D3}",
                    Customer = i.Customer.Name,
                    Amount = i.TotalAmount,
                    Date = i.InvoiceDate,
                    Items = i.InvoiceItems.Count,
                    Status = i.Status == "Paid" ? "Completed" : "Processing"
                })
                .ToListAsync();

            return Ok(recentOrders);
        }

        // GET: api/dashboard/low-stock
        [HttpGet("low-stock")]
        public async Task<ActionResult<object>> GetLowStockItems()
        {
            var lowStockItems = await _context.Items
                .Include(i => i.Category)
                .Where(i => i.IsActive && i.StockQuantity <= i.MinimumStock)
                .Select(i => new
                {
                    i.Id,
                    Name = i.Name,
                    Category = i.Category.Name,
                    Stock = i.StockQuantity,
                    MinimumStock = i.MinimumStock,
                    Price = i.Price,
                    Shortage = i.MinimumStock - i.StockQuantity
                })
                .ToListAsync();

            return Ok(lowStockItems);
        }

        // GET: api/dashboard/customers (temporary workaround)
        [HttpGet("customers")]
        public async Task<ActionResult<object>> GetCustomers()
        {
            var customers = await _context.Customers
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Email,
                    c.Phone,
                    c.CustomerType,
                    c.CreatedDate,
                    c.IsActive
                })
                .ToListAsync();

            return Ok(customers);
        }

        // POST: api/dashboard/customers (temporary workaround)
        [HttpPost("customers")]
        public async Task<ActionResult<object>> CreateCustomer([FromBody] Customer customer)
        {
            try
            {
                customer.CreatedDate = DateTime.Now;
                customer.LastModifiedDate = DateTime.Now;
                customer.IsActive = true;

                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();

                var result = new
                {
                    customer.Id,
                    customer.Name,
                    customer.Email,
                    customer.Phone,
                    customer.CustomerType,
                    customer.CreatedDate,
                    customer.IsActive
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/dashboard/latest-sales-orders
        [HttpGet("latest-sales-orders")]
        public async Task<ActionResult<object>> GetLatestSalesOrders()
        {
            var latestSalesOrders = await _context.Invoices
                .Include(i => i.Customer)
                .OrderByDescending(i => i.InvoiceDate)
                .Take(10)
                .Select(i => new
                {
                    i.Id,
                    InvoiceNumber = i.InvoiceNumber ?? "INV-" + i.Id.ToString("D6"),
                    CustomerName = i.Customer.Name,
                    i.TotalAmount,
                    i.InvoiceDate,
                    Status = i.Status ?? "Completed",
                    ItemCount = _context.InvoiceItems.Where(ii => ii.InvoiceId == i.Id).Count()
                })
                .ToListAsync();

            return Ok(latestSalesOrders);
        }

        // GET: api/dashboard/latest-purchase-orders
        [HttpGet("latest-purchase-orders")]
        public async Task<ActionResult<object>> GetLatestPurchaseOrders()
        {
            var latestPurchaseOrders = await _context.PurchaseOrders
                .Include(po => po.Vendor)
                .OrderByDescending(po => po.OrderDate)
                .Take(10)
                .Select(po => new
                {
                    po.Id,
                    PurchaseOrderNumber = po.PurchaseOrderNumber ?? "PO-" + po.Id.ToString("D6"),
                    VendorName = po.Vendor.Name,
                    po.TotalAmount,
                    po.OrderDate,
                    Status = po.Status ?? "Pending",
                    ItemCount = _context.PurchaseOrderItems.Where(poi => poi.PurchaseOrderId == po.Id).Count()
                })
                .ToListAsync();

            return Ok(latestPurchaseOrders);
        }

        // GET: api/dashboard/top-lowest-stock
        [HttpGet("top-lowest-stock")]
        public async Task<ActionResult<object>> GetTopLowestStock()
        {
            var topLowestStock = await _context.Items
                .Include(i => i.Category)
                .Where(i => i.IsActive)
                .OrderBy(i => i.StockQuantity)
                .Take(10)
                .Select(i => new
                {
                    i.Id,
                    i.Name,
                    i.StockQuantity,
                    i.MinimumStock,
                    i.Price,
                    CategoryName = i.Category.Name,
                    Shortage = i.MinimumStock - i.StockQuantity > 0 ? i.MinimumStock - i.StockQuantity : 0,
                    Status = i.StockQuantity <= i.MinimumStock ? "Low Stock" : "In Stock"
                })
                .ToListAsync();

            return Ok(topLowestStock);
        }
    }
}
