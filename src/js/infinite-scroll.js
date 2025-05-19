/**
 * RetroCSS Infinite Scroll Implementation
 */
const RetroInfiniteScroll = {
  isLoading: false,
  page: 1,
  itemsPerPage: 5,
  maxPages: 5, // For demo purposes

  init() {
    const containers = document.querySelectorAll(".retro-infinite-scroll");
    if (!containers.length) return;

    containers.forEach((container) => {
      // Initialize with first batch of items
      this.appendItems(container, 1);

      // Set up scroll event listener
      container.addEventListener("scroll", () => {
        // Check if we're near the bottom of the container
        if (
          this.isNearBottom(container) &&
          !this.isLoading &&
          this.page < this.maxPages
        ) {
          this.loadMoreItems(container);
        }
      });
    });
  },

  isNearBottom(container) {
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight < 50
    );
  },

  loadMoreItems(container) {
    const loader = container.querySelector(".retro-infinite-loader");

    // Show loading state
    this.isLoading = true;
    if (loader) loader.style.display = "flex";

    // Simulate API request with delay
    setTimeout(() => {
      this.page++;
      this.appendItems(container, this.page);

      // Hide loading state
      this.isLoading = false;
      if (loader) loader.style.display = "none";

      // If we've reached the max pages, add an end message
      if (this.page >= this.maxPages) {
        const endMessage = document.createElement("div");
        endMessage.className = "retro-infinite-end";
        endMessage.textContent = "End of content";
        endMessage.style.textAlign = "center";
        endMessage.style.padding = "20px";
        endMessage.style.color = "var(--retro-border-medium)";
        container.appendChild(endMessage);
      }
    }, 800); // Simulate network delay
  },

  appendItems(container, page) {
    const loader = container.querySelector(".retro-infinite-loader");

    // Create demo items for the current page
    for (let i = 1; i <= this.itemsPerPage; i++) {
      const itemIndex = (page - 1) * this.itemsPerPage + i;

      const item = document.createElement("div");
      item.className = "retro-card retro-mb-3";

      const card = `
        <div class="retro-card-header">
          Item ${itemIndex}
        </div>
        <div class="retro-card-content">
          <p>This is demo content for infinite scroll. Scroll down to load more items.</p>
          <div class="retro-progress" style="margin-top: 10px;">
            <div class="retro-progress-bar" style="width: ${Math.floor(
              Math.random() * 100
            )}%;"></div>
          </div>
        </div>
      `;

      item.innerHTML = card;

      // Insert before the loader
      if (loader) {
        container.insertBefore(item, loader);
      } else {
        container.appendChild(item);
      }
    }
  },
};

// Expose globally for RetroCSS.js to pick up
window.RetroInfiniteScroll = RetroInfiniteScroll;
