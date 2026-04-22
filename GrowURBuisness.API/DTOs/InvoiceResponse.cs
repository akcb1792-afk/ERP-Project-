namespace GrowURBuisness.API.DTOs
{
    public class InvoiceResponse
    {
        public int InvoiceId { get; set; }
        public decimal TotalAmount { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool Success { get; set; }
    }
}
