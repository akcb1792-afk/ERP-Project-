using Microsoft.EntityFrameworkCore;
using GrowURBuisness.API.Data;
using GrowURBuisness.API.Models;

namespace GrowURBuisness.API.Repositories
{
    public interface IInvoiceRepository : IGenericRepository<Invoice>
    {
        Task<IEnumerable<Invoice>> GetByCustomerAsync(int customerId);
        Task<IEnumerable<Invoice>> GetByPaymentTypeAsync(string paymentType);
        Task<Invoice?> GetWithItemsAsync(int id);
        Task<IEnumerable<Invoice>> GetInvoicesByDateRangeAsync(DateTime startDate, DateTime endDate);
    }

    public class InvoiceRepository : GenericRepository<Invoice>, IInvoiceRepository
    {
        public InvoiceRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Invoice>> GetByCustomerAsync(int customerId)
        {
            return await _dbSet
                .Where(i => i.CustomerId == customerId)
                .Include(i => i.Customer)
                .Include(i => i.InvoiceItems)
                .ThenInclude(ii => ii.Item)
                .OrderByDescending(i => i.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Invoice>> GetByPaymentTypeAsync(string paymentType)
        {
            return await _dbSet
                .Where(i => i.PaymentType.ToLower() == paymentType.ToLower())
                .Include(i => i.Customer)
                .Include(i => i.InvoiceItems)
                .ThenInclude(ii => ii.Item)
                .OrderByDescending(i => i.CreatedDate)
                .ToListAsync();
        }

        public async Task<Invoice?> GetWithItemsAsync(int id)
        {
            return await _dbSet
                .Include(i => i.Customer)
                .Include(i => i.InvoiceItems)
                .ThenInclude(ii => ii.Item)
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<IEnumerable<Invoice>> GetInvoicesByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _dbSet
                .Where(i => i.CreatedDate >= startDate && i.CreatedDate <= endDate)
                .Include(i => i.Customer)
                .Include(i => i.InvoiceItems)
                .ThenInclude(ii => ii.Item)
                .OrderByDescending(i => i.CreatedDate)
                .ToListAsync();
        }
    }
}
