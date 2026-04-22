using Microsoft.AspNetCore.Mvc;
using GrowURBuisness.Models;
using GrowURBuisness.Services;

namespace GrowURBuisness.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PurchaseController : ControllerBase
    {
        private readonly IPurchaseService _purchaseService;

        public PurchaseController(IPurchaseService purchaseService)
        {
            _purchaseService = purchaseService;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePurchase([FromBody] CreatePurchaseRequest request)
        {
            try
            {
                var result = await _purchaseService.CreatePurchaseAsync(request);
                return Ok(new { success = true, message = "Purchase created successfully", data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetPurchases()
        {
            try
            {
                var purchases = await _purchaseService.GetPurchasesAsync();
                return Ok(purchases);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
