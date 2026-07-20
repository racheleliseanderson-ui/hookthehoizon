(() => {
  const config = window.NLHPublicationRuntime || {};
  const storageKey = `nlh:${config.key || 'publication'}:saved`;
  const headers = {'Content-Type': 'application/json'};
  if (config.nonce) headers['X-WP-Nonce'] = config.nonce;
  const localItems = () => { try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (_) { return []; } };
  const writeLocal = (items) => localStorage.setItem(storageKey, JSON.stringify(items));
  const request = async (path, options = {}) => {
    const response = await fetch(`${config.restRoot}${path}`, {...options, headers: {...headers, ...(options.headers || {})}});
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  };
  const syncSaveButtons = (items) => {
    const ids = new Set(items.map((item) => String(item.id)));
    document.querySelectorAll('[data-nlh-save]').forEach((button) => {
      const saved = ids.has(String(button.dataset.itemId));
      button.setAttribute('aria-pressed', saved ? 'true' : 'false');
      button.dataset.saved = saved ? 'true' : 'false';
      const label = button.querySelector('[data-nlh-save-label]');
      if (label) label.textContent = saved ? 'Saved' : 'Save';
    });
  };
  const getSaved = async () => config.loggedIn ? (await request('/saved')).items : localItems();
  const toggleSaved = async (button) => {
    const id = Number(button.dataset.itemId);
    const type = button.dataset.itemType || 'post';
    const isSaved = button.dataset.saved === 'true';
    let items;
    if (config.loggedIn) {
      items = (await request(`/saved${isSaved ? `?item_id=${id}` : ''}`, {method: isSaved ? 'DELETE' : 'POST', body: isSaved ? undefined : JSON.stringify({item_id: id, item_type: type})})).items;
    } else {
      items = localItems().filter((item) => Number(item.id) !== id);
      if (!isSaved) items.push({id, type, savedAt: new Date().toISOString()});
      writeLocal(items);
    }
    syncSaveButtons(items);
    document.dispatchEvent(new CustomEvent('nlh:saved-change', {detail: {items}}));
  };
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-nlh-save]');
    if (!button) return;
    event.preventDefault();
    toggleSaved(button).catch(() => { const status = button.querySelector('[data-nlh-save-status]'); if (status) status.textContent = 'Save failed. Try again.'; });
  });
  document.querySelectorAll('form[data-nlh-discovery]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const target = document.getElementById(form.dataset.resultsTarget || 'nlh-results');
      if (!target) return;
      target.setAttribute('aria-busy', 'true');
      try {
        const payload = await request(`/discover?${new URLSearchParams(new FormData(form))}`);
        target.replaceChildren();
        const list = document.createElement('div');
        list.className = 'nlh-discovery-results';
        payload.items.forEach((item) => {
          const article = document.createElement('article');
          const heading = document.createElement('h3');
          const link = document.createElement('a');
          const excerpt = document.createElement('p');
          link.href = item.url;
          link.textContent = item.title;
          heading.append(link);
          excerpt.textContent = item.excerpt || '';
          article.append(heading, excerpt);
          list.append(article);
        });
        target.append(list);
        target.setAttribute('aria-busy', 'false');
      } catch (_) {
        target.textContent = 'Results could not be loaded. Try again.';
        target.setAttribute('aria-busy', 'false');
      }
    });
  });
  document.querySelectorAll('form[data-nlh-account]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      data.emailUpdates = form.elements.emailUpdates?.checked || false;
      data.reducedMotionPreference = form.elements.reducedMotionPreference?.checked || false;
      const status = form.querySelector('[data-nlh-account-status]');
      try { await request('/account', {method: 'POST', body: JSON.stringify(data)}); if (status) status.textContent = 'Preferences saved.'; }
      catch (_) { if (status) status.textContent = 'Preferences could not be saved.'; }
    });
  });
  getSaved().then(syncSaveButtons).catch(() => syncSaveButtons(localItems()));
  if (config.statisticsConsent) document.dispatchEvent(new CustomEvent('nlh:analytics-ready', {detail: {publication: config.key, pageWorlds: config.pageWorlds || []}}));
})();
