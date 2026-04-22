using System.ComponentModel.DataAnnotations;

namespace GrowURBuisness.API.DTOs
{
    public class CreateInvoiceDto
    {
        [Required]
        public int CustomerId { get; set; }

        [Required]
        [MaxLength(50)]
        public string PaymentType { get; set; } = string.Empty;

        [Required]
        public List<InvoiceItemDto> InvoiceItems { get; set; } = new();
    }

    public class InvoiceItemDto
    {
        [Required]
        public int ItemId { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Price { get; set; }
    }
}
