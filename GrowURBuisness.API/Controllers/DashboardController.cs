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
                .Where(i => i.Status == "Paid")
                .SumAsync(i => i.TotalAmount);
            
            var today = DateTime.Today;
            var todayRevenue = await _context.Invoices
                .Where(i => i.InvoiceDate.Date == today && i.Status == "Paid")
                .SumAsync(i => i.TotalAmount);

            var stats = new
            {
                TotalOrders = totalInvoices,
                TotalQuantitySold = totalStockQuantity,
                TotalPurchase = 0.0, // No purchase orders in current schema
                TodaysTotal = todayRevenue,
                InventoryCount = totalItems,
                TotalAmount = totalRevenue,
                TotalCustomers = totalCustomers,
                TotalInvoices = totalInvoices,
                TotalRevenue = totalRevenue,
                TotalSalesQuantity = totalStockQuantity,
                TotalPurchaseQuantity = 0,
                TotalSalesValue = totalRevenue,
                TotalPurchaseValue = 0.0,
                Profit = totalRevenue - 0m, // Revenue - purchase cost
                LowStockItems = lowStockItems,
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
    }
}
