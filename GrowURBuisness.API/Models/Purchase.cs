using System.ComponentModel.DataAnnotations;

namespace GrowURBuisness.API.Models
{
    public class Purchase
    {
        public int Id { get; set; }

        public int VendorId { get; set; }

        public decimal TotalAmount { get; set; }

        public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public string Status { get; set; } = "Completed";

        // Navigation properties
        public virtual ICollection<PurchaseItem> PurchaseItems { get; set; } = new List<PurchaseItem>();
    }

    public class PurchaseItem
    {
        public int Id { get; set; }

        public int PurchaseId { get; set; }

        public int ItemId { get; set; }

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal TotalPrice { get; set; }

        // Navigation properties
        public virtual Purchase Purchase { get; set; } = null!;
        public virtual Item Item { get; set; } = null!;
    }
}
