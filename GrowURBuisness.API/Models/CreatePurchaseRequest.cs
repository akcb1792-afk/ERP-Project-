namespace GrowURBuisness.API.Models
{
    public class CreatePurchaseRequest
    {
        public int VendorId { get; set; }
        public List<PurchaseItemRequest> Items { get; set; } = new List<PurchaseItemRequest>();
    }

    public class PurchaseItemRequest
    {
        public int ItemId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
