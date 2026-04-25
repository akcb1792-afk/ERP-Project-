using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GrowURBuisness.API.Data;
using GrowURBuisness.API.Models;

namespace GrowURBuisness.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/reports/sales/detailed
        [HttpGet("sales/detailed")]
        public async Task<ActionResult<object>> GetDetailedSalesReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, [FromQuery] int? customerId = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            try
            {
                var query = _context.Invoices
                    .Include(i => i.Customer)
                    .Include(i => i.InvoiceItems)
                    .ThenInclude(ii => ii.Item)
                    .AsQueryable();

                if (fromDate.HasValue)
                    query = query.Where(i => i.InvoiceDate.Date >= fromDate.Value.Date);

                if (toDate.HasValue)
                    query = query.Where(i => i.InvoiceDate.Date <= toDate.Value.Date);

                if (customerId.HasValue)
                    query = query.Where(i => i.CustomerId == customerId.Value);

                // Get total count for pagination
                var totalCount = await query.CountAsync();
                
                // Apply pagination
                var invoices = await query
                    .OrderByDescending(i => i.InvoiceDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Flatten the data - each row represents one item
                var flattenedData = invoices.SelectMany(invoice => invoice.InvoiceItems.Select(item => new
                {
                    SalesOrderNo = invoice.InvoiceNumber,
                    CustomerName = invoice.Customer.Name,
                    Date = invoice.InvoiceDate,
                    ItemName = item.Item.Name,
                    ItemRate = item.UnitPrice,
                    Quantity = item.Quantity,
                    Amount = item.TotalAmount,
                    CustomerId = invoice.CustomerId,
                    InvoiceId = invoice.Id,
                    PaymentType = invoice.PaymentType,
                    Status = invoice.Status
                })).OrderByDescending(x => x.Date).ToList();

                // Calculate summary (based on all data, not just current page)
                var allInvoices = await query
                    .Include(i => i.Customer)
                    .Include(i => i.InvoiceItems)
                    .ThenInclude(ii => ii.Item)
                    .ToListAsync();
                
                var allFlattenedData = allInvoices.SelectMany(invoice => invoice.InvoiceItems.Select(item => new
                {
                    SalesOrderNo = invoice.InvoiceNumber,
                    CustomerName = invoice.Customer.Name,
                    Date = invoice.InvoiceDate,
                    ItemName = item.Item.Name,
                    ItemRate = item.UnitPrice,
                    Quantity = item.Quantity,
                    Amount = item.TotalAmount,
                    CustomerId = invoice.CustomerId,
                    InvoiceId = invoice.Id,
                    PaymentType = invoice.PaymentType,
                    Status = invoice.Status
                })).ToList();

                // Calculate summary
                var summary = new
                {
                    TotalSales = allFlattenedData.Sum(x => x.Amount),
                    TotalOrders = allFlattenedData.Select(x => x.SalesOrderNo).Distinct().Count(),
                    TotalItems = allFlattenedData.Count,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                var pagination = new
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                    HasNextPage = page * pageSize < totalCount,
                    HasPreviousPage = page > 1
                };

                return Ok(new { Data = flattenedData, Summary = summary, Pagination = pagination });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating detailed sales report: {ex.Message}" });
            }
        }

        // GET: api/reports/sales
        [HttpGet("sales")]
        public async Task<ActionResult<object>> GetSalesReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = _context.Invoices
                    .Include(i => i.Customer)
                    .Include(i => i.InvoiceItems)
                    .ThenInclude(ii => ii.Item)
                    .AsQueryable();

                if (fromDate.HasValue)
                    query = query.Where(i => i.InvoiceDate >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(i => i.InvoiceDate <= toDate.Value);

                var invoices = await query.OrderByDescending(i => i.InvoiceDate).ToListAsync();

                // Group by date
                var dailySales = invoices
                    .GroupBy(i => i.InvoiceDate.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        TotalSales = g.Sum(i => i.TotalAmount),
                        InvoiceCount = g.Count(),
                        PaidSales = g.Where(i => i.Status == "Paid").Sum(i => i.TotalAmount),
                        PaidCount = g.Count(i => i.Status == "Paid"),
                        PendingSales = g.Where(i => i.Status == "Pending").Sum(i => i.TotalAmount),
                        PendingCount = g.Count(i => i.Status == "Pending")
                    })
                    .OrderByDescending(x => x.Date)
                    .ToList();

                var report = new
                {
                    DailySales = dailySales,
                    Summary = new
                    {
                        TotalSales = invoices.Sum(i => i.TotalAmount),
                        TotalInvoices = invoices.Count,
                        PaidSales = invoices.Where(i => i.Status == "Paid").Sum(i => i.TotalAmount),
                        PaidCount = invoices.Count(i => i.Status == "Paid"),
                        PendingSales = invoices.Where(i => i.Status == "Pending").Sum(i => i.TotalAmount),
                        PendingCount = invoices.Count(i => i.Status == "Pending"),
                        AverageSaleAmount = invoices.Any() ? invoices.Average(i => i.TotalAmount) : 0
                    },
                    TopCustomers = invoices
                        .GroupBy(i => i.Customer.Name)
                        .Select(g => new
                        {
                            CustomerName = g.Key,
                            TotalAmount = g.Sum(i => i.TotalAmount),
                            InvoiceCount = g.Count()
                        })
                        .OrderByDescending(x => x.TotalAmount)
                        .Take(10)
                        .ToList(),
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating sales report: {ex.Message}" });
            }
        }

        // GET: api/reports/purchase
        [HttpGet("purchase")]
        public async Task<ActionResult<object>> GetPurchaseReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, [FromQuery] int? vendorId = null)
        {
            try
            {
                var query = _context.PurchaseOrders
                    .Include(po => po.Vendor)
                    .Include(po => po.PurchaseOrderItems)
                    .ThenInclude(poi => poi.Item)
                    .AsQueryable();

                if (fromDate.HasValue)
                    query = query.Where(po => po.OrderDate >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(po => po.OrderDate <= toDate.Value);

                if (vendorId.HasValue)
                    query = query.Where(po => po.VendorId == vendorId.Value);

                var purchaseOrders = await query.OrderByDescending(po => po.OrderDate).ToListAsync();

                // Group by date
                var dailyPurchases = purchaseOrders
                    .GroupBy(po => po.OrderDate.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        TotalPurchase = g.Sum(po => po.TotalAmount),
                        OrderCount = g.Count(),
                        CompletedOrders = g.Count(po => po.Status == "Completed"),
                        PendingOrders = g.Count(po => po.Status == "Pending")
                    })
                    .OrderByDescending(x => x.Date)
                    .ToList();

                var report = new
                {
                    DailyPurchases = dailyPurchases,
                    Summary = new
                    {
                        TotalPurchase = purchaseOrders.Sum(po => po.TotalAmount),
                        TotalOrders = purchaseOrders.Count,
                        CompletedOrders = purchaseOrders.Count(po => po.Status == "Completed"),
                        PendingOrders = purchaseOrders.Count(po => po.Status == "Pending"),
                        AverageOrderAmount = purchaseOrders.Any() ? purchaseOrders.Average(po => po.TotalAmount) : 0
                    },
                    TopVendors = purchaseOrders
                        .GroupBy(po => po.Vendor.Name)
                        .Select(g => new
                        {
                            VendorName = g.Key,
                            TotalAmount = g.Sum(po => po.TotalAmount),
                            OrderCount = g.Count()
                        })
                        .OrderByDescending(x => x.TotalAmount)
                        .Take(10)
                        .ToList(),
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating purchase report: {ex.Message}" });
            }
        }

        // GET: api/reports/purchase/detailed
        [HttpGet("purchase/detailed")]
        public async Task<ActionResult<object>> GetDetailedPurchaseReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, [FromQuery] int? vendorId = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            try
            {
                var query = _context.PurchaseOrders
                    .Include(po => po.Vendor)
                    .Include(po => po.PurchaseOrderItems)
                    .ThenInclude(poi => poi.Item)
                    .AsQueryable();

                if (fromDate.HasValue)
                    query = query.Where(po => po.OrderDate.Date >= fromDate.Value.Date);

                if (toDate.HasValue)
                    query = query.Where(po => po.OrderDate.Date <= toDate.Value.Date);

                if (vendorId.HasValue)
                    query = query.Where(po => po.VendorId == vendorId.Value);

                // Get total count for pagination
                var totalCount = await query.CountAsync();
                
                // Apply pagination
                var purchaseOrders = await query
                    .OrderByDescending(po => po.OrderDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Flatten the data - each row represents one item
                var flattenedData = purchaseOrders.SelectMany(po => po.PurchaseOrderItems.Select(poi => new
                {
                    PurchaseOrderNo = po.PurchaseOrderNumber,
                    VendorName = po.Vendor.Name,
                    Date = po.OrderDate,
                    ItemName = poi.Item.Name,
                    ItemRate = poi.UnitPrice,
                    Quantity = poi.Quantity,
                    Amount = poi.TotalAmount,
                    VendorId = po.VendorId,
                    OrderId = po.Id,
                    Status = po.Status,
                    ExpectedDeliveryDate = po.ExpectedDeliveryDate
                })).OrderByDescending(x => x.Date).ToList();

                // Calculate summary (based on all data, not just current page)
                var allPurchaseOrders = await query
                    .Include(po => po.Vendor)
                    .Include(po => po.PurchaseOrderItems)
                    .ThenInclude(poi => poi.Item)
                    .ToListAsync();
                
                var allFlattenedData = allPurchaseOrders.SelectMany(po => po.PurchaseOrderItems.Select(poi => new
                {
                    PurchaseOrderNo = po.PurchaseOrderNumber,
                    VendorName = po.Vendor.Name,
                    Date = po.OrderDate,
                    ItemName = poi.Item.Name,
                    ItemRate = poi.UnitPrice,
                    Quantity = poi.Quantity,
                    Amount = poi.TotalAmount,
                    VendorId = po.VendorId,
                    OrderId = po.Id,
                    Status = po.Status,
                    ExpectedDeliveryDate = po.ExpectedDeliveryDate
                })).ToList();

                // Calculate summary
                var summary = new
                {
                    TotalPurchases = allFlattenedData.Sum(x => x.Amount),
                    TotalOrders = allFlattenedData.Select(x => x.PurchaseOrderNo).Distinct().Count(),
                    TotalItems = allFlattenedData.Count,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                var pagination = new
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                    HasNextPage = page * pageSize < totalCount,
                    HasPreviousPage = page > 1
                };

                return Ok(new { Data = flattenedData, Summary = summary, Pagination = pagination });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating detailed purchase report: {ex.Message}" });
            }
        }

        // GET: api/reports/inventory
        [HttpGet("inventory")]
        public async Task<ActionResult<object>> GetInventoryReport([FromQuery] int? categoryId = null, [FromQuery] string? status = null)
        {
            try
            {
                var query = _context.Items
                    .Include(i => i.Category)
                    .Include(i => i.InvoiceItems)
                    .Include(i => i.PurchaseOrderItems)
                    .Where(i => i.IsActive)
                    .AsQueryable();

                if (categoryId.HasValue)
                    query = query.Where(i => i.CategoryId == categoryId.Value);

                var items = await query.OrderBy(i => i.Name).ToListAsync();

                // Calculate inventory metrics
                var inventoryData = items.Select(item => new
                {
                    item.Id,
                    item.Name,
                    item.Description,
                    Category = item.Category.Name,
                    item.Price,
                    item.StockQuantity,
                    item.MinimumStock,
                    item.Unit,
                    StockStatus = item.StockQuantity <= item.MinimumStock ? "Low Stock" : 
                                 item.StockQuantity == 0 ? "Out of Stock" : "In Stock",
                    StockValue = item.StockQuantity * item.Price,
                    TotalSold = item.InvoiceItems.Sum(ii => ii.Quantity),
                    TotalPurchased = item.PurchaseOrderItems.Sum(poi => poi.Quantity),
                    LastModifiedDate = item.LastModifiedDate,
                    ReorderLevel = item.MinimumStock,
                    ReorderNeeded = item.StockQuantity <= item.MinimumStock
                }).ToList();

                var summary = new
                {
                    TotalItems = inventoryData.Count,
                    TotalStockValue = inventoryData.Sum(i => i.StockValue),
                    LowStockItems = inventoryData.Count(i => i.StockStatus == "Low Stock"),
                    OutOfStockItems = inventoryData.Count(i => i.StockStatus == "Out of Stock"),
                    InStockItems = inventoryData.Count(i => i.StockStatus == "In Stock"),
                    TotalQuantity = inventoryData.Sum(i => i.StockQuantity),
                    Categories = inventoryData.GroupBy(i => i.Category)
                        .Select(g => new
                        {
                            Category = g.Key,
                            ItemCount = g.Count(),
                            TotalValue = g.Sum(i => i.StockValue),
                            LowStockCount = g.Count(i => i.StockStatus == "Low Stock")
                        })
                        .OrderByDescending(x => x.TotalValue)
                        .ToList()
                };

                return Ok(new { Inventory = inventoryData, Summary = summary });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating inventory report: {ex.Message}" });
            }
        }

        // GET: api/reports/financial
        [HttpGet("financial")]
        public async Task<ActionResult<object>> GetFinancialReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = _context.Invoices.AsQueryable();

                if (fromDate.HasValue)
                    query = query.Where(i => i.InvoiceDate >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(i => i.InvoiceDate <= toDate.Value);

                var invoices = await query
                    .Include(i => i.InvoiceItems)
                    .ToListAsync();

                var financialData = new
                {
                    Revenue = new
                    {
                        TotalRevenue = invoices.Where(i => i.Status == "Paid").Sum(i => i.TotalAmount),
                        PendingRevenue = invoices.Where(i => i.Status == "Pending").Sum(i => i.TotalAmount),
                        TotalInvoices = invoices.Count,
                        PaidInvoices = invoices.Count(i => i.Status == "Paid"),
                        PendingInvoices = invoices.Count(i => i.Status == "Pending")
                    },
                    ProfitAnalysis = invoices
                        .Where(i => i.Status == "Paid")
                        .SelectMany(i => i.InvoiceItems)
                        .GroupBy(ii => ii.ItemId)
                        .Select(g => new
                        {
                            ItemId = g.Key,
                            TotalQuantity = g.Sum(ii => ii.Quantity),
                            TotalRevenue = g.Sum(ii => ii.TotalAmount),
                            ProfitMargin = 0 // Would need cost data to calculate
                        })
                        .OrderByDescending(x => x.TotalRevenue)
                        .Take(10)
                        .ToList(),
                    PaymentTypes = invoices
                        .GroupBy(i => i.PaymentType)
                        .Select(g => new
                        {
                            PaymentType = g.Key,
                            Count = g.Count(),
                            TotalAmount = g.Sum(i => i.TotalAmount)
                        })
                        .ToList(),
                    MonthlyTrend = invoices
                        .GroupBy(i => new { Year = i.InvoiceDate.Year, Month = i.InvoiceDate.Month })
                        .Select(g => new
                        {
                            Year = g.Key.Year,
                            Month = g.Key.Month,
                            MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM"),
                            Revenue = g.Where(i => i.Status == "Paid").Sum(i => i.TotalAmount),
                            InvoiceCount = g.Count()
                        })
                        .OrderByDescending(x => new { x.Year, x.Month })
                        .Take(12)
                        .ToList(),
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(financialData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating financial report: {ex.Message}" });
            }
        }

        // GET: api/reports/customers
        [HttpGet("customers")]
        public async Task<ActionResult<object>> GetCustomerReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = _context.Invoices
                    .Include(i => i.Customer)
                    .AsQueryable();

                if (fromDate.HasValue)
                    query = query.Where(i => i.InvoiceDate >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(i => i.InvoiceDate <= toDate.Value);

                var invoices = await query.ToListAsync();

                var customerData = invoices
                    .GroupBy(i => i.Customer)
                    .Select(g => new
                    {
                        CustomerId = g.Key.Id,
                        CustomerName = g.Key.Name,
                        Email = g.Key.Email,
                        Phone = g.Key.Phone,
                        CustomerType = g.Key.CustomerType,
                        TotalInvoices = g.Count(),
                        TotalAmount = g.Sum(i => i.TotalAmount),
                        PaidAmount = g.Where(i => i.Status == "Paid").Sum(i => i.TotalAmount),
                        PendingAmount = g.Where(i => i.Status == "Pending").Sum(i => i.TotalAmount),
                        AverageInvoiceAmount = g.Average(i => i.TotalAmount),
                        FirstInvoiceDate = g.Min(i => i.InvoiceDate),
                        LastInvoiceDate = g.Max(i => i.InvoiceDate),
                        PaymentTypes = g.GroupBy(i => i.PaymentType)
                            .Select(pt => new { PaymentType = pt.Key, Count = pt.Count() })
                            .ToList()
                    })
                    .OrderByDescending(x => x.TotalAmount)
                    .ToList();

                var summary = new
                {
                    TotalCustomers = customerData.Count,
                    TotalRevenue = customerData.Sum(c => c.PaidAmount),
                    PendingRevenue = customerData.Sum(c => c.PendingAmount),
                    AverageCustomerValue = customerData.Any() ? customerData.Average(c => c.TotalAmount) : 0,
                    CustomerTypes = customerData
                        .GroupBy(c => c.CustomerType)
                        .Select(g => new
                        {
                            Type = g.Key,
                            Count = g.Count(),
                            TotalRevenue = g.Sum(c => c.TotalAmount)
                        })
                        .ToList()
                };

                return Ok(new { Customers = customerData, Summary = summary });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating customer report: {ex.Message}" });
            }
        }

        // GET: api/reports/customer-ledger
        [HttpGet("customer-ledger")]
        public async Task<ActionResult<object>> GetCustomerLedgerReport(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int? customerId = null)
        {
            try
            {
                // Start with base query for all sales (CREDIT, CASH, UPI)
                var query = _context.Invoices
                    .Include(i => i.Customer)
                    .AsQueryable();

                // Apply date filters
                if (fromDate.HasValue)
                    query = query.Where(i => i.InvoiceDate.Date >= fromDate.Value.Date);

                if (toDate.HasValue)
                    query = query.Where(i => i.InvoiceDate.Date <= toDate.Value.Date);

                // Apply customer filter
                if (customerId.HasValue)
                    query = query.Where(i => i.CustomerId == customerId.Value);

                // Get the filtered invoices
                var invoices = await query
                    .OrderBy(i => i.InvoiceDate)
                    .ThenBy(i => i.InvoiceNumber)
                    .Select(i => new
                    {
                        i.Id,
                        InvoiceDate = i.InvoiceDate.Date,
                        InvoiceNumber = i.InvoiceNumber,
                        CustomerName = i.Customer.Name,
                        TotalAmount = i.TotalAmount,
                        PaymentType = i.PaymentType
                    })
                    .ToListAsync();

                // Transform to ledger format with running balance
                var ledgerData = new List<object>();
                decimal runningBalance = 0;

                foreach (var invoice in invoices)
                {
                    // Apply proper accounting logic
                    decimal debit = invoice.TotalAmount; // Always debit the total amount
                    decimal credit = 0;
                    
                    // Credit amount for CASH and UPI payments (instant payments)
                    if (invoice.PaymentType == "Cash" || invoice.PaymentType == "UPI")
                    {
                        credit = invoice.TotalAmount;
                    }
                    
                    runningBalance += debit - credit;

                    ledgerData.Add(new
                    {
                        Date = invoice.InvoiceDate.ToString("yyyy-MM-dd"),
                        Type = "SALE",
                        RefNo = invoice.InvoiceNumber,
                        CustomerName = invoice.CustomerName,
                        PaymentMode = invoice.PaymentType,
                        Debit = debit,
                        Credit = credit,
                        Balance = runningBalance
                    });
                }

                // Calculate summary with proper accounting
                var summary = new
                {
                    TotalSales = invoices.Sum(i => i.TotalAmount),
                    TotalReceived = invoices.Where(i => i.PaymentType == "Cash" || i.PaymentType == "UPI").Sum(i => i.TotalAmount),
                    TotalOutstanding = invoices.Where(i => i.PaymentType == "Credit").Sum(i => i.TotalAmount),
                    TransactionCount = invoices.Count,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(new
                {
                    Data = ledgerData,
                    Summary = summary
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating customer ledger report: {ex.Message}" });
            }
        }

        // GET: api/reports/day-book
        [HttpGet("day-book")]
        public async Task<ActionResult<object>> GetDayBookReport(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = new List<object>();

                // Get Sales data
                var salesQuery = _context.Invoices
                    .Include(i => i.Customer)
                    .AsQueryable();

                if (fromDate.HasValue)
                    salesQuery = salesQuery.Where(i => i.InvoiceDate.Date >= fromDate.Value.Date);

                if (toDate.HasValue)
                    salesQuery = salesQuery.Where(i => i.InvoiceDate.Date <= toDate.Value.Date);

                var sales = await salesQuery
                    .Select(i => new
                    {
                        Date = i.InvoiceDate.Date,
                        Type = "SALE",
                        RefNo = i.InvoiceNumber,
                        Party = i.Customer.Name,
                        Amount = i.TotalAmount
                    })
                    .ToListAsync();

                // Get Purchase data
                var purchaseQuery = _context.PurchaseOrders
                    .Include(po => po.Vendor)
                    .AsQueryable();

                if (fromDate.HasValue)
                    purchaseQuery = purchaseQuery.Where(po => po.OrderDate.Date >= fromDate.Value.Date);

                if (toDate.HasValue)
                    purchaseQuery = purchaseQuery.Where(po => po.OrderDate.Date <= toDate.Value.Date);

                var purchases = await purchaseQuery
                    .Select(po => new
                    {
                        Date = po.OrderDate.Date,
                        Type = "PURCHASE",
                        RefNo = po.PurchaseOrderNumber,
                        Party = po.Vendor.Name,
                        Amount = po.TotalAmount
                    })
                    .ToListAsync();

                // Combine sales and purchases using UNION ALL equivalent
                var allTransactions = new List<object>();
                allTransactions.AddRange(sales);
                allTransactions.AddRange(purchases);

                // Sort by Date DESC
                var sortedTransactions = allTransactions
                    .OrderByDescending(t => ((dynamic)t).Date)
                    .ThenBy(t => ((dynamic)t).RefNo)
                    .ToList();

                // Calculate summary
                var summary = new
                {
                    TotalSales = sales.Sum(s => s.Amount),
                    TotalPurchase = purchases.Sum(p => p.Amount),
                    TransactionCount = sortedTransactions.Count,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(new
                {
                    Data = sortedTransactions,
                    Summary = summary
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating day book report: {ex.Message}" });
            }
        }

        // GET: api/reports/top-customers
        [HttpGet("top-customers")]
        public async Task<ActionResult<object>> GetTopCustomersReport(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                // Start with base query
                var query = _context.Invoices
                    .Include(i => i.Customer)
                    .AsQueryable();

                // Apply date filters
                if (fromDate.HasValue)
                    query = query.Where(i => i.InvoiceDate.Date >= fromDate.Value.Date);

                if (toDate.HasValue)
                    query = query.Where(i => i.InvoiceDate.Date <= toDate.Value.Date);

                // Group by customer and calculate metrics
                var customerData = await query
                    .GroupBy(i => i.Customer)
                    .Select(g => new
                    {
                        CustomerName = g.Key.Name,
                        TotalOrders = g.Count(),
                        TotalSales = g.Sum(i => i.TotalAmount),
                        AvgOrderValue = g.Sum(i => i.TotalAmount) / g.Count()
                    })
                    .OrderByDescending(c => c.TotalSales)
                    .ToListAsync();

                // Calculate summary
                var summary = new
                {
                    TotalCustomers = customerData.Count,
                    TotalOrders = customerData.Sum(c => c.TotalOrders),
                    TotalSales = customerData.Sum(c => c.TotalSales),
                    AvgOrderValue = customerData.Count > 0 ? customerData.Sum(c => c.TotalSales) / customerData.Sum(c => c.TotalOrders) : 0,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(new
                {
                    Data = customerData,
                    Summary = summary
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating top customers report: {ex.Message}" });
            }
        }

        // GET: api/reports/purchase-item-wise
        [HttpGet("purchase-item-wise")]
        public async Task<ActionResult<object>> GetPurchaseItemWiseReport(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int? itemId = null)
        {
            try
            {
                // Start with base query
                var query = _context.PurchaseOrderItems
                    .Include(poi => poi.Item)
                    .Include(poi => poi.PurchaseOrder)
                    .AsQueryable();

                // Apply date filters
                if (fromDate.HasValue)
                    query = query.Where(poi => poi.PurchaseOrder.OrderDate.Date >= fromDate.Value.Date);

                if (toDate.HasValue)
                    query = query.Where(poi => poi.PurchaseOrder.OrderDate.Date <= toDate.Value.Date);

                // Apply item filter
                if (itemId.HasValue)
                    query = query.Where(poi => poi.ItemId == itemId.Value);

                // Group by item and calculate metrics
                var itemData = await query
                    .Where(poi => poi.Item != null && poi.PurchaseOrder != null)
                    .GroupBy(poi => poi.Item)
                    .Select(g => new
                    {
                        ItemName = g.Key.Name,
                        QtyPurchased = g.Sum(poi => poi.Quantity),
                        TotalPurchase = g.Sum(poi => poi.TotalAmount),
                        AvgRate = g.Sum(poi => poi.TotalAmount) / g.Sum(poi => poi.Quantity)
                    })
                    .OrderByDescending(i => i.TotalPurchase)
                    .ToListAsync();

                // Calculate summary
                var summary = new
                {
                    TotalItems = itemData.Count,
                    TotalQtyPurchased = itemData.Sum(i => i.QtyPurchased),
                    TotalPurchase = itemData.Sum(i => i.TotalPurchase),
                    AvgRate = itemData.Count > 0 ? itemData.Sum(i => i.TotalPurchase) / itemData.Sum(i => i.QtyPurchased) : 0,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(new
                {
                    Data = itemData,
                    Summary = summary
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating purchase item-wise report: {ex.Message}" });
            }
        }

        // GET: api/reports/supplier-ledger
        [HttpGet("supplier-ledger")]
        public async Task<ActionResult<object>> GetSupplierLedgerReport(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int? vendorId = null)
        {
            try
            {
                // Start with base query for purchase orders
                var query = _context.PurchaseOrders
                    .Include(po => po.Vendor)
                    .AsQueryable();

                // Apply date filters
                if (fromDate.HasValue)
                    query = query.Where(po => po.OrderDate.Date >= fromDate.Value.Date);

                if (toDate.HasValue)
                    query = query.Where(po => po.OrderDate.Date <= toDate.Value.Date);

                // Apply supplier filter
                if (vendorId.HasValue)
                    query = query.Where(po => po.VendorId == vendorId.Value);

                // Get the filtered purchase orders
                var purchaseOrders = await query
                    .OrderBy(po => po.OrderDate)
                    .ThenBy(po => po.PurchaseOrderNumber)
                    .Select(po => new
                    {
                        po.Id,
                        OrderDate = po.OrderDate.Date,
                        PurchaseOrderNumber = po.PurchaseOrderNumber,
                        VendorName = po.Vendor.Name,
                        TotalAmount = po.TotalAmount
                    })
                    .ToListAsync();

                // Transform to ledger format with running balance
                var ledgerData = new List<object>();
                decimal runningBalance = 0;

                foreach (var purchase in purchaseOrders)
                {
                    // For purchases: Credit = TotalAmount, Debit = 0 (supplier owes us items)
                    decimal debit = 0;
                    decimal credit = purchase.TotalAmount;
                    
                    runningBalance += credit - debit;

                    ledgerData.Add(new
                    {
                        Date = purchase.OrderDate.ToString("yyyy-MM-dd"),
                        Type = "PURCHASE",
                        RefNo = purchase.PurchaseOrderNumber,
                        SupplierName = purchase.VendorName,
                        Debit = debit,
                        Credit = credit,
                        Balance = runningBalance
                    });
                }

                // Calculate summary
                var summary = new
                {
                    TotalPurchases = purchaseOrders.Sum(po => po.TotalAmount),
                    TotalOutstanding = purchaseOrders.Sum(po => po.TotalAmount), // All purchases are outstanding until paid
                    TransactionCount = purchaseOrders.Count,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(new
                {
                    Data = ledgerData,
                    Summary = summary
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating supplier ledger report: {ex.Message}" });
            }
        }

        // GET: api/reports/item-wise-sales
        [HttpGet("item-wise-sales")]
        public async Task<ActionResult<object>> GetItemWiseSalesReport(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int? itemId = null)
        {
            try
            {
                // Start with base query
                var query = _context.InvoiceItems
                    .Include(ii => ii.Item)
                    .Include(ii => ii.Invoice)
                    .AsQueryable();

                // Apply date filters
                if (fromDate.HasValue)
                    query = query.Where(ii => ii.Invoice.InvoiceDate.Date >= fromDate.Value.Date);

                if (toDate.HasValue)
                    query = query.Where(ii => ii.Invoice.InvoiceDate.Date <= toDate.Value.Date);

                // Apply item filter
                if (itemId.HasValue)
                    query = query.Where(ii => ii.ItemId == itemId.Value);

                // Group by item and calculate metrics
                var itemData = await query
                    .Where(ii => ii.Item != null && ii.Invoice != null)
                    .GroupBy(ii => ii.Item)
                    .Select(g => new
                    {
                        ItemName = g.Key.Name,
                        QtySold = g.Sum(ii => ii.Quantity),
                        TotalSales = g.Sum(ii => ii.TotalAmount),
                        AvgRate = g.Sum(ii => ii.TotalAmount) / g.Sum(ii => ii.Quantity)
                    })
                    .OrderByDescending(i => i.TotalSales)
                    .ToListAsync();

                // Calculate summary
                var summary = new
                {
                    TotalItems = itemData.Count,
                    TotalQtySold = itemData.Sum(i => i.QtySold),
                    TotalSales = itemData.Sum(i => i.TotalSales),
                    AvgRate = itemData.Count > 0 ? itemData.Sum(i => i.TotalSales) / itemData.Sum(i => i.QtySold) : 0,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(new
                {
                    Data = itemData,
                    Summary = summary
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating item-wise sales report: {ex.Message}" });
            }
        }

        // GET: api/reports/top-suppliers
        [HttpGet("top-suppliers")]
        public async Task<ActionResult<object>> GetTopSuppliersReport(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                // Start with base query
                var query = _context.PurchaseOrders
                    .Include(po => po.Vendor)
                    .AsQueryable();

                // Apply date filters
                if (fromDate.HasValue)
                    query = query.Where(po => po.OrderDate.Date >= fromDate.Value.Date);

                if (toDate.HasValue)
                    query = query.Where(po => po.OrderDate.Date <= toDate.Value.Date);

                // Group by supplier and calculate metrics
                var supplierData = await query
                    .GroupBy(po => po.Vendor)
                    .Select(g => new
                    {
                        SupplierName = g.Key.Name,
                        TotalOrders = g.Count(),
                        TotalPurchase = g.Sum(po => po.TotalAmount),
                        AvgOrderValue = g.Sum(po => po.TotalAmount) / g.Count()
                    })
                    .OrderByDescending(s => s.TotalPurchase)
                    .ToListAsync();

                // Calculate summary
                var summary = new
                {
                    TotalSuppliers = supplierData.Count,
                    TotalOrders = supplierData.Sum(s => s.TotalOrders),
                    TotalPurchase = supplierData.Sum(s => s.TotalPurchase),
                    AvgOrderValue = supplierData.Count > 0 ? supplierData.Sum(s => s.TotalPurchase) / supplierData.Sum(s => s.TotalOrders) : 0,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(new
                {
                    Data = supplierData,
                    Summary = summary
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating top suppliers report: {ex.Message}" });
            }
        }
    }
}
