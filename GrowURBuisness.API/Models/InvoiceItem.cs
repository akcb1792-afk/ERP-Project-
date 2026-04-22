using System.ComponentModel.DataAnnotations;

namespace GrowURBuisness.API.Models
{
    public class InvoiceItem
    {
        public int Id { get; set; }

        // Foreign keys
        public int InvoiceId { get; set; }
        public int ItemId { get; set; }

        public int Quantity { get; set; }

        public decimal Price { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime LastModifiedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Invoice Invoice { get; set; } = null!;
        public virtual Item Item { get; set; } = null!;
    }
}
