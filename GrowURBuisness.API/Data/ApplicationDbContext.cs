using Microsoft.EntityFrameworkCore;
using GrowURBuisness.API.Models;

namespace GrowURBuisness.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // DbSets for all entities
        public DbSet<Item> Items { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<StockTransaction> StockTransactions { get; set; }
        public DbSet<LedgerEntry> LedgerEntries { get; set; }
        public DbSet<Purchase> Purchases { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Category
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.LastModifiedDate).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure Item
            modelBuilder.Entity<Item>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Price).HasPrecision(18, 2);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.LastModifiedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.Category)
                      .WithMany(c => c.Items)
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Customer
            modelBuilder.Entity<Customer>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Mobile).HasMaxLength(20);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.LastModifiedDate).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure Invoice
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
                entity.Property(e => e.PaymentType).HasMaxLength(50);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.LastModifiedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.Customer)
                      .WithMany(c => c.Invoices)
                      .HasForeignKey(e => e.CustomerId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure InvoiceItem
            modelBuilder.Entity<InvoiceItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Price).HasPrecision(18, 2);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.LastModifiedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.Invoice)
                      .WithMany(i => i.InvoiceItems)
                      .HasForeignKey(e => e.InvoiceId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Item)
                      .WithMany(i => i.InvoiceItems)
                      .HasForeignKey(e => e.ItemId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure StockTransaction
            modelBuilder.Entity<StockTransaction>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Type).HasMaxLength(50);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.LastModifiedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.Item)
                      .WithMany(i => i.StockTransactions)
                      .HasForeignKey(e => e.ItemId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure LedgerEntry
            modelBuilder.Entity<LedgerEntry>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Debit).HasPrecision(18, 2);
                entity.Property(e => e.Credit).HasPrecision(18, 2);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.LastModifiedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.Customer)
                      .WithMany(c => c.LedgerEntries)
                      .HasForeignKey(e => e.CustomerId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
