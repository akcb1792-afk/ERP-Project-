using GrowURBuisness.API.Models;
using GrowURBuisness.API.DTOs;

namespace GrowURBuisness.API.Services
{
    public interface IBillingService
    {
        Task<Invoice?> CreateInvoiceAsync(CreateInvoiceDto createInvoiceDto);
        Task<Invoice?> GetInvoiceByIdAsync(int id);
        Task<IEnumerable<Invoice>> GetInvoicesByCustomerAsync(int customerId);
        Task<IEnumerable<Invoice>> GetInvoicesByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<bool> ProcessPaymentAsync(int invoiceId, decimal paymentAmount);
    }
}
