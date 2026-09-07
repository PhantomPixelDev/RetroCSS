/**
 * RetroCSS Infinite Scroll
 *
 * Watches a scroll container and asks the page for more content when the
 * bottom comes into view. It does not invent content: previously this module
 * generated placeholder "Item N" cards with Math.random() progress bars and a
 * hardcoded five-page limit, which meant every consuming application got fake
 * data injected into its own scroll containers.
 *
 * Supply content by listening for the `retro:loadmore` event:
 *
 *   container.addEventListener('retro:loadmore', (e) => {
 *     const { page, append, done } = e.detail;
 *     fetchPage(page).then((items) => {
 *       items.forEach((i) => append(renderCard(i)));
 *       if (!items.length) done();
 *     });
 *   });
 *
 * With no listener the container simply never grows, which is the correct
 * default for a component that has no data source.
 */
const RetroInfiniteScroll = {
  /** How close to the bottom, in px, before more content is requested. */
  threshold: 50,

  init(root = document) {
    const containers = root.querySelectorAll('.retro-infinite-scroll');

    containers.forEach((container) => {
      // Idempotent: RetroCSS.init() is documented as a manual entry point, and
      // binding twice would fire two requests per scroll.
      if (container.dataset.retroInfiniteBound === 'true') return;
      container.dataset.retroInfiniteBound = 'true';

      // Per container. These used to live on the singleton, so two lists on a
      // page shared one page counter and one loading flag.
      const state = { page: 1, loading: false, finished: false };

      container.addEventListener('scroll', () => {
        if (state.loading || state.finished) return;
        if (!this.isNearBottom(container)) return;
        this.requestMore(container, state);
      });
    });
  },

  isNearBottom(container) {
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      this.threshold
    );
  },

  requestMore(container, state) {
    const loader = container.querySelector('.retro-infinite-loader');
    state.loading = true;
    if (loader) loader.style.display = 'flex';

    const settle = () => {
      state.loading = false;
      if (loader) loader.style.display = 'none';
    };

    const detail = {
      page: state.page + 1,
      /** Insert a node above the loader. */
      append(node) {
        if (loader) container.insertBefore(node, loader);
        else container.appendChild(node);
      },
      /** Call when a page has been added. */
      loaded() {
        state.page += 1;
        settle();
      },
      /** Call when there is nothing left. */
      done() {
        state.finished = true;
        settle();
        if (container.querySelector('.retro-infinite-end')) return;
        const end = document.createElement('div');
        end.className = 'retro-infinite-end';
        end.textContent = 'End of content';
        container.appendChild(end);
      },
    };

    const delivered = container.dispatchEvent(
      new CustomEvent('retro:loadmore', { detail, bubbles: true, cancelable: true }),
    );

    // Nothing listening, or nobody resolved it synchronously: release the lock
    // so the container is not wedged in a loading state forever.
    if (delivered && state.loading) settle();
  },
};

if (typeof window !== 'undefined') window.RetroInfiniteScroll = RetroInfiniteScroll;

export default RetroInfiniteScroll;
