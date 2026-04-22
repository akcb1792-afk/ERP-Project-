using Microsoft.AspNetCore.Mvc;
using GrowURBuisness.Models;
using GrowURBuisness.Services;

namespace GrowURBuisness.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StockController : ControllerBase
    {
        private readonly IStockService _stockService;

        public StockController(IStockService stockService)
        {
            _stockService = stockService;
        }

        [HttpGet]
        public async Task<IActionResult> RecalculateStockFromTransactions()
        {
            try
            {
                var result = await _stockService.RecalculateStockFromTransactionsAsync();
                return Ok(new { success = true, message = "Stock recalculated successfully", data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
