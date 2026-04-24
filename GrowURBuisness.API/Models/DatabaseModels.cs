using System.ComponentModel.DataAnnotations;

namespace GrowURBuisness.API.Models
{
    // Category Model
    public class Category
    {
        public int Id { get; set; }
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedDate { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual ICollection<Item> Items { get; set; } = new List<Item>();
    }

    // Item Model
    public class Item
    {
        public int Id { get; set; }
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int CategoryId { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int MinimumStock { get; set; }
        public string Unit { get; set; } = "PCS";
        public DateTime CreatedDate { get; set; }
        public DateTime LastModifiedDate { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual Category? Category { get; set; }
        public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
        public virtual ICollection<StockTransaction> StockTransactions { get; set; } = new List<StockTransaction>();
        public virtual ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();
    }

    // Customer Model
    public class Customer
    {
        public int Id { get; set; }
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string CustomerType { get; set; } = "Regular";
        public DateTime CreatedDate { get; set; }
        public DateTime LastModifiedDate { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
        public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
    }

    
    // Invoice Model
    public class Invoice
    {
        public int Id { get; set; }
        [Required]
        [MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;
        public int CustomerId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; } = 0;
        public decimal TaxAmount { get; set; } = 0;
        public decimal FinalAmount { get; set; }
        public string PaymentType { get; set; } = "Cash";
        public string Status { get; set; } = "Pending";
        public DateTime InvoiceDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime LastModifiedDate { get; set; }

        // Navigation properties
        public virtual Customer Customer { get; set; } = null!;
        public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
    }

    // InvoiceItem Model
    public class InvoiceItem
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public int ItemId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal DiscountAmount { get; set; } = 0;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedDate { get; set; }

        // Navigation properties
        public virtual Invoice Invoice { get; set; } = null!;
        public virtual Item Item { get; set; } = null!;
    }

    // PurchaseOrder Model
    public class PurchaseOrder
    {
        public int Id { get; set; }
        [Required]
        [MaxLength(50)]
        public string PurchaseOrderNumber { get; set; } = string.Empty;
        public int VendorId { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime OrderDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime LastModifiedDate { get; set; }

        // Navigation properties
        public virtual Customer Vendor { get; set; } = null!;
        public virtual ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();
    }

    // PurchaseOrderItem Model
    public class PurchaseOrderItem
    {
        public int Id { get; set; }
        public int PurchaseOrderId { get; set; }
        public int ItemId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public int ReceivedQuantity { get; set; } = 0;
        public DateTime CreatedDate { get; set; }

        // Navigation properties
        public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;
        public virtual Item Item { get; set; } = null!;
    }

    // StockTransaction Model
    public class StockTransaction
    {
        public int Id { get; set; }
        public int ItemId { get; set; }
        public string TransactionType { get; set; } = string.Empty; // 'Purchase', 'Sale', 'Adjustment', 'Opening'
        public int QuantityChange { get; set; } // Positive for stock in, negative for stock out
        public string? ReferenceType { get; set; } // 'Invoice', 'PurchaseOrder', 'Adjustment'
        public int? ReferenceId { get; set; }
        public decimal? UnitPrice { get; set; }
        public string? Notes { get; set; }
        public DateTime TransactionDate { get; set; }
        public DateTime CreatedDate { get; set; }

        // Navigation properties
        public virtual Item Item { get; set; } = null!;
    }

    // LedgerEntry Model
    public class LedgerEntry
    {
        public int Id { get; set; }
        public string TransactionType { get; set; } = string.Empty; // 'Sale', 'Purchase', 'Payment', 'Receipt'
        public string? ReferenceType { get; set; } // 'Invoice', 'PurchaseOrder'
        public int? ReferenceId { get; set; }
        public string AccountType { get; set; } = string.Empty; // 'Cash', 'Bank', 'Accounts Receivable', 'Accounts Payable'
        public decimal DebitAmount { get; set; } = 0;
        public decimal CreditAmount { get; set; } = 0;
        public decimal? Balance { get; set; }
        public string? Description { get; set; }
        public DateTime TransactionDate { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
