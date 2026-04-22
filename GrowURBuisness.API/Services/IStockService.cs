using GrowURBuisness.Models;

namespace GrowURBuisness.Services
{
    public interface IStockService
    {
        Task<object> RecalculateStockFromTransactionsAsync();
    }
}
