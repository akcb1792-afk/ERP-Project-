using GrowURBuisness.API.Models;
using GrowURBuisness.API.Repositories;

namespace GrowURBuisness.API.Services
{
    public class ItemService : IItemService
    {
        private readonly IItemRepository _itemRepository;
        private readonly IGenericRepository<StockTransaction> _stockTransactionRepository;

        public ItemService(IItemRepository itemRepository, IGenericRepository<StockTransaction> stockTransactionRepository)
        {
            _itemRepository = itemRepository;
            _stockTransactionRepository = stockTransactionRepository;
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
            return await _itemRepository.DeleteAsync(id);
        }

        public async Task<bool> UpdateStockAsync(int itemId, int quantityChange, string transactionType)
        {
            var item = await _itemRepository.GetByIdAsync(itemId);
            if (item == null)
                return false;

            // Check if there's enough stock for sales
            if (transactionType.ToLower() == "sale" && item.StockQuantity + quantityChange < 0)
                return false;

            // Update item stock
            item.StockQuantity += quantityChange;
            item.LastModifiedDate = DateTime.UtcNow;
            await _itemRepository.UpdateAsync(item);

            // Create stock transaction record
            var stockTransaction = new StockTransaction
            {
                ItemId = itemId,
                QuantityChange = quantityChange,
                Type = transactionType,
                CreatedDate = DateTime.UtcNow,
                LastModifiedDate = DateTime.UtcNow
            };

            await _stockTransactionRepository.AddAsync(stockTransaction);

            return true;
        }

        public async Task<IEnumerable<Item>> GetLowStockItemsAsync()
        {
            return await _itemRepository.GetLowStockItemsAsync();
        }

        public async Task<IEnumerable<Item>> GetItemsByCategoryAsync(int categoryId)
        {
            return await _itemRepository.GetByCategoryAsync(categoryId);
        }
    }
}
