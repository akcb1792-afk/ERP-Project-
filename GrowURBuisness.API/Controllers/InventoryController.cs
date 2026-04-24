using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GrowURBuisness.API.Data;
using GrowURBuisness.API.Models;

namespace GrowURBuisness.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InventoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/inventory/items
        [HttpGet("items")]
        public async Task<ActionResult<IEnumerable<Item>>> GetItems()
        {
            try
            {
                var items = await _context.Items
                    .Where(i => i.IsActive)
                    .ToListAsync();

                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/inventory/items/5
        [HttpGet("items/{id}")]
        public async Task<ActionResult<Item>> GetItem(int id)
        {
            var item = await _context.Items
                .Include(i => i.Category)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (item == null)
            {
                return NotFound();
            }

            return Ok(item);
        }

        // POST: api/inventory/items
        [HttpPost("items")]
        public async Task<ActionResult<Item>> CreateItem([FromBody] Item item)
        {
            item.CreatedDate = DateTime.Now;
            item.LastModifiedDate = DateTime.Now;
            item.IsActive = true;

            _context.Items.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetItem), new { id = item.Id }, item);
        }

        // PUT: api/inventory/items/5
        [HttpPut("items/{id}")]
        public async Task<IActionResult> UpdateItem(int id, [FromBody] Item item)
        {
            if (id != item.Id)
            {
                return BadRequest();
            }

            var existingItem = await _context.Items.FindAsync(id);
            if (existingItem == null)
            {
                return NotFound();
            }

            existingItem.Name = item.Name;
            existingItem.Description = item.Description;
            existingItem.CategoryId = item.CategoryId;
            existingItem.Price = item.Price;
            existingItem.MinimumStock = item.MinimumStock;
            existingItem.Unit = item.Unit;
            existingItem.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/inventory/items/5
        [HttpDelete("items/{id}")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            var item = await _context.Items.FindAsync(id);
            if (item == null)
            {
                return NotFound();
            }

            item.IsActive = false;
            item.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/inventory/categories
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .ToListAsync();

            return Ok(categories);
        }

        // POST: api/inventory/categories
        [HttpPost("categories")]
        public async Task<ActionResult<Category>> CreateCategory([FromBody] Category category)
        {
            category.CreatedDate = DateTime.Now;
            category.IsActive = true;

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, category);
        }

        // PUT: api/inventory/categories/5
        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] Category category)
        {
            if (id != category.Id)
            {
                return BadRequest();
            }

            var existingCategory = await _context.Categories.FindAsync(id);
            if (existingCategory == null)
            {
                return NotFound();
            }

            existingCategory.Name = category.Name;
            existingCategory.Description = category.Description;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/inventory/categories/5
        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound();
            }

            // Soft delete by setting IsActive to false
            category.IsActive = false;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/inventory/stock-transactions
        [HttpGet("stock-transactions")]
        public async Task<ActionResult<IEnumerable<StockTransaction>>> GetStockTransactions()
        {
            var transactions = await _context.StockTransactions
                .Include(t => t.Item)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();

            return Ok(transactions);
        }

        // POST: api/inventory/stock-transactions
        [HttpPost("stock-transactions")]
        public async Task<ActionResult<StockTransaction>> CreateStockTransaction([FromBody] StockTransaction transaction)
        {
            transaction.CreatedDate = DateTime.Now;
            transaction.TransactionDate = DateTime.Now;

            _context.StockTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            // Update item stock
            var item = await _context.Items.FindAsync(transaction.ItemId);
            if (item != null)
            {
                item.StockQuantity += transaction.QuantityChange;
                item.LastModifiedDate = DateTime.Now;
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetStockTransactions), new { id = transaction.Id }, transaction);
        }

        // GET: api/inventory/current-stock
        [HttpGet("current-stock")]
        public async Task<ActionResult<IEnumerable<object>>> GetCurrentStock()
        {
            var items = await _context.Items
                .Include(i => i.Category)
                .Where(i => i.IsActive)
                .Select(i => new
                {
                    i.Id,
                    i.Name,
                    i.Description,
                    i.CategoryId,
                    CategoryName = i.Category != null ? i.Category.Name : "",
                    i.Price,
                    i.StockQuantity,
                    i.MinimumStock,
                    i.Unit,
                    StockStatus = i.StockQuantity <= i.MinimumStock ? "Low Stock" : "In Stock"
                })
                .ToListAsync();

            return Ok(items);
        }

        // GET: api/inventory/low-stock
        [HttpGet("low-stock")]
        public async Task<ActionResult<IEnumerable<object>>> GetLowStockItems()
        {
            var lowStockItems = await _context.Items
                .Include(i => i.Category)
                .Where(i => i.IsActive && i.StockQuantity <= i.MinimumStock)
                .Select(i => new
                {
                    Id = i.Id,
                    Name = i.Name,
                    CategoryName = i.Category.Name,
                    StockQuantity = i.StockQuantity,
                    MinimumStock = i.MinimumStock,
                    Shortage = i.MinimumStock - i.StockQuantity
                })
                .ToListAsync();

            return Ok(lowStockItems);
        }

        // GET: api/inventory/search?query=laptop
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Item>>> SearchItems([FromQuery] string query)
        {
            var items = await _context.Items
                .Include(i => i.Category)
                .Where(i => i.IsActive && 
                           (i.Name.Contains(query) || 
                            i.Description.Contains(query) ||
                            i.Category.Name.Contains(query)))
                .ToListAsync();

            return Ok(items);
        }

        // GET: api/inventory/items/category/5
        [HttpGet("items/category/{categoryId}")]
        public async Task<ActionResult<IEnumerable<Item>>> GetItemsByCategory(int categoryId)
        {
            var items = await _context.Items
                .Include(i => i.Category)
                .Where(i => i.IsActive && i.CategoryId == categoryId)
                .ToListAsync();

            return Ok(items);
        }
    }
}
