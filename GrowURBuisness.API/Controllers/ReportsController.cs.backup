using Microsoft.AspNetCore.Mvc;
using GrowURBuisness.API.Models;

namespace GrowURBuisness.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        [HttpGet("sales")]
        public ActionResult<SalesReport> GetSalesReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            var salesData = SampleData.GetSalesReportData(fromDate, toDate);
            return Ok(salesData);
        }

        [HttpGet("purchase")]
        public ActionResult<PurchaseReport> GetPurchaseReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, [FromQuery] string? vendorId = null)
        {
            var purchaseData = SampleData.GetPurchaseReportData(fromDate, toDate, vendorId);
            return Ok(purchaseData);
        }

        [HttpGet("purchase/detailed")]
        public ActionResult<List<DetailedPurchaseItem>> GetDetailedPurchaseReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, [FromQuery] string? vendorId = null)
        {
            var detailedData = SampleData.GetDetailedPurchaseData(fromDate, toDate, vendorId);
            return Ok(detailedData);
        }

        [HttpGet("purchase/items/{orderId}")]
        public ActionResult<List<PurchaseItem>> GetPurchaseItems(int orderId)
        {
            var items = SampleData.GetPurchaseItems(orderId);
            return Ok(items);
        }
    }

    // DTOs for Reports
    public class SalesReport
    {
        public List<DailySalesItem> DailySalesList { get; set; } = new();
        public decimal TotalSalesAmount { get; set; }
        public int TotalSalesCount { get; set; }
    }

    public class DailySalesItem
    {
        public DateTime Date { get; set; }
        public decimal TotalSales { get; set; }
        public int SalesCount { get; set; }
    }

    public class PurchaseReport
    {
        public List<DailyPurchaseItem> DailyPurchaseList { get; set; } = new();
        public decimal TotalPurchaseAmount { get; set; }
        public int TotalPurchaseCount { get; set; }
    }

    public class DailyPurchaseItem
    {
        public DateTime Date { get; set; }
        public decimal TotalPurchase { get; set; }
        public int PurchaseCount { get; set; }
    }

    public class DetailedPurchaseItem
    {
        public int OrderId { get; set; }
        public DateTime PurchaseDate { get; set; }
        public string VendorName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public int TotalItems { get; set; }
    }

    public class PurchaseItem
    {
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal Rate { get; set; }
        public decimal Amount { get; set; }
    }
}
