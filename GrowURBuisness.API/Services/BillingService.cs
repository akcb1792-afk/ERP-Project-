using GrowURBuisness.API.Models;
using GrowURBuisness.API.DTOs;
using GrowURBuisness.API.Repositories;

namespace GrowURBuisness.API.Services
{
    public class BillingService : IBillingService
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IGenericRepository<InvoiceItem> _invoiceItemRepository;
        private readonly IGenericRepository<LedgerEntry> _ledgerEntryRepository;
        private readonly IItemService _itemService;
        private readonly IGenericRepository<Customer> _customerRepository;

        public BillingService(
            IInvoiceRepository invoiceRepository,
            IGenericRepository<InvoiceItem> invoiceItemRepository,
            IGenericRepository<LedgerEntry> ledgerEntryRepository,
            IItemService itemService,
            IGenericRepository<Customer> customerRepository)
        {
            _invoiceRepository = invoiceRepository;
            _invoiceItemRepository = invoiceItemRepository;
            _ledgerEntryRepository = ledgerEntryRepository;
            _itemService = itemService;
            _customerRepository = customerRepository;
        }

        public async Task<Invoice?> CreateInvoiceAsync(CreateInvoiceDto createInvoiceDto)
        {
            // Validate customer exists
            var customer = await _customerRepository.GetByIdAsync(createInvoiceDto.CustomerId);
            if (customer == null)
                return null;

            // Calculate total amount
            decimal totalAmount = 0;
            foreach (var itemDto in createInvoiceDto.InvoiceItems)
            {
                totalAmount += itemDto.Quantity * itemDto.Price;
            }

            // Create invoice
            var invoice = new Invoice
            {
                CustomerId = createInvoiceDto.CustomerId,
                TotalAmount = totalAmount,
                PaymentType = createInvoiceDto.PaymentType,
                CreatedDate = DateTime.UtcNow,
                LastModifiedDate = DateTime.UtcNow
            };

            var createdInvoice = await _invoiceRepository.AddAsync(invoice);

            // Create invoice items and update stock
            foreach (var itemDto in createInvoiceDto.InvoiceItems)
            {
                // Create invoice item
                var invoiceItem = new InvoiceItem
                {
                    InvoiceId = createdInvoice.Id,
                    ItemId = itemDto.ItemId,
                    Quantity = itemDto.Quantity,
                    Price = itemDto.Price,
                    CreatedDate = DateTime.UtcNow,
                    LastModifiedDate = DateTime.UtcNow
                };

                await _invoiceItemRepository.AddAsync(invoiceItem);

                // Reduce stock using StockTransactions
                var stockUpdated = await _itemService.UpdateStockAsync(
                    itemDto.ItemId, 
                    -itemDto.Quantity, // Negative for sale
                    "Sale"
                );

                if (!stockUpdated)
                {
                    // Rollback invoice creation if stock update fails
                    await _invoiceRepository.DeleteAsync(createdInvoice.Id);
                    return null;
                }
            }

            // Create ledger entry if payment type is Credit
            if (createInvoiceDto.PaymentType.ToLower() == "credit")
            {
                var ledgerEntry = new LedgerEntry
                {
                    CustomerId = createInvoiceDto.CustomerId,
                    Debit = totalAmount,
                    Credit = 0,
                    CreatedDate = DateTime.UtcNow,
                    ReferenceId = createdInvoice.Id,
                    LastModifiedDate = DateTime.UtcNow
                };

                await _ledgerEntryRepository.AddAsync(ledgerEntry);
            }

            return createdInvoice;
        }

        public async Task<Invoice?> GetInvoiceByIdAsync(int id)
        {
            return await _invoiceRepository.GetWithItemsAsync(id);
        }

        public async Task<IEnumerable<Invoice>> GetInvoicesByCustomerAsync(int customerId)
        {
            return await _invoiceRepository.GetByCustomerAsync(customerId);
        }

        public async Task<IEnumerable<Invoice>> GetInvoicesByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _invoiceRepository.GetInvoicesByDateRangeAsync(startDate, endDate);
        }

        public async Task<bool> ProcessPaymentAsync(int invoiceId, decimal paymentAmount)
        {
            var invoice = await _invoiceRepository.GetByIdAsync(invoiceId);
            if (invoice == null)
                return false;

            // Create credit ledger entry for payment
            var ledgerEntry = new LedgerEntry
            {
                CustomerId = invoice.CustomerId,
                Debit = 0,
                Credit = paymentAmount,
                CreatedDate = DateTime.UtcNow,
                ReferenceId = invoiceId,
                LastModifiedDate = DateTime.UtcNow
            };

            await _ledgerEntryRepository.AddAsync(ledgerEntry);

            return true;
        }
    }
}
