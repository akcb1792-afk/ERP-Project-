using System.ComponentModel.DataAnnotations;

namespace GrowURBuisness.API.Models
{
    public class Invoice
    {
        public int Id { get; set; }

        // Foreign key
        public int CustomerId { get; set; }

        public decimal TotalAmount { get; set; }

        [MaxLength(50)]
        public string PaymentType { get; set; } = string.Empty;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime LastModifiedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Customer Customer { get; set; } = null!;
        public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
    }
}
