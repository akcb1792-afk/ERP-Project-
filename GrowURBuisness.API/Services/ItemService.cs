using GrowURBuisness.API.Models;
using GrowURBuisness.API.Repositories;
using GrowURBuisness.API.Data;
using Microsoft.EntityFrameworkCore;

namespace GrowURBuisness.API.Services
{
    public class ItemService : IItemService
    {
        private readonly IGenericRepository<Item> _itemRepository;
        private readonly ApplicationDbContext _context;

        public ItemService(IGenericRepository<Item> itemRepository, ApplicationDbContext context)
        {
            _itemRepository = itemRepository;
            _context = context;
        }

        public async Task<IEnumerable<Item>> GetAllItemsAsync()
        {
            return await _itemRepository.GetAllAsync();
        }

        public async Task<Item?> GetItemByIdAsync(int id)
        {
            return await _itemRepository.GetByIdAsync(id);
        }

        public async Task<Item> CreateItemAsync(Item item)
        {
            item.CreatedDate = DateTime.UtcNow;
            item.LastModifiedDate = DateTime.UtcNow;
            return await _itemRepository.AddAsync(item);
        }

        public async Task<Item> UpdateItemAsync(Item item)
        {
            item.LastModifiedDate = DateTime.UtcNow;
            return await _itemRepository.UpdateAsync(item);
        }

        public async Task<bool> DeleteItemAsync(int id)
        {
            try
            {
                var item = await _itemRepository.GetByIdAsync(id);
                if (item == null) return false;

                await _itemRepository.DeleteAsync(id);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateStockAsync(int itemId, int quantityChange, string transactionType)
        {
            try
            {
                var item = await _itemRepository.GetByIdAsync(itemId);
                if (item == null) return false;

                item.StockQuantity += quantityChange;
                item.LastModifiedDate = DateTime.UtcNow;

                await _itemRepository.UpdateAsync(item);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<IEnumerable<Item>> GetLowStockItemsAsync()
        {
            return await _context.Items
                .Where(i => i.StockQuantity <= i.MinimumStock && i.IsActive)
                .ToListAsync();
        }

        public async Task<IEnumerable<Item>> GetItemsByCategoryAsync(int categoryId)
        {
            return await _context.Items
                .Where(i => i.CategoryId == categoryId && i.IsActive)
                .ToListAsync();
        }
    }
}
