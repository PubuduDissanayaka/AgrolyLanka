/* ==========================================================================
   Agroly Lanka — main.js
   Vanilla JS, no dependencies. Every behaviour degrades gracefully.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Header — solid background once scrolled past the top
     ------------------------------------------------------------------ */
  (function stickyHeader() {
    var header = document.getElementById('header');
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle('is-stuck', window.scrollY > 24);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  })();

  /* ------------------------------------------------------------------
     Mobile navigation — toggle, scrim, Escape, focus return
     ------------------------------------------------------------------ */
  (function mobileNav() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('nav');
    var scrim = document.getElementById('navScrim');
    if (!toggle || !nav || !scrim) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      scrim.classList.toggle('is-open', open);
      scrim.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    scrim.addEventListener('click', function () {
      setOpen(false);
      toggle.focus();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close after tapping a link on mobile
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    // Reset state if the viewport grows past the drawer breakpoint (75rem)
    window.matchMedia('(min-width: 75.0625rem)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  })();

  /* ------------------------------------------------------------------
     Services accordion — one active panel, hover on fine pointers
     ------------------------------------------------------------------ */
  (function accordion() {
    var root = document.getElementById('accordion');
    if (!root) return;

    var panels = Array.prototype.slice.call(root.querySelectorAll('.accordion__panel'));
    if (!panels.length) return;

    var canHover = window.matchMedia('(hover: hover) and (min-width: 62.0625rem)');

    function activate(panel) {
      panels.forEach(function (p) {
        var on = p === panel;
        p.classList.toggle('is-active', on);
        p.setAttribute('aria-expanded', String(on));
      });
    }

    panels.forEach(function (panel) {
      panel.addEventListener('click', function () { activate(panel); });
      panel.addEventListener('focus', function () {
        if (canHover.matches) activate(panel);
      });
      panel.addEventListener('mouseenter', function () {
        if (canHover.matches) activate(panel);
      });
    });
  })();

  /* ------------------------------------------------------------------
     Growing-media slider — arrow buttons over a native scroll-snap track
     ------------------------------------------------------------------ */
  (function slider() {
    var track = document.getElementById('mediaSlider');
    var prev = document.getElementById('mediaPrev');
    var next = document.getElementById('mediaNext');
    if (!track || !prev || !next) return;

    function step() {
      var first = track.querySelector('.product');
      if (!first) return track.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return first.getBoundingClientRect().width + gap;
    }

    function scrollBy(dir) {
      track.scrollBy({
        left: dir * step(),
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    }

    prev.addEventListener('click', function () { scrollBy(-1); });
    next.addEventListener('click', function () { scrollBy(1); });

    function syncButtons() {
      // The track is bled to the viewport edge with a negative margin and an
      // equal inline padding, so its resting scrollLeft is that padding, not 0.
      var padStart = parseFloat(getComputedStyle(track).paddingInlineStart) || 0;
      var max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= padStart + 2;
      next.disabled = track.scrollLeft >= max - 2;
    }

    track.addEventListener('scroll', syncButtons, { passive: true });
    window.addEventListener('resize', syncButtons);
    syncButtons();

    // Left/right arrow keys when the track itself has focus
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); scrollBy(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); scrollBy(-1); }
    });
  })();

  /* ------------------------------------------------------------------
     Tabs — WAI-ARIA pattern, arrow keys move between tabs
     ------------------------------------------------------------------ */
  (function tabs() {
    var lists = document.querySelectorAll('[role="tablist"]');
    if (!lists.length) return;

    Array.prototype.forEach.call(lists, function (list) {
      var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
      if (!tabs.length) return;

      function select(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { select(tab); });
        tab.addEventListener('keydown', function (e) {
          var next = null;
          if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
          else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
          else if (e.key === 'Home') next = tabs[0];
          else if (e.key === 'End') next = tabs[tabs.length - 1];
          if (next) { e.preventDefault(); select(next, true); }
        });
      });

      // Normalise starting state from whichever tab is marked selected
      var initial = tabs.filter(function (t) {
        return t.getAttribute('aria-selected') === 'true';
      })[0] || tabs[0];
      select(initial);
    });
  })();

  /* ------------------------------------------------------------------
     Gallery — category filter plus a native <dialog> lightbox.
     Using <dialog>.showModal() means focus trapping, Esc-to-close and
     focus restoration are handled by the browser rather than by us.
     ------------------------------------------------------------------ */
  (function gallery() {
    var mosaic = document.getElementById('mosaic');
    if (!mosaic) return;

    var tiles = Array.prototype.slice.call(mosaic.querySelectorAll('.tile'));
    var filters = Array.prototype.slice.call(document.querySelectorAll('.filter'));
    var count = document.getElementById('galleryCount');
    var visible = tiles.slice();

    /* ---- filtering ---- */
    function applyFilter(cat) {
      visible = [];
      tiles.forEach(function (tile) {
        var match = cat === 'all' || tile.dataset.category === cat;
        tile.hidden = !match;
        if (match) visible.push(tile);
      });
      filters.forEach(function (f) {
        f.setAttribute('aria-pressed', String(f.dataset.filter === cat));
      });
      if (count) {
        count.textContent = visible.length === tiles.length
          ? 'Showing all ' + tiles.length + ' photographs'
          : 'Showing ' + visible.length + ' of ' + tiles.length + ' photographs';
      }
    }

    filters.forEach(function (f) {
      f.addEventListener('click', function () { applyFilter(f.dataset.filter); });
    });
    applyFilter('all');

    /* ---- lightbox ---- */
    var dialog = document.getElementById('lightbox');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    var frame = dialog.querySelector('.lightbox__frame');
    var caption = dialog.querySelector('.lightbox__caption');
    var index = dialog.querySelector('.lightbox__index');
    var prev = dialog.querySelector('[data-lb="prev"]');
    var next = dialog.querySelector('[data-lb="next"]');
    var close = dialog.querySelector('[data-lb="close"]');
    var current = 0;

    function show(i) {
      if (!visible.length) return;
      current = (i + visible.length) % visible.length;
      var tile = visible[current];
      var img = tile.querySelector('img');
      frame.src = img.dataset.full;
      frame.alt = img.alt;
      caption.textContent = img.alt;
      index.textContent = (current + 1) + ' of ' + visible.length;
    }

    function open(tile) {
      var i = visible.indexOf(tile);
      if (i < 0) return;
      show(i);
      dialog.showModal();
    }

    tiles.forEach(function (tile) {
      tile.addEventListener('click', function () { open(tile); });
    });

    prev.addEventListener('click', function () { show(current - 1); });
    next.addEventListener('click', function () { show(current + 1); });
    close.addEventListener('click', function () { dialog.close(); });

    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    });

    // Click the backdrop (outside the dialog box) to dismiss
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });

    // Release the large image so it is not held in memory while closed
    dialog.addEventListener('close', function () { frame.removeAttribute('src'); });
  })();

  /* ------------------------------------------------------------------
     Quotation form — grouped validation with an error summary.
     The form has no backend yet; see the comment block in contact.html for
     how to connect one. Until then we say so plainly rather than pretending
     the message was sent.
     ------------------------------------------------------------------ */
  (function quoteForm() {
    var form = document.getElementById('quoteForm');
    if (!form) return;

    var notice = document.getElementById('formNotice');
    var summary = document.getElementById('formErrors');
    var summaryList = document.getElementById('formErrorsList');
    var isWired = form.getAttribute('action').trim() !== '';

    function fieldOf(input) { return input.closest('.field'); }

    /* The browser only reports validity.tooShort once a value is "dirty"
       (user-edited), so a pasted or autofilled value can slip past minlength.
       Check the length ourselves instead of trusting that flag. */
    function tooShort(input) {
      var min = parseInt(input.getAttribute('minlength') || '0', 10);
      var len = input.value.trim().length;
      return min > 0 && len > 0 && len < min ? min : 0;
    }

    function isValid(input) {
      return input.checkValidity() && !tooShort(input);
    }

    function labelFor(input) {
      var field = fieldOf(input);
      if (!field) return 'This field';
      var group = field.querySelector('.field__grouplabel');
      if (group) return group.textContent.trim();
      var lbl = field.querySelector('label');
      if (!lbl) return 'This field';
      // strip the "(optional)" suffix
      return lbl.textContent.replace(/\(optional\)/i, '').trim();
    }

    function messageFor(input) {
      if (input.validity.valueMissing) {
        return input.type === 'radio' ? 'Please choose one of the options.' : 'Please fill this in.';
      }
      if (input.validity.typeMismatch && input.type === 'email') return 'Please check the email address.';
      var min = tooShort(input);
      if (min || input.validity.tooShort) {
        return 'Please add a little more detail — at least ' + (min || input.minLength) + ' characters.';
      }
      return 'Please check this field.';
    }

    function setError(input, message) {
      var field = fieldOf(input);
      if (!field) return;
      field.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      var slot = field.querySelector('.field__error-text');
      if (slot) slot.textContent = message;
    }

    function clearError(input) {
      var field = fieldOf(input);
      if (!field) return;
      field.classList.remove('is-invalid');
      // a radio group has several inputs sharing one field
      field.querySelectorAll('[aria-invalid]').forEach(function (el) {
        el.removeAttribute('aria-invalid');
      });
    }

    /* Radios share a name; validate the group once rather than per input. */
    function controls() {
      var seen = {};
      return Array.prototype.filter.call(form.elements, function (el) {
        if (!el.name || el.type === 'submit') return false;
        if (el.type === 'radio') {
          if (seen[el.name]) return false;
          seen[el.name] = true;
        }
        return true;
      });
    }

    // Re-validate once the user has had a go at fixing something
    controls().forEach(function (input) {
      var events = input.type === 'radio' ? ['change'] : ['blur', 'input'];
      events.forEach(function (evt) {
        var target = input.type === 'radio' ? form : input;
        target.addEventListener(evt, function (e) {
          var el = input.type === 'radio' ? e.target : input;
          if (input.type === 'radio' && el.name !== input.name) return;
          if (evt === 'blur' && !el.value.trim()) return;
          if (isValid(el)) clearError(el);
        });
      });
    });

    form.addEventListener('submit', function (e) {
      var bad = [];

      controls().forEach(function (input) {
        if (isValid(input)) {
          clearError(input);
        } else {
          setError(input, messageFor(input));
          bad.push(input);
        }
      });

      if (bad.length) {
        e.preventDefault();

        // Summarise at the top, with links straight to each problem
        if (summary && summaryList) {
          summaryList.innerHTML = '';
          bad.forEach(function (input) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#' + input.id;
            a.textContent = labelFor(input) + ' — ' + messageFor(input);
            a.addEventListener('click', function (ev) {
              ev.preventDefault();
              input.focus();
              input.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
            });
            li.appendChild(a);
            summaryList.appendChild(li);
          });
          summary.classList.add('is-shown');
          summary.focus();
          summary.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
        } else {
          bad[0].focus();
        }
        return;
      }

      if (summary) summary.classList.remove('is-shown');

      // Valid, but nothing to submit to yet — be honest about it.
      if (!isWired) {
        e.preventDefault();
        if (notice) {
          notice.classList.add('is-shown');
          notice.focus();
        }
      }
    });

    /* ---- live character count on the message ---- */
    (function counter() {
      var field = document.getElementById('q-message');
      var out = document.getElementById('messageCounter');
      if (!field || !out) return;

      var min = parseInt(field.getAttribute('minlength') || '0', 10);

      function update() {
        var n = field.value.trim().length;
        out.textContent = n + (n === 1 ? ' character' : ' characters');
        out.classList.toggle('is-short', n > 0 && n < min);
        out.classList.toggle('is-ok', n >= min);
        if (n > 0 && n < min) out.textContent = n + ' / ' + min + ' characters';
      }
      field.addEventListener('input', update);
      update();
    })();
  })();

  /* ------------------------------------------------------------------
     Article reading time — measured from the actual prose, so it stays
     honest when the copy is rewritten. 200 wpm is the usual estimate.
     ------------------------------------------------------------------ */
  (function readingTime() {
    var slot = document.getElementById('readingTime');
    var prose = document.querySelector('.prose');
    if (!slot || !prose) return;

    var words = prose.textContent.trim().split(/\s+/).filter(Boolean).length;
    var mins = Math.max(1, Math.round(words / 200));
    slot.textContent = mins + ' min read';
    slot.hidden = false;
  })();

  /* ------------------------------------------------------------------
     Share links — built from the live URL so they never point at a
     hardcoded address that changes when the site goes live.
     ------------------------------------------------------------------ */
  (function shareLinks() {
    var links = document.querySelectorAll('[data-share]');
    if (!links.length) return;

    var url = encodeURIComponent(location.href);
    var title = encodeURIComponent(document.title);

    Array.prototype.forEach.call(links, function (a) {
      var kind = a.dataset.share;
      if (kind === 'whatsapp') a.href = 'https://wa.me/?text=' + title + '%20' + url;
      if (kind === 'facebook') a.href = 'https://www.facebook.com/sharer/sharer.php?u=' + url;
      if (kind === 'email') a.href = 'mailto:?subject=' + title + '&body=' + url;
      if (kind === 'copy') {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          if (!navigator.clipboard) return;
          navigator.clipboard.writeText(location.href).then(function () {
            var was = a.getAttribute('aria-label');
            a.setAttribute('aria-label', 'Link copied');
            a.classList.add('is-copied');
            setTimeout(function () {
              a.setAttribute('aria-label', was);
              a.classList.remove('is-copied');
            }, 2000);
          });
        });
      }
    });
  })();

  /* ------------------------------------------------------------------
     Reveal on scroll — gentle, once only
     ------------------------------------------------------------------ */
  (function reveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------ */
  (function year() {
    var el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  })();

})();
