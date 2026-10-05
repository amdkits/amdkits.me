(() => {
  const ROOT_SELECTOR = '#site-content';
  const NAV_EVENT = 'amdkits:navigate';

  function isInternalPageLink(link, event) {
    if (!link || !link.href) return false;
    if (event.defaultPrevented) return false;
    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return false;
    }
    if (link.target && link.target !== '_self') return false;
    if (link.hasAttribute('download')) return false;
    if (link.getAttribute('rel')?.split(/\s+/).includes('external')) {
      return false;
    }

    const url = new URL(link.href, window.location.href);

    if (url.origin !== window.location.origin) return false;
    if (url.protocol !== window.location.protocol) return false;

    // Let hash-only links behave normally.
    if (
      url.pathname === window.location.pathname &&
      url.search === window.location.search &&
      url.hash
    ) {
      return false;
    }

    return true;
  }

  function copyPageMetadata(doc) {
    document.title = doc.title;

    const incomingDescription = doc.querySelector(
      'meta[name="description"]'
    );
    const currentDescription = document.querySelector(
      'meta[name="description"]'
    );

    if (incomingDescription && currentDescription) {
      currentDescription.setAttribute(
        'content',
        incomingDescription.getAttribute('content') || ''
      );
    }

    document.body.className = doc.body.className;
  }

  function runPageScripts(root) {
    const scripts = [...root.querySelectorAll('script')];

    for (const oldScript of scripts) {
      const newScript = document.createElement('script');

      for (const attribute of oldScript.attributes) {
        newScript.setAttribute(attribute.name, attribute.value);
      }

      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else {
        newScript.textContent = oldScript.textContent;
      }

      oldScript.replaceWith(newScript);
    }
  }

  async function loadPage(url, { push = true, scroll = true } = {}) {
    const currentRoot = document.querySelector(ROOT_SELECTOR);

    if (!currentRoot) {
      window.location.href = url.href;
      return;
    }

    document.documentElement.classList.add('page-loading');

    try {
      const response = await fetch(url.href, {
        headers: {
          'X-Requested-With': 'amdkits-navigation'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const incomingRoot = doc.querySelector(ROOT_SELECTOR);

      // If the destination isn't one of our normal page layouts, fall back
      // to a real navigation rather than leaving the user with broken markup.
      if (!incomingRoot) {
        window.location.href = url.href;
        return;
      }

      const newRoot = document.importNode(incomingRoot, true);
      currentRoot.replaceWith(newRoot);

      copyPageMetadata(doc);
      runPageScripts(newRoot);

      const sidebar = document.querySelector('#sidebar-toggle');
      if (sidebar) sidebar.checked = false;

      if (push) {
        window.history.pushState({}, '', url.href);
      }

      if (scroll) {
        if (url.hash) {
          requestAnimationFrame(() => {
            document
              .getElementById(decodeURIComponent(url.hash.slice(1)))
              ?.scrollIntoView();
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      }

      window.dispatchEvent(
        new CustomEvent(NAV_EVENT, {
          detail: { url: url.href }
        })
      );
    } catch (error) {
      console.error('amdkits navigation failed:', error);
      window.location.href = url.href;
    } finally {
      document.documentElement.classList.remove('page-loading');
    }
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!isInternalPageLink(link, event)) return;

    const url = new URL(link.href, window.location.href);

    event.preventDefault();
    loadPage(url);
  });

  window.addEventListener('popstate', () => {
    loadPage(new URL(window.location.href), {
      push: false,
      scroll: true
    });
  });
})();
