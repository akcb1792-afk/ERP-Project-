using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GrowURBuisness.API.Data;
using GrowURBuisness.API.Models;

namespace GrowURBuisness.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BillingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BillingController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/billing/items
        [HttpGet("items")]
        public async Task<ActionResult<IEnumerable<Item>>> GetItems()
        {
            var items = await _context.Items
                .Include(i => i.Category)
                .Where(i => i.IsActive)
                .ToListAsync();

            return Ok(items);
        }

        // GET: api/billing/items/search?query=laptop
        [HttpGet("items/search")]
        public async Task<ActionResult<IEnumerable<Item>>> SearchItems([FromQuery] string query)
        {
            var items = await _context.Items
                .Include(i => i.Category)
                .Where(i => i.IsActive && 
                           (i.Name.Contains(query) || 
                            i.Description.Contains(query)))
                .ToListAsync();

            return Ok(items);
        }

        // POST: api/billing/create
        [HttpPost("create")]
        public async Task<ActionResult<object>> CreateInvoice([FromBody] CreateInvoiceRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate customer exists
                var customer = await _context.Customers.FindAsync(request.CustomerId);
                if (customer == null)
                {
                    return BadRequest(new { success = false, message = "Customer not found" });
                }

                // Create invoice
                var invoice = new Invoice
                {
                    InvoiceNumber = $"INV-{DateTime.Now:yyyyMMdd}-{new Random().Next(1000, 9999)}",
                    CustomerId = request.CustomerId,
                    PaymentType = request.PaymentType,
                    Status = "Pending",
                    InvoiceDate = DateTime.Now,
                    DueDate = DateTime.Now.AddDays(7),
                    CreatedDate = DateTime.Now,
                    LastModifiedDate = DateTime.Now
                };

                decimal totalAmount = 0;
                var invoiceItems = new List<InvoiceItem>();

                foreach (var itemRequest in request.Items)
                {
                    // Get item and validate stock
                    var item = await _context.Items.FindAsync(itemRequest.ItemId);
                    if (item == null)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { success = false, message = $"Item with ID {itemRequest.ItemId} not found" });
                    }

                    if (item.StockQuantity < itemRequest.Quantity)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { success = false, message = $"Insufficient stock for item: {item.Name}" });
                    }

                    var itemTotal = itemRequest.Quantity * itemRequest.Price;
                    totalAmount += itemTotal;

                    var invoiceItem = new InvoiceItem
                    {
                        ItemId = itemRequest.ItemId,
                        Quantity = itemRequest.Quantity,
                        UnitPrice = itemRequest.Price,
                        TotalAmount = itemTotal,
                        CreatedDate = DateTime.Now
                    };

                    invoiceItems.Add(invoiceItem);

                    // Update stock
                    item.StockQuantity -= itemRequest.Quantity;
                    item.LastModifiedDate = DateTime.Now;

                    // Create stock transaction
                    var stockTransaction = new StockTransaction
                    {
                        ItemId = itemRequest.ItemId,
                        TransactionType = "Sale",
                        QuantityChange = -itemRequest.Quantity,
                        ReferenceType = "Invoice",
                        ReferenceId = invoice.Id,
                        UnitPrice = itemRequest.Price,
                        Notes = $"Invoice {invoice.InvoiceNumber}",
                        TransactionDate = DateTime.Now,
                        CreatedDate = DateTime.Now
                    };

                    _context.StockTransactions.Add(stockTransaction);
                }

                invoice.TotalAmount = totalAmount;
                invoice.FinalAmount = totalAmount;

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                // Add invoice items
                foreach (var invoiceItem in invoiceItems)
                {
                    invoiceItem.InvoiceId = invoice.Id;
                    _context.InvoiceItems.Add(invoiceItem);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new 
                { 
                    success = true, 
                    invoiceId = invoice.Id,
                    invoiceNumber = invoice.InvoiceNumber,
                    totalAmount = totalAmount,
                    message = "Invoice created successfully" 
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = $"Error creating invoice: {ex.Message}" });
            }
        }

        // GET: api/billing/invoices
        [HttpGet("invoices")]
        public async Task<ActionResult<IEnumerable<object>>> GetInvoices()
        {
            var invoices = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.InvoiceItems)
                .OrderByDescending(i => i.InvoiceDate)
                .Select(i => new
                {
                    i.Id,
                    i.InvoiceNumber,
                    CustomerName = i.Customer.Name,
                    i.TotalAmount,
                    i.Status,
                    i.InvoiceDate,
                    i.DueDate,
                    i.PaymentType,
                    ItemCount = i.InvoiceItems.Count
                })
                .ToListAsync();

            return Ok(invoices);
        }

        // GET: api/billing/invoices/5
        [HttpGet("invoices/{id}")]
        public async Task<ActionResult<object>> GetInvoice(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.InvoiceItems)
                .ThenInclude(ii => ii.Item)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
            {
                return NotFound();
            }

            var invoiceDetails = new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                Customer = new
                {
                    invoice.Customer.Id,
                    invoice.Customer.Name,
                    invoice.Customer.Email,
                    invoice.Customer.Phone
                },
                invoice.TotalAmount,
                invoice.DiscountAmount,
                invoice.TaxAmount,
                invoice.FinalAmount,
                invoice.Status,
                invoice.InvoiceDate,
                invoice.DueDate,
                invoice.PaymentType,
                Items = invoice.InvoiceItems.Select(ii => new
                {
                    ii.Id,
                    ItemName = ii.Item.Name,
                    ii.Quantity,
                    ii.UnitPrice,
                    ii.TotalAmount
                }).ToList()
            };

            return Ok(invoiceDetails);
        }
    }

    // DTOs for API
    public class CreateInvoiceRequest
    {
        public int CustomerId { get; set; }
        public string PaymentType { get; set; } = "Cash";
        public List<InvoiceItemRequest> Items { get; set; } = new();
    }

    public class InvoiceItemRequest
    {
        public int ItemId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
}
