using Microsoft.AspNetCore.Mvc;
using GrowURBuisness.API.Services;
using GrowURBuisness.API.DTOs;

namespace GrowURBuisness.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BillingController : ControllerBase
    {
        private readonly IBillingService _billingService;

        public BillingController(IBillingService billingService)
        {
            _billingService = billingService;
        }

        [HttpPost("create")]
        public async Task<ActionResult<InvoiceResponse>> CreateInvoice([FromBody] CreateInvoiceRequest request)
        {
            try
            {
                // Validate request
                if (request.Items == null || !request.Items.Any())
                {
                    return BadRequest(new InvoiceResponse
                    {
                        Success = false,
                        Message = "At least one item is required to create an invoice."
                    });
                }

                // Convert to CreateInvoiceDto
                var createInvoiceDto = new CreateInvoiceDto
                {
                    CustomerId = request.CustomerId,
                    PaymentType = request.PaymentType,
                    InvoiceItems = request.Items.Select(item => new InvoiceItemDto
                    {
                        ItemId = item.ItemId,
                        Quantity = item.Quantity,
                        Price = item.Price
                    }).ToList()
                };

                // Create invoice using service
                var invoice = await _billingService.CreateInvoiceAsync(createInvoiceDto);

                if (invoice == null)
                {
                    return BadRequest(new InvoiceResponse
                    {
                        Success = false,
                        Message = "Failed to create invoice. Please check customer exists and items have sufficient stock."
                    });
                }

                // Calculate total for response
                decimal totalAmount = request.Items.Sum(item => item.Quantity * item.Price);

                return Ok(new InvoiceResponse
                {
                    InvoiceId = invoice.Id,
                    TotalAmount = totalAmount,
                    Success = true,
                    Message = "Invoice created successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new InvoiceResponse
                {
                    Success = false,
                    Message = $"An error occurred while creating invoice: {ex.Message}"
                });
            }
        }
    }
}
