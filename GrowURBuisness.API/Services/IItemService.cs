using GrowURBuisness.API.Models;

namespace GrowURBuisness.API.Services
{
    public interface IItemService
    {
        Task<IEnumerable<Item>> GetAllItemsAsync();
        Task<Item?> GetItemByIdAsync(int id);
        Task<Item> CreateItemAsync(Item item);
        Task<Item> UpdateItemAsync(Item item);
        Task<bool> DeleteItemAsync(int id);
        Task<bool> UpdateStockAsync(int itemId, int quantityChange, string transactionType);
        Task<IEnumerable<Item>> GetLowStockItemsAsync();
        Task<IEnumerable<Item>> GetItemsByCategoryAsync(int categoryId);
    }
}
