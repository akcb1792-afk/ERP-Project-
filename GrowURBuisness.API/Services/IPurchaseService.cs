using GrowURBuisness.Models;

namespace GrowURBuisness.Services
{
    public interface IPurchaseService
    {
        Task<object> CreatePurchaseAsync(CreatePurchaseRequest request);
        Task<IEnumerable<object>> GetPurchasesAsync();
    }
}
