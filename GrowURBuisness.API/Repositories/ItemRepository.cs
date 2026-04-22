using Microsoft.EntityFrameworkCore;
using GrowURBuisness.API.Data;
using GrowURBuisness.API.Models;

namespace GrowURBuisness.API.Repositories
{
    public interface IItemRepository : IGenericRepository<Item>
    {
        Task<IEnumerable<Item>> GetByCategoryAsync(int categoryId);
        Task<IEnumerable<Item>> GetLowStockItemsAsync();
        Task<Item?> GetBySKUAsync(string sku);
    }

    public class ItemRepository : GenericRepository<Item>, IItemRepository
    {
        public ItemRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Item>> GetByCategoryAsync(int categoryId)
        {
            return await _dbSet
                .Where(i => i.CategoryId == categoryId)
                .Include(i => i.Category)
                .ToListAsync();
        }

        public async Task<IEnumerable<Item>> GetLowStockItemsAsync()
        {
            return await _dbSet
                .Where(i => i.StockQuantity <= 10) // Low stock threshold
                .Include(i => i.Category)
                .ToListAsync();
        }

        public async Task<Item?> GetBySKUAsync(string sku)
        {
            return await _dbSet
                .Include(i => i.Category)
                .FirstOrDefaultAsync(i => i.Name.Contains(sku) || i.Category.Name.Contains(sku));
        }
    }
}
