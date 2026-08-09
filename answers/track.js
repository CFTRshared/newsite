/* ============================================================
   Warning layer — engagement tracking

   Fires a single `answers_read` event when a visitor has
   actually read the page: 30 seconds on it, OR 75% scroll
   depth, whichever happens first. Fires at most once.

   Sessions are a vanity metric here. The number that matters
   is how many would-be buyers actually took the warning in,
   so that is what this measures.

   Sends to whichever analytics is present — Vercel Web
   Analytics (window.va) and/or GA4 (window.gtag). If neither
   is loaded, it does nothing and throws nothing.
   ============================================================ */

(function () {
  "use strict";

  var fired = false;

  function fire(trigger) {
    if (fired) return;
    fired = true;

    var payload = {
      page: window.location.pathname,
      trigger: trigger
    };

    // Vercel Web Analytics
    if (typeof window.va === "function") {
      window.va("event", { name: "answers_read", data: payload });
    }

    // GA4
    if (typeof window.gtag === "function") {
      window.gtag("event", "answers_read", payload);
    }

    // Plausible
    if (typeof window.plausible === "function") {
      window.plausible("answers_read", { props: payload });
    }
  }

  // Dwell time
  var timer = window.setTimeout(function () {
    fire("dwell_30s");
  }, 30000);

  // Scroll depth
  function onScroll() {
    var doc = document.documentElement;
    var scrolled = doc.scrollTop + window.innerHeight;
    var total = doc.scrollHeight;

    // Short pages that fit on one screen can't reach 75% by
    // scrolling, so let the dwell timer handle those.
    if (total <= window.innerHeight) return;

    if (scrolled / total >= 0.75) {
      fire("scroll_75");
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
})();
