using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GrowURBuisness.API.Data;
using GrowURBuisness.API.Models;

namespace GrowURBuisness.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CustomerController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/customers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Customer>>> GetCustomers()
        {
            var customers = await _context.Customers
                .ToListAsync();

            return Ok(customers);
        }

        // GET: api/customers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Customer>> GetCustomer(int id)
        {
            var customer = await _context.Customers.FindAsync(id);

            if (customer == null)
            {
                return NotFound();
            }

            return Ok(customer);
        }

        // POST: api/customers
        [HttpPost]
        public async Task<ActionResult<Customer>> CreateCustomer([FromBody] Customer customer)
        {
            customer.CreatedDate = DateTime.Now;
            customer.LastModifiedDate = DateTime.Now;
            customer.IsActive = true;

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customer);
        }

        // PUT: api/customers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(int id, [FromBody] Customer customer)
        {
            if (id != customer.Id)
            {
                return BadRequest();
            }

            var existingCustomer = await _context.Customers.FindAsync(id);
            if (existingCustomer == null)
            {
                return NotFound();
            }

            existingCustomer.Name = customer.Name;
            existingCustomer.Email = customer.Email;
            existingCustomer.Phone = customer.Phone;
            existingCustomer.Address = customer.Address;
            existingCustomer.CustomerType = customer.CustomerType;
            existingCustomer.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/customers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound();
            }

            customer.IsActive = false;
            customer.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/customers/search?query=john
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Customer>>> SearchCustomers([FromQuery] string query)
        {
            var customers = await _context.Customers
                .Where(c => c.IsActive && 
                           (c.Name.Contains(query) || 
                            c.Email.Contains(query) ||
                            c.Phone.Contains(query)))
                .ToListAsync();

            return Ok(customers);
        }

        // GET: api/customers/type/Premium
        [HttpGet("type/{customerType}")]
        public async Task<ActionResult<IEnumerable<Customer>>> GetCustomersByType(string customerType)
        {
            var customers = await _context.Customers
                .Where(c => c.IsActive && c.CustomerType == customerType)
                .ToListAsync();

            return Ok(customers);
        }

        // GET: api/customers/stats
        [HttpGet("stats")]
        public async Task<ActionResult<object>> GetCustomerStats()
        {
            var totalCustomers = await _context.Customers.CountAsync(c => c.IsActive);
            var regularCustomers = await _context.Customers.CountAsync(c => c.IsActive && c.CustomerType == "Regular");
            var premiumCustomers = await _context.Customers.CountAsync(c => c.IsActive && c.CustomerType == "Premium");

            return Ok(new
            {
                TotalCustomers = totalCustomers,
                RegularCustomers = regularCustomers,
                PremiumCustomers = premiumCustomers,
                PremiumPercentage = totalCustomers > 0 ? (premiumCustomers * 100.0 / totalCustomers) : 0
            });
        }

        // GET: api/customers/5/orders
        [HttpGet("{customerId}/orders")]
        public async Task<ActionResult<IEnumerable<object>>> GetCustomerOrders(int customerId)
        {
            var customer = await _context.Customers.FindAsync(customerId);
            if (customer == null)
            {
                return NotFound();
            }

            var orders = await _context.Invoices
                .Where(i => i.CustomerId == customerId)
                .Select(i => new
                {
                    i.Id,
                    i.InvoiceNumber,
                    i.TotalAmount,
                    i.Status,
                    i.InvoiceDate,
                    i.DueDate,
                    i.PaymentType
                })
                .OrderByDescending(i => i.InvoiceDate)
                .ToListAsync();

            return Ok(orders);
        }

        // GET: api/customers/5/invoices
        [HttpGet("{customerId}/invoices")]
        public async Task<ActionResult<IEnumerable<object>>> GetCustomerInvoices(int customerId)
        {
            var customer = await _context.Customers.FindAsync(customerId);
            if (customer == null)
            {
                return NotFound();
            }

            var invoices = await _context.Invoices
                .Include(i => i.InvoiceItems)
                .ThenInclude(ii => ii.Item)
                .Where(i => i.CustomerId == customerId)
                .Select(i => new
                {
                    i.Id,
                    i.InvoiceNumber,
                    i.TotalAmount,
                    i.DiscountAmount,
                    i.TaxAmount,
                    i.FinalAmount,
                    i.Status,
                    i.InvoiceDate,
                    i.DueDate,
                    i.PaymentType,
                    ItemCount = i.InvoiceItems.Count,
                    Items = i.InvoiceItems.Select(ii => new
                    {
                        ii.Item.Name,
                        ii.Quantity,
                        ii.UnitPrice,
                        ii.TotalAmount
                    }).ToList()
                })
                .OrderByDescending(i => i.InvoiceDate)
                .ToListAsync();

            return Ok(invoices);
        }
    }
}
