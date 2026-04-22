using GrowURBuisness.Models;
using GrowURBuisness.Data;

namespace GrowURBuisness.Services
{
    public class PurchaseService : IPurchaseService
    {
        private readonly ApplicationDbContext _context;

        public PurchaseService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<object> CreatePurchaseAsync(CreatePurchaseRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Create purchase record first
                var purchase = new Purchase
                {
                    PurchaseDate = DateTime.UtcNow,
                    TotalAmount = request.Items.Sum(i => i.Quantity * i.PurchasePrice),
                    ItemCount = request.Items.Count,
                    CreatedDate = DateTime.UtcNow
                };

                _context.Purchases.Add(purchase);
                await _context.SaveChangesAsync();

                // Process each item in purchase
                foreach (var item in request.Items)
                {
                    // Insert stock transaction for purchase
                    var stockTransaction = new StockTransaction
                    {
                        ItemId = item.ItemId,
                        QuantityChange = item.Quantity, // Positive for stock in
                        Type = "Purchase",
                        ReferenceId = purchase.Id, // Use purchase ID as reference
                        Price = item.PurchasePrice,
                        CreatedDate = DateTime.UtcNow
                    };
                    _context.StockTransactions.Add(stockTransaction);

                    // Update item stock quantity
                    var inventoryItem = await _context.InventoryItems.FindAsync(item.ItemId);
                    if (inventoryItem != null)
                    {
                        inventoryItem.StockQuantity += item.Quantity;
                    }
                    else
                    {
                        // Create new inventory item if not exists
                        var newItem = new InventoryItem
                        {
                            Name = $"Purchased Item {item.ItemId}",
                            Category = "Purchased",
                            Price = item.PurchasePrice,
                            StockQuantity = item.Quantity
                        };
                        _context.InventoryItems.Add(newItem);
                    }

                    // Create purchase item record
                    var purchaseItem = new PurchaseItem
                    {
                        ItemId = item.ItemId,
                        Quantity = item.Quantity,
                        PurchasePrice = item.PurchasePrice,
                        PurchaseId = purchase.Id
                    };
                    _context.PurchaseItems.Add(purchaseItem);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new { success = true, message = "Purchase created successfully", data = purchase };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<IEnumerable<object>> GetPurchasesAsync()
        {
            return await _context.Purchases
                .Include(p => p.PurchaseItems)
                .Select(p => new
                {
                    p.Id,
                    p.PurchaseDate,
                    p.TotalAmount,
                    p.ItemCount,
                    p.CreatedDate,
                    Items = p.PurchaseItems.Select(pi => new
                    {
                        pi.Id,
                        pi.ItemId,
                        pi.Quantity,
                        pi.PurchasePrice
                    }).ToList()
                })
                .ToListAsync();
        }
    }
}
