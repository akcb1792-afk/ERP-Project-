using System.ComponentModel.DataAnnotations;

namespace GrowURBuisness.Data
{
    public class Purchase
    {
        public int Id { get; set; }

        public DateTime PurchaseDate { get; set; }

        public decimal TotalAmount { get; set; }

        public int ItemCount { get; set; }

        public DateTime CreatedDate { get; set; }

        // Navigation property for related items
        public ICollection<PurchaseItem> PurchaseItems { get; set; } = new List<PurchaseItem>();
    }

    public class PurchaseItem
    {
        public int Id { get; set; }

        public int ItemId { get; set; }

        public int Quantity { get; set; }

        public decimal PurchasePrice { get; set; }

        public int PurchaseId { get; set; }
    }
}
