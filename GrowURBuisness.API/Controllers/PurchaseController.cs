using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GrowURBuisness.API.Data;
using GrowURBuisness.API.Models;

namespace GrowURBuisness.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PurchaseController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PurchaseController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/purchases
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseOrder>>> GetPurchases()
        {
            try
            {
                var purchases = await _context.PurchaseOrders
                    .Include(p => p.Vendor)
                    .Include(p => p.PurchaseOrderItems)
                    .ThenInclude(poi => poi.Item)
                    .OrderByDescending(p => p.CreatedDate)
                    .ToListAsync();

                return Ok(purchases);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/purchases/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseOrder>> GetPurchase(int id)
        {
            try
            {
                var purchase = await _context.PurchaseOrders
                    .Include(p => p.Vendor)
                    .Include(p => p.PurchaseOrderItems)
                    .ThenInclude(poi => poi.Item)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (purchase == null)
                {
                    return NotFound();
                }

                return Ok(purchase);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // POST: api/purchases
        [HttpPost]
        public async Task<ActionResult<PurchaseOrder>> CreatePurchase([FromBody] CreatePurchaseRequest request)
        {
            try
            {
                Console.WriteLine($"=== Purchase Creation Debug ===");
                Console.WriteLine($"VendorId: {request.VendorId}");
                Console.WriteLine($"Items count: {request.Items?.Count ?? 0}");
                
                // Validate vendor exists
                var vendor = await _context.Customers.FindAsync(request.VendorId);
                Console.WriteLine($"Vendor found: {vendor != null}");
                if (vendor != null)
                {
                    Console.WriteLine($"Vendor CustomerType: {vendor.CustomerType}");
                }
                
                if (vendor == null || vendor.CustomerType != "Vendor")
                {
                    var errorMsg = $"Vendor with ID {request.VendorId} not found";
                    Console.WriteLine($"Error: {errorMsg}");
                    return BadRequest(new { success = false, message = errorMsg });
                }

                // Validate items exist
                foreach (var item in request.Items)
                {
                    var inventoryItem = await _context.Items.FindAsync(item.ItemId);
                    if (inventoryItem == null)
                    {
                        return BadRequest(new { success = false, message = $"Item with ID {item.ItemId} not found" });
                    }
                }

                var purchaseOrder = new PurchaseOrder
                {
                    PurchaseOrderNumber = $"PO-{DateTime.Now:yyyyMMddHHmmss}",
                    VendorId = request.VendorId,
                    TotalAmount = request.Items.Sum(item => item.Quantity * item.UnitPrice),
                    Status = "Completed",
                    OrderDate = DateTime.Now,
                    CreatedDate = DateTime.Now,
                    LastModifiedDate = DateTime.Now
                };

                Console.WriteLine($"Creating purchase order: {purchaseOrder.PurchaseOrderNumber}");
                Console.WriteLine($"VendorId: {purchaseOrder.VendorId}, TotalAmount: {purchaseOrder.TotalAmount}");

                _context.PurchaseOrders.Add(purchaseOrder);
                Console.WriteLine("Purchase order added to context");
                
                await _context.SaveChangesAsync();
                Console.WriteLine("Purchase order saved successfully");

                // Add purchase order Items
                foreach (var item in request.Items)
                {
                    var purchaseOrderItem = new PurchaseOrderItem
                    {
                        PurchaseOrderId = purchaseOrder.Id,
                        ItemId = item.ItemId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        TotalAmount = item.Quantity * item.UnitPrice,
                        CreatedDate = DateTime.Now
                    };

                    _context.PurchaseOrderItems.Add(purchaseOrderItem);

                    // Update item stock
                    var inventoryItem = await _context.Items.FindAsync(item.ItemId);
                    if (inventoryItem != null)
                    {
                        inventoryItem.StockQuantity += item.Quantity;
                        inventoryItem.LastModifiedDate = DateTime.Now;
                    }
                }

                await _context.SaveChangesAsync();

                // Return the created purchase with items
                var createdPurchase = await _context.PurchaseOrders
                    .Include(p => p.Vendor)
                    .Include(p => p.PurchaseOrderItems)
                    .ThenInclude(poi => poi.Item)
                    .FirstOrDefaultAsync(p => p.Id == purchaseOrder.Id);

                return CreatedAtAction(nameof(GetPurchase), new { id = createdPurchase.Id }, createdPurchase);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/Purchase/test
        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { message = "Purchase API is working", timestamp = DateTime.Now });
        }

        // POST: api/Purchase/fix-database
        [HttpPost("fix-database")]
        public async Task<ActionResult<object>> FixDatabase()
        {
            try
            {
                // Drop the existing foreign key constraint
                await _context.Database.ExecuteSqlRawAsync(@"
                    IF EXISTS (
                        SELECT 1 FROM sys.foreign_keys 
                        WHERE name = 'FK__PurchaseO__Vendo__5BE2A6F2'
                    )
                    BEGIN
                        ALTER TABLE PurchaseOrders DROP CONSTRAINT FK__PurchaseO__Vendo__5BE2A6F2;
                    END
                ");

                // Create new foreign key constraint pointing to Customers table
                await _context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE PurchaseOrders 
                    ADD CONSTRAINT FK_PurchaseOrders_Customers_VendorId 
                    FOREIGN KEY (VendorId) REFERENCES Customers(Id);
                ");

                return Ok(new { message = "Database foreign key constraint fixed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/Purchase/items-debug
        [HttpGet("items-debug")]
        public async Task<ActionResult<object>> GetItemsDebug()
        {
            try
            {
                var items = await _context.Items
                    .Select(i => new { i.Id, i.Name, i.IsActive })
                    .ToListAsync();
                
                return Ok(new { itemsCount = items.Count, items = items });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // POST: api/Purchase/drop-vendor-table
        [HttpPost("drop-vendor-table")]
        public async Task<ActionResult<object>> DropVendorTable()
        {
            try
            {
                // Drop the Vendor table if it exists
                await _context.Database.ExecuteSqlRawAsync(@"
                    IF EXISTS (
                        SELECT 1 FROM sys.tables 
                        WHERE name = 'Vendors'
                    )
                    BEGIN
                        DROP TABLE Vendors;
                    END
                ");

                return Ok(new { message = "Vendor table dropped successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/Purchase/check-db-structure
        [HttpGet("check-db-structure")]
        public async Task<ActionResult<object>> CheckDbStructure()
        {
            try
            {
                var tables = await _context.Database.SqlQueryRaw<string>("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'").ToListAsync();
                
                var purchaseOrders = await _context.PurchaseOrders.ToListAsync();
                var purchaseOrderItems = await _context.PurchaseOrderItems.ToListAsync();
                
                return Ok(new { 
                    tables = tables,
                    purchaseOrdersCount = purchaseOrders.Count,
                    purchaseOrderItemsCount = purchaseOrderItems.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        // POST: api/Purchase/test-create
        [HttpPost("test-create")]
        public async Task<ActionResult<object>> TestCreatePurchase([FromBody] CreatePurchaseRequest request)
        {
            try
            {
                Console.WriteLine($"=== Test Purchase Creation Debug ===");
                Console.WriteLine($"VendorId: {request.VendorId}");
                Console.WriteLine($"Items count: {request.Items?.Count ?? 0}");
                
                // Validate vendor exists
                var vendor = await _context.Customers.FindAsync(request.VendorId);
                Console.WriteLine($"Vendor found: {vendor != null}");
                if (vendor != null)
                {
                    Console.WriteLine($"Vendor CustomerType: {vendor.CustomerType}");
                }
                
                if (vendor == null || vendor.CustomerType != "Vendor")
                {
                    var errorMsg = $"Vendor with ID {request.VendorId} not found";
                    Console.WriteLine($"Error: {errorMsg}");
                    return BadRequest(new { success = false, message = errorMsg });
                }

                // Validate items exist
                foreach (var item in request.Items)
                {
                    var inventoryItem = await _context.Items.FindAsync(item.ItemId);
                    if (inventoryItem == null)
                    {
                        return BadRequest(new { success = false, message = $"Item with ID {item.ItemId} not found" });
                    }
                }

                return Ok(new { success = true, message = "Validation passed" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }
    }
}
