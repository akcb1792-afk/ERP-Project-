namespace GrowURBuisness.Models
{
    public class CreatePurchaseRequest
    {
        public List<PurchaseItemRequest> Items { get; set; }
    }

    public class PurchaseItemRequest
    {
        public int ItemId { get; set; }
        public int Quantity { get; set; }
        public decimal PurchasePrice { get; set; }
    }
}
