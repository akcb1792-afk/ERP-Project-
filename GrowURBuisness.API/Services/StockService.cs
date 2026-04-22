using GrowURBuisness.Data;
using GrowURBuisness.Models;

namespace GrowURBuisness.Services
{
    public class StockService : IStockService
    {
        private readonly ApplicationDbContext _context;

        public StockService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<object> RecalculateStockFromTransactionsAsync()
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Get all items and transactions
                var items = await _context.InventoryItems.ToListAsync();
                var transactions = await _context.StockTransactions.ToListAsync();

                // Recalculate stock for each item
                foreach (var item in items)
                {
                    var itemTransactions = transactions.Where(t => t.ItemId == item.Id).ToList();
                    var quantityChange = itemTransactions.Sum(t => t.QuantityChange);
                    var currentStock = (item.StockQuantity || 0) + quantityChange;
                    
                    // Update item stock quantity
                    item.StockQuantity = Math.Max(0, currentStock);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new { success = true, message = "Stock recalculated successfully from transactions", data = items };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
