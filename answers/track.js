/* ============================================================
   Warning layer — page-level analytics

   Fires three things per visit:

   1. answers_pageview   every page load, with a readable page
                         label. Use this for "views per page".
   2. answers_landing    ONCE per browsing session, on the first
                         /answers/ page seen, with the referrer
                         host. Use this for "how many people
                         LANDED on each page" — which is the
                         number that tells you whether search is
                         actually delivering people to each page,
                         as opposed to them clicking through from
                         somewhere else on the site.
   3. answers_read       30 seconds on the page, or 75% scroll,
                         whichever comes first. At most once.
                         This is the real conversion: someone who
                         took the warning in rather than bouncing.

   Sends to whichever analytics is present — Vercel Web Analytics
   (window.va), GA4 (window.gtag), Plausible (window.plausible).
   If none is loaded it does nothing and throws nothing.
   ============================================================ */

(function () {
  "use strict";

  /* Readable labels, so reports don't just show file paths. Add a
     line here whenever a page is added to the section. */
  var PAGE_NAMES = {
    "/answers/": "Hub",
    "/answers/index.html": "Hub",
    "/answers/is-it-illegal-to-buy-reviews.html": "Is it illegal",
    "/answers/can-you-get-caught-buying-reviews.html": "Can you get caught",
    "/answers/what-happens-if-you-buy-fake-reviews.html": "What are the penalties",
    "/answers/scammed-buying-reviews.html": "Already paid"
  };

  var path = window.location.pathname;
  var pageName = PAGE_NAMES[path] || path;

  function send(name, data) {
    if (typeof window.va === "function") {
      window.va("event", { name: name, data: data });
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", name, data);
    }
    if (typeof window.plausible === "function") {
      window.plausible(name, { props: data });
    }
  }

  /* Referrer host only — never the full referring URL, which can
     carry a search query or other personal detail. */
  function referrerHost() {
    if (!document.referrer) return "direct";
    try {
      var h = new URL(document.referrer).hostname;
      if (h === window.location.hostname) return "internal";
      return h.replace(/^www\./, "");
    } catch (e) {
      return "unknown";
    }
  }

  /* ---------- 1. Pageview ---------- */
  send("answers_pageview", { page: pageName, path: path });

  /* ---------- 2. Landing (first page of the session) ----------
     sessionStorage can throw in private mode or with storage
     disabled, so this is wrapped. If it fails we simply don't
     record a landing rather than breaking the page. */
  try {
    if (!window.sessionStorage.getItem("ctr_landed")) {
      window.sessionStorage.setItem("ctr_landed", path);
      send("answers_landing", {
        page: pageName,
        path: path,
        referrer: referrerHost()
      });
    }
  } catch (e) { /* storage unavailable — skip silently */ }

  /* ---------- 3. Read (dwell or scroll depth) ---------- */
  var fired = false;

  function fireRead(trigger) {
    if (fired) return;
    fired = true;
    send("answers_read", { page: pageName, path: path, trigger: trigger });
  }

  var timer = window.setTimeout(function () {
    fireRead("dwell_30s");
  }, 30000);

  function onScroll() {
    var doc = document.documentElement;
    var total = doc.scrollHeight;

    /* Pages that fit on one screen can't reach 75% by scrolling,
       so let the dwell timer handle those. */
    if (total <= window.innerHeight) return;

    if ((doc.scrollTop + window.innerHeight) / total >= 0.75) {
      fireRead("scroll_75");
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
})();
