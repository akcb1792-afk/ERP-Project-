using System.ComponentModel.DataAnnotations;

namespace GrowURBuisness.API.Models
{
    public class LedgerEntry
    {
        public int Id { get; set; }

        // Foreign key
        public int CustomerId { get; set; }

        public decimal Debit { get; set; }

        public decimal Credit { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public int ReferenceId { get; set; }

        public DateTime LastModifiedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Customer Customer { get; set; } = null!;
    }
}
