using System.ComponentModel.DataAnnotations;

namespace GrowURBuisness.API.Models
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime LastModifiedDate { get; set; } = DateTime.UtcNow;

        // Navigation property
        public virtual ICollection<Item> Items { get; set; } = new List<Item>();
    }
}
