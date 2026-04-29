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
        public async Task<ActionResult<object>> GetCustomerLedger([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, [FromQuery] int? customerId = null)
        {
            try
            {
                var query = _context.Invoices
                    .Include(i => i.Customer)
                    .AsQueryable();

                if (fromDate.HasValue)
                    query = query.Where(i => i.InvoiceDate.Date >= fromDate.Value.Date);

                if (toDate.HasValue)
                    query = query.Where(i => i.InvoiceDate.Date <= toDate.Value.Date);

                if (customerId.HasValue)
                    query = query.Where(i => i.CustomerId == customerId.Value);

                // Get all invoices for the ledger
                var invoices = await query
                    .OrderBy(i => i.InvoiceDate)
                    .ThenBy(i => i.InvoiceNumber)
                    .ToListAsync();

                // Transform to ledger entries with proper accounting logic
                var ledgerEntries = invoices.Select(invoice => new
                {
                    Date = invoice.InvoiceDate,
                    Type = "SALE",
                    RefNo = invoice.InvoiceNumber,
                    CustomerName = invoice.Customer.Name,
                    PaymentMode = invoice.PaymentType.ToUpper(),
                    Debit = invoice.TotalAmount, // Always debit the total amount
                    Credit = (invoice.PaymentType.ToUpper() == "CASH" || invoice.PaymentType.ToUpper() == "UPI") ? invoice.TotalAmount : 0m, // Credit only for CASH/UPI
                    Balance = 0m // Will be calculated below
                }).ToList();

                // Calculate running balance using SQL window function logic
                decimal runningBalance = 0m;
                for (int i = 0; i < ledgerEntries.Count; i++)
                {
                    runningBalance += ledgerEntries[i].Debit - ledgerEntries[i].Credit;
                    ledgerEntries[i] = new
                    {
                        Date = ledgerEntries[i].Date,
                        Type = ledgerEntries[i].Type,
                        RefNo = ledgerEntries[i].RefNo,
                        CustomerName = ledgerEntries[i].CustomerName,
                        PaymentMode = ledgerEntries[i].PaymentMode,
                        Debit = ledgerEntries[i].Debit,
                        Credit = ledgerEntries[i].Credit,
                        Balance = runningBalance
                    };
                }

                // Calculate summary
                var summary = new
                {
                    TotalSales = ledgerEntries.Sum(x => x.Debit),
                    TotalReceived = ledgerEntries.Sum(x => x.Credit),
                    TotalOutstanding = ledgerEntries.Sum(x => x.Debit - x.Credit),
                    TotalTransactions = ledgerEntries.Count,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(new { Data = ledgerEntries, Summary = summary });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating customer ledger: {ex.Message}" });
            }
        }

        // GET: api/reports/day-book
        [HttpGet("day-book")]
        public async Task<ActionResult<object>> GetDayBook([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var salesQuery = _context.Invoices
                    .Include(i => i.Customer)
                    .AsQueryable();

                var purchaseQuery = _context.PurchaseOrders
                    .Include(po => po.Vendor)
                    .AsQueryable();

                if (fromDate.HasValue)
                {
                    salesQuery = salesQuery.Where(i => i.InvoiceDate.Date >= fromDate.Value.Date);
                    purchaseQuery = purchaseQuery.Where(po => po.OrderDate.Date >= fromDate.Value.Date);
                }

                if (toDate.HasValue)
                {
                    salesQuery = salesQuery.Where(i => i.InvoiceDate.Date <= toDate.Value.Date);
                    purchaseQuery = purchaseQuery.Where(po => po.OrderDate.Date <= toDate.Value.Date);
                }

                var sales = await salesQuery.ToListAsync();
                var purchases = await purchaseQuery.ToListAsync();

                // Combine sales and purchases using UNION ALL logic
                var dayBookEntries = new List<object>();

                // Add sales entries
                foreach (var sale in sales)
                {
                    dayBookEntries.Add(new
                    {
                        Date = sale.InvoiceDate,
                        Type = "SALE",
                        RefNo = sale.InvoiceNumber,
                        Party = sale.Customer.Name,
                        Amount = sale.TotalAmount
                    });
                }

                // Add purchase entries
                foreach (var purchase in purchases)
                {
                    dayBookEntries.Add(new
                    {
                        Date = purchase.OrderDate,
                        Type = "PURCHASE",
                        RefNo = purchase.PurchaseOrderNumber,
                        Party = purchase.Vendor.Name,
                        Amount = purchase.TotalAmount
                    });
                }

                // Sort by Date DESC
                var sortedEntries = dayBookEntries
                    .OrderByDescending(x => ((dynamic)x).Date)
                    .ThenBy(x => ((dynamic)x).Type)
                    .ThenBy(x => ((dynamic)x).RefNo)
                    .ToList();

                // Calculate summary
                var totalSales = sales.Sum(s => s.TotalAmount);
                var totalPurchase = purchases.Sum(p => p.TotalAmount);

                var summary = new
                {
                    TotalSales = totalSales,
                    TotalPurchase = totalPurchase,
                    NetDifference = totalSales - totalPurchase,
                    TotalTransactions = sortedEntries.Count,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(new { Data = sortedEntries, Summary = summary });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating day book: {ex.Message}" });
            }
        }

        // GET: api/reports/item-wise-sales
        [HttpGet("item-wise-sales")]
        public async Task<ActionResult<object>> GetItemWiseSalesReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, [FromQuery] int? itemId = null)
        {
            try
            {
                var query = _context.InvoiceItems
                    .Include(ii => ii.Invoice)
                    .Include(ii => ii.Item)
                    .AsQueryable();

                if (fromDate.HasValue)
                {
                    query = query.Where(ii => ii.Invoice.InvoiceDate.Date >= fromDate.Value.Date);
                }

                if (toDate.HasValue)
                {
                    query = query.Where(ii => ii.Invoice.InvoiceDate.Date <= toDate.Value.Date);
                }

                if (itemId.HasValue)
                {
                    query = query.Where(ii => ii.ItemId == itemId.Value);
                }

                var itemSales = await query
                    .Where(ii => ii.Item.IsActive)
                    .GroupBy(ii => new { ii.Item.Id, ii.Item.Name })
                    .Select(g => new
                    {
                        ItemId = g.Key.Id,
                        ItemName = g.Key.Name,
                        QtySold = g.Sum(ii => ii.Quantity),
                        TotalSales = g.Sum(ii => ii.TotalAmount),
                        AvgRate = g.Sum(ii => ii.TotalAmount) / g.Sum(ii => ii.Quantity)
                    })
                    .OrderByDescending(x => x.TotalSales)
                    .ToListAsync();

                // Calculate summary
                var summary = new
                {
                    TotalItems = itemSales.Count,
                    TotalQuantitySold = itemSales.Sum(x => x.QtySold),
                    TotalRevenue = itemSales.Sum(x => x.TotalSales),
                    AverageItemPrice = itemSales.Any() ? itemSales.Average(x => x.AvgRate) : 0,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(new { Data = itemSales, Summary = summary });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating item-wise sales report: {ex.Message}" });
            }
        }

        // GET: api/reports/top-customers
        [HttpGet("top-customers")]
        public async Task<ActionResult<object>> GetTopCustomersReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = _context.Invoices
                    .Include(i => i.Customer)
                    .Where(i => i.Customer.IsActive)
                    .AsQueryable();

                if (fromDate.HasValue)
                {
                    query = query.Where(i => i.InvoiceDate.Date >= fromDate.Value.Date);
                }

                if (toDate.HasValue)
                {
                    query = query.Where(i => i.InvoiceDate.Date <= toDate.Value.Date);
                }

                var topCustomers = await query
                    .GroupBy(i => new { i.Customer.Id, i.Customer.Name })
                    .Select(g => new
                    {
                        CustomerId = g.Key.Id,
                        CustomerName = g.Key.Name,
                        TotalOrders = g.Count(),
                        TotalSales = g.Sum(i => i.TotalAmount),
                        AvgOrderValue = g.Sum(i => i.TotalAmount) / g.Count()
                    })
                    .OrderByDescending(x => x.TotalSales)
                    .ToListAsync();

                // Calculate summary
                var summary = new
                {
                    TotalCustomers = topCustomers.Count,
                    TotalOrders = topCustomers.Sum(x => x.TotalOrders),
                    TotalRevenue = topCustomers.Sum(x => x.TotalSales),
                    AverageOrderValue = topCustomers.Any() ? topCustomers.Average(x => x.AvgOrderValue) : 0,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(new { Data = topCustomers, Summary = summary });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating top customers report: {ex.Message}" });
            }
        }

        // GET: api/reports/purchase-item-wise
        [HttpGet("purchase-item-wise")]
        public async Task<ActionResult<object>> GetPurchaseItemWiseReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, [FromQuery] int? itemId = null)
        {
            try
            {
                var query = _context.PurchaseOrderItems
                    .Include(poi => poi.PurchaseOrder)
                    .Include(poi => poi.Item)
                    .AsQueryable();

                if (fromDate.HasValue)
                {
                    query = query.Where(poi => poi.PurchaseOrder.OrderDate.Date >= fromDate.Value.Date);
                }

                if (toDate.HasValue)
                {
                    query = query.Where(poi => poi.PurchaseOrder.OrderDate.Date <= toDate.Value.Date);
                }

                if (itemId.HasValue)
                {
                    query = query.Where(poi => poi.ItemId == itemId.Value);
                }

                var purchaseItemSales = await query
                    .Where(poi => poi.Item.IsActive)
                    .GroupBy(poi => new { poi.Item.Id, poi.Item.Name })
                    .Select(g => new
                    {
                        ItemId = g.Key.Id,
                        ItemName = g.Key.Name,
                        QtyPurchased = g.Sum(poi => poi.Quantity),
                        TotalPurchase = g.Sum(poi => poi.TotalAmount),
                        AvgPurchaseRate = g.Sum(poi => poi.TotalAmount) / g.Sum(poi => poi.Quantity)
                    })
                    .OrderByDescending(x => x.TotalPurchase)
                    .ToListAsync();

                // Calculate summary
                var summary = new
                {
                    TotalItems = purchaseItemSales.Count,
                    TotalQuantityPurchased = purchaseItemSales.Sum(x => x.QtyPurchased),
                    TotalPurchaseAmount = purchaseItemSales.Sum(x => x.TotalPurchase),
                    AveragePurchaseRate = purchaseItemSales.Any() ? purchaseItemSales.Average(x => x.AvgPurchaseRate) : 0,
                    DateRange = new
                    {
                        From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time",
                        To = toDate?.ToString("yyyy-MM-dd") ?? "All Time"
                    }
                };

                return Ok(new { Data = purchaseItemSales, Summary = summary });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating purchase item-wise report: {ex.Message}" });
            }
        }

        // GET: api/reports/supplier-ledger
        [HttpGet("supplier-ledger")]
        public async Task<ActionResult<object>> GetSupplierLedger(DateTime? fromDate, DateTime? toDate, int? supplierId)
        {
            try
            {
                var query = _context.PurchaseOrders
                    .Include(po => po.Vendor)
                    .AsQueryable();

                // Apply filters
                if (fromDate.HasValue) query = query.Where(po => po.OrderDate.Date >= fromDate.Value.Date);
                if (toDate.HasValue) query = query.Where(po => po.OrderDate.Date <= toDate.Value.Date);
                if (supplierId.HasValue) query = query.Where(po => po.VendorId == supplierId.Value);

                var purchaseOrders = await query.OrderBy(po => po.OrderDate).ThenBy(po => po.PurchaseOrderNumber).ToListAsync();

                var ledgerEntries = purchaseOrders.Select(purchaseOrder => new {
                    Date = purchaseOrder.OrderDate,
                    Type = "PURCHASE",
                    RefNo = purchaseOrder.PurchaseOrderNumber,
                    SupplierName = purchaseOrder.Vendor.Name,
                    Debit = 0m,
                    Credit = purchaseOrder.TotalAmount,
                    Balance = 0m
                }).ToList();

                // Calculate running balance
                decimal runningBalance = 0m;
                for (int i = 0; i < ledgerEntries.Count; i++)
                {
                    runningBalance += ledgerEntries[i].Credit - ledgerEntries[i].Debit;
                    ledgerEntries[i] = new {
                        ledgerEntries[i].Date, 
                        ledgerEntries[i].Type, 
                        ledgerEntries[i].RefNo,
                        ledgerEntries[i].SupplierName,
                        ledgerEntries[i].Debit, 
                        ledgerEntries[i].Credit,
                        Balance = runningBalance
                    };
                }

                var summary = new
                {
                    TotalPurchases = ledgerEntries.Sum(x => x.Credit),
                    TotalPaid = ledgerEntries.Sum(x => x.Debit),
                    TotalOutstanding = ledgerEntries.Sum(x => x.Credit - x.Debit),
                    TotalTransactions = ledgerEntries.Count,
                    DateRange = new { From = fromDate?.ToString("yyyy-MM-dd") ?? "All Time", To = toDate?.ToString("yyyy-MM-dd") ?? "All Time" }
                };

                return Ok(new { Data = ledgerEntries, Summary = summary });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error generating supplier ledger: {ex.Message}" });
            }
        }
    }
}
