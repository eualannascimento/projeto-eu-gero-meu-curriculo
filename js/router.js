/**
 * Roteamento por hash - deep links e navegacao do browser.
 */
const EuGeroRouter = (function () {
  'use strict';

  const VIEWS = new Set(['characters', 'start', 'wizard', 'review', 'guide']);

  function parseHash(hash) {
    const raw = (hash != null ? hash : location.hash || '').replace(/^#\/?/, '').trim();
    if (!raw) return { view: 'characters', sectionId: null };

    const parts = raw.split('/').filter(Boolean);
    const head = parts[0];

    if (head === 'wizard') {
      return { view: 'wizard', sectionId: parts[1] || null };
    }

    if (VIEWS.has(head)) {
      return { view: head, sectionId: null };
    }

    return { view: 'characters', sectionId: null };
  }

  function buildHash(view, sectionId) {
    if (!view || view === 'characters') return '#/';
    if (view === 'wizard' && sectionId) return `#/wizard/${sectionId}`;
    return `#/${view}`;
  }

  function setHash(view, sectionId, { replace = false } = {}) {
    const next = buildHash(view, sectionId);
    const current = `#${location.hash.replace(/^#/, '')}` === next
      || location.hash === next
      || (next === '#/' && (!location.hash || location.hash === '#'));

    if (current) return;

    if (replace) {
      const url = `${location.pathname}${location.search}${next}`;
      history.replaceState({ view, sectionId }, '', url);
    } else {
      location.hash = next;
    }
  }

  function subscribe(handler) {
    window.addEventListener('hashchange', () => handler(parseHash()));
  }

  function getInitialRoute() {
    if (location.hash && location.hash.length > 1) {
      return parseHash();
    }
    return null;
  }

  return {
    VIEWS,
    parseHash,
    buildHash,
    setHash,
    subscribe,
    getInitialRoute
  };
})();
