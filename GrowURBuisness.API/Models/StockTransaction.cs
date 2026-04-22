using System.ComponentModel.DataAnnotations;

namespace GrowURBuisness.API.Models
{
    public class StockTransaction
    {
        public int Id { get; set; }

        // Foreign key
        public int ItemId { get; set; }

        public int QuantityChange { get; set; }

        [MaxLength(50)]
        public string Type { get; set; } = string.Empty;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime LastModifiedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Item Item { get; set; } = null!;
    }
}
