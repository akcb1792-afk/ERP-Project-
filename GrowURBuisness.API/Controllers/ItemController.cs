using Microsoft.AspNetCore.Mvc;
using GrowURBuisness.API.Services;
using GrowURBuisness.API.DTOs;
using GrowURBuisness.API.Models;
using GrowURBuisness.API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace GrowURBuisness.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ItemController : ControllerBase
    {
        private readonly IItemService _itemService;
        private readonly IGenericRepository<Category> _categoryRepository;

        public ItemController(IItemService itemService, IGenericRepository<Category> categoryRepository)
        {
            _itemService = itemService;
            _categoryRepository = categoryRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ItemResponse>>> GetItems()
        {
            try
            {
                var items = await _itemService.GetAllItemsAsync();
                var itemResponses = new List<ItemResponse>();

                foreach (var item in items)
                {
                    // Get category information
                    var category = await _categoryRepository.GetByIdAsync(item.CategoryId);
                    
                    itemResponses.Add(new ItemResponse
                    {
                        Id = item.Id,
                        Name = item.Name,
                        CategoryId = item.CategoryId,
                        Price = item.Price,
                        StockQuantity = item.StockQuantity,
                        CreatedDate = item.CreatedDate,
                        LastModifiedDate = item.LastModifiedDate,
                        Category = category != null ? new CategoryDto
                        {
                            Id = category.Id,
                            Name = category.Name
                        } : null
                    });
                }

                return Ok(itemResponses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error retrieving items: {ex.Message}" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ItemResponse>> GetItem(int id)
        {
            try
            {
                var item = await _itemService.GetItemByIdAsync(id);
                if (item == null)
                {
                    return NotFound(new { message = "Item not found" });
                }

                // Get category information
                var category = await _categoryRepository.GetByIdAsync(item.CategoryId);

                var itemResponse = new ItemResponse
                {
                    Id = item.Id,
                    Name = item.Name,
                    CategoryId = item.CategoryId,
                    Price = item.Price,
                    StockQuantity = item.StockQuantity,
                    CreatedDate = item.CreatedDate,
                    LastModifiedDate = item.LastModifiedDate,
                    Category = category != null ? new CategoryDto
                    {
                        Id = category.Id,
                        Name = category.Name
                    } : null
                };

                return Ok(itemResponse);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error retrieving item: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ItemResponse>> CreateItem([FromBody] CreateItemRequest request)
        {
            try
            {
                // Validate category exists
                var category = await _categoryRepository.GetByIdAsync(request.CategoryId);
                if (category == null)
                {
                    return BadRequest(new { message = "Invalid category ID" });
                }

                // Create item entity
                var item = new Item
                {
                    Name = request.Name,
                    CategoryId = request.CategoryId,
                    Price = request.Price,
                    StockQuantity = request.StockQuantity,
                    CreatedDate = DateTime.UtcNow,
                    LastModifiedDate = DateTime.UtcNow
                };

                var createdItem = await _itemService.CreateItemAsync(item);

                // Get category for response
                var categoryResponse = new CategoryDto
                {
                    Id = category.Id,
                    Name = category.Name
                };

                var itemResponse = new ItemResponse
                {
                    Id = createdItem.Id,
                    Name = createdItem.Name,
                    CategoryId = createdItem.CategoryId,
                    Price = createdItem.Price,
                    StockQuantity = createdItem.StockQuantity,
                    CreatedDate = createdItem.CreatedDate,
                    LastModifiedDate = createdItem.LastModifiedDate,
                    Category = categoryResponse
                };

                return CreatedAtAction(nameof(GetItem), new { id = createdItem.Id }, itemResponse);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error creating item: {ex.Message}" });
            }
        }
    }
}
