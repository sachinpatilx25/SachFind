/**
 * SACH.IN - Ultra-Sharp Minimalist Search & Media Cockpit
 * Robust, accessible, secure integration of multi-engine search,
 * IMDb autosuggest with keyboard navigation, watch later, saved links, and YouTube results.
 */

(function () {
    'use strict';

    /* ==========================================================================
       APP ENGINES & TILES
       ========================================================================== */
    const DEFAULT_APPS = [
        // Original Movie Engines
        ["RogMovies",   "https://rogmovies.one/search.html?q=", false, "https://www.google.com/s2/favicons?domain=rogmovies.one&sz=64", "def_rog", false],
        ["VegaMovies",  "https://vegamovies.gallery/search.html?q=", false, "https://www.google.com/s2/favicons?domain=vegamovies.gallery&sz=64", "def_vega", false],
        ["MultiMovies", "https://multimovies.garden/search?q=", false, "https://www.google.com/s2/favicons?domain=multimovies.garden&sz=64", "def_multi", false],
        ["Flixeo",      "https://flixeo.tv/search?q=", false, "https://www.google.com/s2/favicons?domain=flixeo.tv&sz=64", "def_flixeo", false],
        ["CineJoy",     "https://cinejoy.pk/search/", false, "https://www.google.com/s2/favicons?domain=cinejoy.pk&sz=64", "def_cinejoy", false],
        ["Movy.sx",     "https://www.movy.sx/search/", false, "https://www.google.com/s2/favicons?domain=movy.sx&sz=64", "def_movy", false],

        // Major Platforms & Streamers
        ["Netflix",     "https://www.netflix.com/search?q=", false, "https://www.google.com/s2/favicons?domain=netflix.com&sz=64", "def_netflix", false],
        ["Hotstar",     "https://www.hotstar.com/in/explore?search_query=", false, "https://www.google.com/s2/favicons?domain=hotstar.com&sz=64", "def_hotstar", false],
        ["Prime Video", "https://www.primevideo.com/search?ie=UTF8&ref_=atv_nb_sug&phrase=", false, "https://www.google.com/s2/favicons?domain=primevideo.com&sz=64", "def_prime", false],
        ["ZEE5",        "https://www.zee5.com/search?q=", false, "https://www.google.com/s2/favicons?domain=zee5.com&sz=64", "def_zee5", false],
        ["SonyLIV",     "https://www.sonyliv.com/search?q=", false, "https://www.google.com/s2/favicons?domain=sonyliv.com&sz=64", "def_sonyliv", false],
        ["YouTube",     "https://www.youtube.com/results?search_query=", false, "https://www.google.com/s2/favicons?domain=youtube.com&sz=64", "def_youtube", false],
        ["Spotify",     "https://open.spotify.com/search/", false, "https://www.google.com/s2/favicons?domain=spotify.com&sz=64", "def_spotify", false],
        ["Google",      "https://www.google.com/search?q=", false, "https://www.google.com/s2/favicons?domain=google.com&sz=64", "def_google", false],
        ["WhatsApp",    "https://web.whatsapp.com/", true, "https://www.google.com/s2/favicons?domain=whatsapp.com&sz=64", "def_whatsapp", false],
        ["Telegram",    "https://web.telegram.org/", true, "https://www.google.com/s2/favicons?domain=web.telegram.org&sz=64", "def_telegram", false],
        ["Instagram",   "https://instagram.com/", true, "https://www.google.com/s2/favicons?domain=instagram.com&sz=64", "def_instagram", false],
        ["IMDb",        "https://www.imdb.com/find/?q=", false, "https://www.google.com/s2/favicons?domain=imdb.com&sz=64", "def_imdb", false],
        ["JustWatch",   "https://www.justwatch.com/in/search?q=", false, "https://www.google.com/s2/favicons?domain=justwatch.com&sz=64", "def_justwatch", false],
        ["X",           "https://x.com/search?q=", false, "https://www.google.com/s2/favicons?domain=x.com&sz=64", "def_x", false],
        ["Reddit",      "https://www.reddit.com/search/?q=", false, "https://www.google.com/s2/favicons?domain=reddit.com&sz=64", "def_reddit", false]
    ];

    const CUSTOM_APPS_KEY = "sach_custom_apps_v3";
    const HISTORY_KEY     = "sach_history_v3";
    const WL_STORAGE_KEY  = "sach_wl_v3";
    const LINKS_STORAGE_KEY = "sach_links_v3";

    /* ==========================================================================
       SAFE STORAGE WRAPPERS
       ========================================================================== */
    function safeStorageSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (err) {
            console.warn("Storage quota exceeded or error:", err);
            showToast("Storage quota warning");
            return false;
        }
    }

    function safeStorageGet(key, defaultVal) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : defaultVal;
        } catch {
            return defaultVal;
        }
    }

    function getCustomApps() {
        return safeStorageGet(CUSTOM_APPS_KEY, []);
    }

    function saveCustomApps(list) {
        safeStorageSet(CUSTOM_APPS_KEY, list);
    }

    let APPS = [...DEFAULT_APPS, ...getCustomApps()];

    /* ==========================================================================
       DOM REFERENCES
       ========================================================================== */
    const input               = document.getElementById("search-input");
    const searchButton        = document.getElementById("search-button");
    const searchClear         = document.getElementById("search-clear");
    const box                 = document.getElementById("suggestions");
    const appsEl              = document.getElementById("apps");
    const activeCountEl       = document.getElementById("active-count");
    const currentQueryDisplay = document.getElementById("current-query-display");
    const recentTagsEl        = document.getElementById("recent-tags");
    const clearHistoryBtn     = document.getElementById("btn-clear-history");
    const btnResetSources     = document.getElementById("btn-reset-sources");

    // Watch Later DOM
    const wlToggleBtn         = document.getElementById("wlToggleBtn");
    const wlBadge             = document.getElementById("wlBadge");
    const wlSection           = document.getElementById("wlSection");
    const wlCountText         = document.getElementById("wlCountText");
    const wlClearBtn          = document.getElementById("wlClearBtn");
    const wlList              = document.getElementById("wlList");

    // Saved Links DOM
    const linksToggleBtn      = document.getElementById("linksToggleBtn");
    const linksBadge          = document.getElementById("linksBadge");
    const linksSection        = document.getElementById("linksSection");
    const linksCountText      = document.getElementById("linksCountText");
    const linksClearBtn       = document.getElementById("linksClearBtn");
    const linksRefreshAllBtn  = document.getElementById("linksRefreshAllBtn");
    const linksList           = document.getElementById("linksList");

    // Add App Box DOM
    const addAppToggleBtn     = document.getElementById("addAppToggleBtn");
    const addAppBox           = document.getElementById("addAppBox");
    const addAppUrlInput      = document.getElementById("addAppUrlInput");
    const addAppNameInput     = document.getElementById("addAppNameInput");
    const addAppDirectCheck   = document.getElementById("addAppDirectCheck");
    const addAppSubmitBtn     = document.getElementById("addAppSubmitBtn");
    const addAppCancelBtn     = document.getElementById("addAppCancelBtn");
    const addAppStatus        = document.getElementById("addAppStatus");

    // YouTube DOM
    const ytSection           = document.getElementById("ytSection");
    const ytStatus            = document.getElementById("ytStatus");
    const ytList              = document.getElementById("ytList");

    const toastContainer      = document.getElementById("toast-container");

    /* ==========================================================================
       HELPERS & SECURITY SANITIZATION
       ========================================================================== */
    function showToast(msg) {
        if (!toastContainer) return;
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = msg;
        toastContainer.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add("show"));
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 250);
        }, 2200);
    }

    function sanitizeUrl(url) {
        const trimmed = (url || "").trim();
        if (!trimmed) return "";
        // Strict protocol validation: prevent javascript: and data: URI injection
        if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed) || /^vbscript:/i.test(trimmed)) {
            return "about:blank";
        }
        if (!/^https?:\/\//i.test(trimmed)) {
            return "https://" + trimmed;
        }
        return trimmed;
    }

    function isUrlLike(str) {
        const s = (str || "").trim();
        if (!s || s.includes(" ")) return false;
        return /^https?:\/\//i.test(s) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(s);
    }

    function targetUrl(app) {
        const q = input.value.trim();
        if (!app) return "https://www.google.com/search?q=" + encodeURIComponent(q);
        const [, base, noSearch] = app;
        const safeBase = sanitizeUrl(base);
        if (noSearch || !q) return safeBase;

        // Support template {q} anywhere in URL
        if (safeBase.includes("{q}")) {
            return safeBase.replace(/\{q\}/g, encodeURIComponent(q));
        }
        return safeBase + encodeURIComponent(q);
    }

    function escapeHtml(str) {
        return (str || '').replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        }[m]));
    }

    function openSafeUrl(url) {
        const safe = sanitizeUrl(url);
        window.open(safe, "_blank", "noopener,noreferrer");
    }

    /* ==========================================================================
       HISTORY MANAGEMENT
       ========================================================================== */
    function loadHistory() {
        return safeStorageGet(HISTORY_KEY, []).slice(0, 8);
    }

    function saveHistory(list) {
        safeStorageSet(HISTORY_KEY, list);
    }

    function addHistory(q) {
        const query = q.trim();
        if (!query) return;
        const list = [query, ...loadHistory().filter(x => x.toLowerCase() !== query.toLowerCase())].slice(0, 8);
        saveHistory(list);
        renderHistory();
    }

    function renderHistory() {
        const list = loadHistory();
        recentTagsEl.innerHTML = "";
        if (!list.length) {
            recentTagsEl.innerHTML = '<span style="font-size:11px;color:var(--text-low);">None</span>';
            return;
        }
        list.forEach(item => {
            const tag = document.createElement("button");
            tag.type = "button";
            tag.className = "recent-tag";
            tag.textContent = item;
            tag.setAttribute("aria-label", "Search " + item);
            tag.addEventListener("click", () => {
                input.value = item;
                syncAppLinks();
                scheduleYouTube();
                input.focus();
            });
            recentTagsEl.appendChild(tag);
        });
    }

    /* ==========================================================================
       APPS TILES RENDERING
       ========================================================================== */
    let appLinks = [];
    function renderApps() {
        appsEl.innerHTML = "";
        appLinks = [];
        APPS = [...DEFAULT_APPS, ...getCustomApps()];

        APPS.forEach(app => {
            const [name, , , iconUrl, id, isCustom] = app;
            const wrap = document.createElement("div");
            wrap.className = "app-tile-wrap";

            const a = document.createElement("a");
            a.className = "app-tile";
            a.href = targetUrl(app);
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.title = name;
            a.setAttribute("aria-label", name);

            const img = document.createElement("img");
            img.src = iconUrl;
            img.alt = "";
            img.width = 22;
            img.height = 22;
            img.loading = "lazy";

            // Fallback monogram if favicon fails
            img.onerror = () => {
                img.style.display = "none";
                if (!a.querySelector(".app-tile-fallback")) {
                    const fallback = document.createElement("div");
                    fallback.className = "app-tile-fallback";
                    fallback.textContent = (name || "?").charAt(0).toUpperCase();
                    a.insertBefore(fallback, a.firstChild);
                }
            };

            const span = document.createElement("span");
            span.textContent = name;

            a.append(img, span);
            wrap.appendChild(a);
            appLinks.push({ el: a, app });

            if (isCustom) {
                const del = document.createElement("button");
                del.className = "app-del-btn";
                del.type = "button";
                del.innerHTML = "×";
                del.title = "Remove " + name;
                del.setAttribute("aria-label", "Remove custom engine " + name);
                del.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const updated = getCustomApps().filter(x => x[4] !== id);
                    saveCustomApps(updated);
                    renderApps();
                    showToast("Removed " + name);
                });
                wrap.appendChild(del);
            }

            appsEl.appendChild(wrap);
        });

        if (activeCountEl) {
            activeCountEl.textContent = APPS.length === 1 ? "1 ENGINE" : `${APPS.length} ENGINES`;
        }
    }

    function syncAppLinks() {
        appLinks.forEach(({ el, app }) => { el.href = targetUrl(app); });
        const q = input.value.trim();
        if (searchClear) searchClear.classList.toggle("visible", q.length > 0);
        if (currentQueryDisplay) {
            currentQueryDisplay.textContent = q ? `"${q}"` : "READY";
            currentQueryDisplay.title = q ? `Active query: ${q}` : "Ready";
        }
    }

    /* ==========================================================================
       ADD APP / ENGINE LOGIC
       ========================================================================== */
    function toggleAddAppBox(force) {
        const open = force !== undefined ? force : addAppBox.style.display === "none";
        addAppBox.style.display = open ? "flex" : "none";
        if (addAppToggleBtn) {
            addAppToggleBtn.classList.toggle("active", open);
            addAppToggleBtn.setAttribute("aria-expanded", String(open));
        }
        if (open) {
            addAppUrlInput.focus();
            addAppStatus.textContent = "";
        }
    }

    async function handleAddApp() {
        let raw = (addAppUrlInput.value || "").trim();
        if (!raw) {
            addAppStatus.className = "form-status error";
            addAppStatus.textContent = "URL required";
            return;
        }

        if (!isUrlLike(raw) && !/^https?:\/\//i.test(raw)) {
            addAppStatus.className = "form-status error";
            addAppStatus.textContent = "Invalid URL format (e.g. site.com or https://...)";
            return;
        }

        raw = sanitizeUrl(raw);

        let domain = "";
        try {
            domain = new URL(raw).hostname.replace(/^www\./, "");
        } catch {
            addAppStatus.className = "form-status error";
            addAppStatus.textContent = "Could not parse domain";
            return;
        }

        let name = (addAppNameInput.value || "").trim();
        if (!name) {
            const brand = domain.split(".")[0];
            name = brand.charAt(0).toUpperCase() + brand.slice(1);
        }

        const isDirect = addAppDirectCheck.checked;
        const iconUrl = "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(domain) + "&sz=64";

        const customApp = [
            name,
            raw,
            isDirect,
            iconUrl,
            "app_" + Date.now(),
            true
        ];

        const list = getCustomApps();
        list.push(customApp);
        saveCustomApps(list);

        renderApps();
        syncAppLinks();

        addAppStatus.className = "form-status success";
        addAppStatus.textContent = "Added: " + name;
        addAppUrlInput.value = "";
        addAppNameInput.value = "";
        addAppDirectCheck.checked = false;

        setTimeout(() => toggleAddAppBox(false), 900);
    }

    /* ==========================================================================
       IMDb AUTOSUGGEST & KEYBOARD ACCESSIBILITY
       ========================================================================== */
    let currentSearchToken = 0;
    let activeSuggestionIndex = -1;
    let suggestionRows = [];

    function imdbNorm(q) {
        return (q || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    }

    function _imdbJsonp(norm) {
        return new Promise(res => {
            const cb = "imdb$" + norm;
            const s = document.createElement("script");

            // Fix timeout cleanup bug: avoid unhandled TypeError when script returns after timeout
            const tid = setTimeout(() => {
                window[cb] = () => { delete window[cb]; s.remove(); };
                s.remove();
                res(null);
            }, 3000);

            const done = d => {
                clearTimeout(tid);
                delete window[cb];
                s.remove();
                res(d);
            };

            window[cb] = data => done(data && Array.isArray(data.d) ? data.d : null);
            s.onerror = () => done(null);
            s.src = "https://sg.media-imdb.com/suggests/" + norm.charAt(0) + "/" + encodeURIComponent(norm) + ".json";
            document.head.appendChild(s);
        });
    }

    async function getImdbSuggestions(query) {
        const norm = imdbNorm(query);
        if (!norm) return [];
        const items = await _imdbJsonp(norm);
        return items || [];
    }

    function dismissSuggestions() {
        if (box) {
            box.style.display = "none";
            box.innerHTML = "";
        }
        activeSuggestionIndex = -1;
        suggestionRows = [];
        if (input) {
            input.setAttribute("aria-expanded", "false");
            input.removeAttribute("aria-activedescendant");
        }
    }

    function getImdbImageUrl(item) {
        if (!item || !item.i) return null;
        if (Array.isArray(item.i)) return item.i[0] || null;
        if (typeof item.i === "string") return item.i;
        return item.i.imageUrl || null;
    }

    function updateSuggestionHighlight() {
        suggestionRows.forEach((row, idx) => {
            const isSelected = idx === activeSuggestionIndex;
            row.classList.toggle("keyboard-selected", isSelected);
            row.setAttribute("aria-selected", String(isSelected));
            if (isSelected) {
                input.setAttribute("aria-activedescendant", row.id);
                row.scrollIntoView({ block: "nearest" });
            }
        });
        if (activeSuggestionIndex === -1) {
            input.removeAttribute("aria-activedescendant");
        }
    }

    function showSuggestions(items, query = "") {
        box.innerHTML = "";
        suggestionRows = [];
        activeSuggestionIndex = -1;

        // Smart URL detection row
        if (query && isUrlLike(query)) {
            const row = document.createElement("div");
            row.id = "sug-opt-url";
            row.className = "sug-row";
            row.setAttribute("role", "option");
            row.setAttribute("aria-selected", "false");
            row.innerHTML = `
                <div class="sug-thumb-ph" aria-hidden="true">⎘</div>
                <div class="sug-text">
                    <div class="sug-title">Save link URL with metadata</div>
                    <div class="sug-meta">${escapeHtml(query)}</div>
                </div>
                <div class="sug-actions">
                    <button type="button" class="sug-btn" aria-label="Save URL to links">Save</button>
                </div>
            `;
            row.addEventListener("click", () => {
                dismissSuggestions();
                handleSaveUrl(query);
                input.value = "";
                syncAppLinks();
            });
            box.appendChild(row);
            suggestionRows.push(row);
        }

        if (!items || !items.length) {
            const hasChildren = box.children.length > 0;
            box.style.display = hasChildren ? "block" : "none";
            input.setAttribute("aria-expanded", String(hasChildren));
            return;
        }

        items.slice(0, 6).forEach((item, index) => {
            const row = document.createElement("div");
            row.id = `sug-opt-${index}`;
            row.className = "sug-row";
            row.setAttribute("role", "option");
            row.setAttribute("aria-selected", "false");

            const imgUrl = getImdbImageUrl(item);
            if (imgUrl) {
                const img = document.createElement("img");
                img.className = "sug-thumb";
                img.src = imgUrl;
                img.alt = "";
                img.width = 38;
                img.height = 52;
                img.loading = "lazy";
                img.onerror = () => {
                    img.style.display = "none";
                    const ph = document.createElement("div");
                    ph.className = "sug-thumb-ph";
                    ph.textContent = "🎬";
                    row.insertBefore(ph, row.firstChild);
                };
                row.appendChild(img);
            } else {
                const ph = document.createElement("div");
                ph.className = "sug-thumb-ph";
                ph.textContent = "🎬";
                row.appendChild(ph);
            }

            const textWrap = document.createElement("div");
            textWrap.className = "sug-text";

            const tEl = document.createElement("div");
            tEl.className = "sug-title";
            tEl.textContent = item.l;

            const mEl = document.createElement("div");
            mEl.className = "sug-meta";
            mEl.textContent = [item.y, item.q, item.s].filter(Boolean).join(" · ");

            textWrap.append(tEl, mEl);
            row.appendChild(textWrap);

            const actions = document.createElement("div");
            actions.className = "sug-actions";

            if (item.id) {
                const isSaved = isWatchLater(item.id);
                const wlBtn = document.createElement("button");
                wlBtn.className = "sug-btn" + (isSaved ? " saved" : "");
                wlBtn.type = "button";
                wlBtn.textContent = isSaved ? "Saved" : "Later";
                wlBtn.setAttribute("aria-label", (isSaved ? "Remove from" : "Save to") + " Watch Later: " + item.l);
                wlBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    toggleWatchLater({
                        id: item.id,
                        type: "imdb",
                        title: item.l,
                        channel: [item.y, item.q].filter(Boolean).join(" · "),
                        length: "",
                        thumbUrl: imgUrl || ""
                    });
                    const nowSaved = isWatchLater(item.id);
                    wlBtn.textContent = nowSaved ? "Saved" : "Later";
                    wlBtn.classList.toggle("saved", nowSaved);
                });
                actions.appendChild(wlBtn);

                const link = document.createElement("a");
                link.className = "sug-btn";
                link.href = "https://www.imdb.com/title/" + encodeURIComponent(item.id) + "/";
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "↗";
                link.setAttribute("aria-label", "View " + item.l + " on IMDb");
                link.addEventListener("click", e => e.stopPropagation());
                actions.appendChild(link);
            }

            row.appendChild(actions);

            row.addEventListener("click", () => {
                selectSuggestion(item.l);
            });

            box.appendChild(row);
            suggestionRows.push(row);
        });

        box.style.display = "block";
        input.setAttribute("aria-expanded", "true");
    }

    function selectSuggestion(title) {
        input.value = title;
        dismissSuggestions();
        syncAppLinks();
        scheduleYouTube();
        addHistory(title);
    }

    /* ==========================================================================
       WATCH LATER (PERSISTENT & CACHED)
       ========================================================================== */
    const SEED_WL = [
        {
            id: "mqqft2x_Aa4",
            type: "yt",
            title: "THE BATMAN — Main Trailer",
            channel: "Warner Bros. Pictures",
            length: "2:38",
            thumbUrl: "https://i.ytimg.com/vi/mqqft2x_Aa4/mqdefault.jpg"
        },
        {
            id: "Way9Dexny3w",
            type: "yt",
            title: "Dune: Part Two | Official Trailer 3",
            channel: "Warner Bros. Pictures",
            length: "2:52",
            thumbUrl: "https://i.ytimg.com/vi/Way9Dexny3w/mqdefault.jpg"
        }
    ];

    function getWatchLater() {
        return safeStorageGet(WL_STORAGE_KEY, SEED_WL);
    }

    function saveWatchLater(items) {
        safeStorageSet(WL_STORAGE_KEY, items);
        renderWatchLater();
    }

    function isWatchLater(id) {
        return getWatchLater().some(x => x.id === id);
    }

    function toggleWatchLater(item) {
        const list = getWatchLater();
        const idx = list.findIndex(x => x.id === item.id);
        if (idx >= 0) {
            list.splice(idx, 1);
            showToast("Removed from Watch Later");
        } else {
            list.unshift(item);
            showToast("Saved to Watch Later");
        }
        saveWatchLater(list);
    }

    function renderWatchLater() {
        const items = getWatchLater();
        if (wlBadge) wlBadge.textContent = items.length;
        if (wlCountText) wlCountText.textContent = items.length;
        if (wlToggleBtn) wlToggleBtn.classList.toggle("has-items", items.length > 0);

        wlList.innerHTML = "";
        if (!items.length) {
            wlList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-state-icon">⏱</span>
                    <span>No items in Watch Later</span>
                    <span class="empty-state-hint">Save trailers, movies, or videos from suggestions and YouTube results.</span>
                </div>
            `;
            return;
        }

        items.forEach(item => {
            const article = document.createElement("article");
            article.className = "content-card";

            const removeBtn = document.createElement("button");
            removeBtn.className = "card-btn-action remove";
            removeBtn.type = "button";
            removeBtn.innerHTML = "×";
            removeBtn.title = "Remove";
            removeBtn.setAttribute("aria-label", "Remove " + item.title + " from Watch Later");
            removeBtn.addEventListener("click", e => {
                e.preventDefault();
                e.stopPropagation();
                toggleWatchLater(item);
            });
            article.appendChild(removeBtn);

            const a = document.createElement("a");
            a.className = "card-link-wrapper";
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.href = item.type === "imdb"
                ? "https://www.imdb.com/title/" + encodeURIComponent(item.id) + "/"
                : "https://www.youtube.com/watch?v=" + encodeURIComponent(item.id);
            a.setAttribute("aria-label", "Open " + item.title);

            const thumbWrap = document.createElement("div");
            thumbWrap.className = "card-thumb-wrap" + (item.type === "imdb" ? " poster-wrap" : "");

            if (item.thumbUrl) {
                const img = document.createElement("img");
                img.src = item.thumbUrl;
                img.alt = "";
                img.loading = "lazy";
                img.onerror = () => { img.style.display = "none"; };
                thumbWrap.appendChild(img);
            }

            if (item.length) {
                const badge = document.createElement("span");
                badge.className = "card-badge-right";
                badge.textContent = item.length;
                thumbWrap.appendChild(badge);
            }

            const typeBadge = document.createElement("span");
            typeBadge.className = "card-badge-left";
            typeBadge.textContent = item.type.toUpperCase();
            thumbWrap.appendChild(typeBadge);

            const meta = document.createElement("div");
            meta.className = "card-meta";

            const t = document.createElement("div");
            t.className = "card-title";
            t.textContent = item.title;

            const sub = document.createElement("div");
            sub.className = "card-sub";
            sub.textContent = item.channel;

            meta.append(t, sub);
            a.append(thumbWrap, meta);
            article.appendChild(a);
            wlList.appendChild(article);
        });
    }

    /* ==========================================================================
       SAVED LINKS WITH METADATA
       ========================================================================== */
    const SEED_LINKS = [
        {
            id: "link_gh",
            url: "https://github.com",
            domain: "github.com",
            title: "GitHub: Let's build from here",
            description: "The AI-powered developer platform to build and scale software.",
            image: "https://opengraph.githubassets.com/1/github",
            favicon: "https://www.google.com/s2/favicons?domain=github.com&sz=64"
        },
        {
            id: "link_hn",
            url: "https://news.ycombinator.com",
            domain: "ycombinator.com",
            title: "Hacker News",
            description: "Technology & startup news community.",
            image: "https://s0.wp.com/mshots/v1/https%3A%2F%2Fnews.ycombinator.com?w=640",
            favicon: "https://www.google.com/s2/favicons?domain=news.ycombinator.com&sz=64"
        }
    ];

    function getSavedLinks() {
        return safeStorageGet(LINKS_STORAGE_KEY, SEED_LINKS);
    }

    function saveSavedLinks(items) {
        safeStorageSet(LINKS_STORAGE_KEY, items);
        renderSavedLinks();
    }

    async function fetchLinkMetadata(url) {
        try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 4500);
            const resp = await fetch("https://api.microlink.io/?url=" + encodeURIComponent(url), { signal: ctrl.signal });
            clearTimeout(tid);
            if (resp.ok) {
                const j = await resp.json();
                return j && j.data ? j.data : null;
            }
        } catch {}
        return null;
    }

    async function handleSaveUrl(rawUrl) {
        let url = sanitizeUrl(rawUrl);
        if (!url || url === "about:blank") return;

        let domain = "";
        try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch { domain = url; }

        const item = {
            id: "link_" + Date.now(),
            url: url,
            domain: domain,
            title: domain,
            description: url,
            image: "https://s0.wp.com/mshots/v1/" + encodeURIComponent(url) + "?w=640",
            favicon: "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(domain) + "&sz=64"
        };

        const list = getSavedLinks();
        list.unshift(item);
        saveSavedLinks(list);
        showToast("Saved Link: " + domain);

        // Fetch OpenGraph in background via Microlink
        const data = await fetchLinkMetadata(url);
        if (data) {
            if (data.title) item.title = data.title;
            if (data.description) item.description = data.description;
            if (data.image && data.image.url) item.image = data.image.url;
            saveSavedLinks(list);
        }
    }

    async function refreshAllLinks() {
        const list = getSavedLinks();
        if (!list.length) {
            showToast("No links to refresh");
            return;
        }
        showToast("Refreshing metadata...");
        let updated = 0;
        for (const item of list.slice(0, 5)) {
            const data = await fetchLinkMetadata(item.url);
            if (data) {
                if (data.title) item.title = data.title;
                if (data.description) item.description = data.description;
                if (data.image && data.image.url) item.image = data.image.url;
                updated++;
            }
        }
        saveSavedLinks(list);
        showToast(updated ? `Refreshed ${updated} links` : "Metadata up to date");
    }

    function renderSavedLinks() {
        const items = getSavedLinks();
        if (linksBadge) linksBadge.textContent = items.length;
        if (linksCountText) linksCountText.textContent = items.length;
        if (linksToggleBtn) linksToggleBtn.classList.toggle("has-items", items.length > 0);

        linksList.innerHTML = "";
        if (!items.length) {
            linksList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-state-icon">⎘</span>
                    <span>No saved links</span>
                    <span class="empty-state-hint">Paste any website URL in the search bar to save it with full OpenGraph metadata.</span>
                </div>
            `;
            return;
        }

        items.forEach(item => {
            const article = document.createElement("article");
            article.className = "content-card";

            const removeBtn = document.createElement("button");
            removeBtn.className = "card-btn-action remove";
            removeBtn.type = "button";
            removeBtn.innerHTML = "×";
            removeBtn.title = "Remove";
            removeBtn.setAttribute("aria-label", "Remove " + item.title);
            removeBtn.addEventListener("click", e => {
                e.preventDefault();
                e.stopPropagation();
                const list = getSavedLinks().filter(x => x.id !== item.id);
                saveSavedLinks(list);
                showToast("Link removed");
            });
            article.appendChild(removeBtn);

            const a = document.createElement("a");
            a.className = "card-link-wrapper";
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.href = sanitizeUrl(item.url);
            a.setAttribute("aria-label", "Open " + item.title);

            const thumbWrap = document.createElement("div");
            thumbWrap.className = "card-thumb-wrap";

            if (item.image) {
                const img = document.createElement("img");
                img.src = item.image;
                img.alt = "";
                img.loading = "lazy";
                img.onerror = () => { img.style.display = "none"; };
                thumbWrap.appendChild(img);
            }

            const domBadge = document.createElement("span");
            domBadge.className = "card-badge-left";
            domBadge.textContent = item.domain;
            thumbWrap.appendChild(domBadge);

            const meta = document.createElement("div");
            meta.className = "card-meta";

            // Title must be appended before description!
            const t = document.createElement("div");
            t.className = "card-title";
            t.textContent = item.title;
            meta.appendChild(t);

            if (item.description) {
                const d = document.createElement("div");
                d.className = "card-desc";
                d.textContent = item.description;
                meta.appendChild(d);
            }

            a.append(thumbWrap, meta);
            article.appendChild(a);
            linksList.appendChild(article);
        });
    }

    /* ==========================================================================
       YOUTUBE RESULTS WITH CANCELLATION & RESILIENCE
       ========================================================================== */
    let activeYtAbortController = null;

    async function _ytScrape(query, signal) {
        const ytUrl = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query);
        const resp = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent(ytUrl), { signal });
        if (!resp.ok) return [];
        const json = await resp.json();
        const html = json.contents || "";

        const start = html.indexOf("ytInitialData =");
        if (start === -1) return [];
        const brace = html.indexOf("{", start);
        if (brace === -1) return [];
        let depth = 0, end = -1;
        for (let i = brace; i < html.length; i++) {
            if (html[i] === "{") depth++;
            else if (html[i] === "}") { if (--depth === 0) { end = i; break; } }
        }
        if (end === -1) return [];

        let data;
        try { data = JSON.parse(html.slice(brace, end + 1)); } catch { return []; }

        const videos = [], seen = new Set();
        (function walk(n) {
            if (videos.length >= 6 || !n || typeof n !== "object") return;
            const v = n.videoRenderer;
            if (v && v.videoId && !seen.has(v.videoId)) {
                seen.add(v.videoId);
                videos.push({
                    id: v.videoId,
                    title: v.title?.runs?.[0]?.text || v.title?.simpleText || "Video",
                    channel: v.ownerText?.runs?.[0]?.text || "",
                    length: v.lengthText?.simpleText || "",
                    thumbUrl: "https://i.ytimg.com/vi/" + v.videoId + "/mqdefault.jpg"
                });
            }
            for (const k in n) walk(n[k]);
        })(data);
        return videos;
    }

    let ytTimer, ytToken = 0;
    function scheduleYouTube() {
        clearTimeout(ytTimer);
        if (activeYtAbortController) {
            activeYtAbortController.abort();
            activeYtAbortController = null;
        }

        const q = input.value.trim();
        if (q.length < 3 || isUrlLike(q)) {
            ytSection.style.display = "none";
            return;
        }
        ytTimer = setTimeout(() => loadYouTube(q), 600);
    }

    async function loadYouTube(query) {
        const token = ++ytToken;
        activeYtAbortController = new AbortController();
        const signal = activeYtAbortController.signal;

        ytSection.style.display = "flex";
        ytStatus.textContent = "Loading results...";
        ytList.innerHTML = "";

        try {
            const videos = await _ytScrape(query, signal);
            if (token !== ytToken) return;

            ytStatus.textContent = videos.length ? `${videos.length} results found` : "No direct results found";
            if (!videos.length) {
                ytList.innerHTML = '<div class="empty-state"><span>No direct videos found via proxy. Try the YouTube search engine tile above.</span></div>';
                return;
            }

            videos.forEach(v => {
                const article = document.createElement("article");
                article.className = "content-card";

                const isSaved = isWatchLater(v.id);
                const wlBtn = document.createElement("button");
                wlBtn.className = "card-btn-action" + (isSaved ? " saved" : "");
                wlBtn.type = "button";
                wlBtn.innerHTML = "⏱";
                wlBtn.title = "Watch Later";
                wlBtn.setAttribute("aria-label", (isSaved ? "Remove" : "Save") + " " + v.title + " to Watch Later");
                wlBtn.addEventListener("click", e => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWatchLater({
                        id: v.id,
                        type: "yt",
                        title: v.title,
                        channel: v.channel,
                        length: v.length,
                        thumbUrl: v.thumbUrl
                    });
                    const nowSaved = isWatchLater(v.id);
                    wlBtn.classList.toggle("saved", nowSaved);
                });
                article.appendChild(wlBtn);

                const a = document.createElement("a");
                a.className = "card-link-wrapper";
                a.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(v.id);
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.setAttribute("aria-label", "Watch " + v.title + " on YouTube");

                const thumbWrap = document.createElement("div");
                thumbWrap.className = "card-thumb-wrap";

                const img = document.createElement("img");
                img.src = v.thumbUrl;
                img.alt = "";
                img.loading = "lazy";
                img.onerror = () => { img.style.display = "none"; };
                thumbWrap.appendChild(img);

                if (v.length) {
                    const badge = document.createElement("span");
                    badge.className = "card-badge-right";
                    badge.textContent = v.length;
                    thumbWrap.appendChild(badge);
                }

                const meta = document.createElement("div");
                meta.className = "card-meta";

                const t = document.createElement("div");
                t.className = "card-title";
                t.textContent = v.title;

                const sub = document.createElement("div");
                sub.className = "card-sub";
                sub.textContent = v.channel;

                meta.append(t, sub);
                a.append(thumbWrap, meta);
                article.appendChild(a);
                ytList.appendChild(article);
            });
        } catch (err) {
            if (err.name === "AbortError") return;
            if (token === ytToken) {
                ytStatus.textContent = "YouTube lookup unavailable";
            }
        }
    }

    /* ==========================================================================
       EVENT BINDINGS & INIT
       ========================================================================== */
    function executeTopSearch() {
        const q = input.value.trim();
        dismissSuggestions();
        if (q) {
            addHistory(q);
            const g = APPS.find(a => a[0] === "Google") || APPS[0];
            openSafeUrl(targetUrl(g));
        }
    }

    function init() {
        // Search Input Handlers
        let sugTimer;
        input.addEventListener("input", () => {
            const q = input.value.trim();
            const token = ++currentSearchToken;
            clearTimeout(sugTimer);
            syncAppLinks();

            if (!q) {
                dismissSuggestions();
                ytSection.style.display = "none";
                return;
            }

            sugTimer = setTimeout(async () => {
                const items = await getImdbSuggestions(q);
                if (token === currentSearchToken) {
                    showSuggestions(items, q);
                }
            }, 180);

            scheduleYouTube();
        });

        // Keyboard Navigation (Arrow Keys, Enter, Escape)
        input.addEventListener("keydown", e => {
            const isBoxOpen = box && box.style.display === "block" && suggestionRows.length > 0;

            if (e.key === "ArrowDown") {
                if (isBoxOpen) {
                    e.preventDefault();
                    activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestionRows.length;
                    updateSuggestionHighlight();
                }
            } else if (e.key === "ArrowUp") {
                if (isBoxOpen) {
                    e.preventDefault();
                    activeSuggestionIndex = activeSuggestionIndex <= 0 ? suggestionRows.length - 1 : activeSuggestionIndex - 1;
                    updateSuggestionHighlight();
                }
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (isBoxOpen && activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestionRows.length) {
                    suggestionRows[activeSuggestionIndex].click();
                } else {
                    executeTopSearch();
                }
            } else if (e.key === "Escape") {
                if (isBoxOpen) {
                    dismissSuggestions();
                } else {
                    input.value = "";
                    syncAppLinks();
                    ytSection.style.display = "none";
                }
            }
        });

        searchButton.addEventListener("click", executeTopSearch);

        if (searchClear) {
            searchClear.addEventListener("click", () => {
                input.value = "";
                dismissSuggestions();
                syncAppLinks();
                ytSection.style.display = "none";
                input.focus();
            });
        }

        // Close suggestions on outside click
        document.addEventListener("click", e => {
            if (!e.target.closest(".search-cockpit")) dismissSuggestions();
        });

        // History Clear
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener("click", () => {
                saveHistory([]);
                renderHistory();
                showToast("History cleared");
            });
        }

        // Reset default engines
        if (btnResetSources) {
            btnResetSources.addEventListener("click", () => {
                if (window.confirm("Reset engines to defaults?")) {
                    saveCustomApps([]);
                    renderApps();
                    syncAppLinks();
                    showToast("Engines reset to defaults");
                }
            });
        }

        // Watch Later toggles
        if (wlToggleBtn) {
            wlToggleBtn.addEventListener("click", () => {
                const open = wlSection.style.display === "none";
                wlSection.style.display = open ? "flex" : "none";
                wlToggleBtn.classList.toggle("active", open);
                wlToggleBtn.setAttribute("aria-expanded", String(open));
            });
        }
        if (wlClearBtn) {
            wlClearBtn.addEventListener("click", () => {
                if (window.confirm("Clear all items from Watch Later?")) {
                    saveWatchLater([]);
                    showToast("Watch Later cleared");
                }
            });
        }

        // Saved Links toggles
        if (linksToggleBtn) {
            linksToggleBtn.addEventListener("click", () => {
                const open = linksSection.style.display === "none";
                linksSection.style.display = open ? "flex" : "none";
                linksToggleBtn.classList.toggle("active", open);
                linksToggleBtn.setAttribute("aria-expanded", String(open));
            });
        }
        if (linksClearBtn) {
            linksClearBtn.addEventListener("click", () => {
                if (window.confirm("Clear all saved links?")) {
                    saveSavedLinks([]);
                    showToast("Links cleared");
                }
            });
        }
        if (linksRefreshAllBtn) {
            linksRefreshAllBtn.addEventListener("click", refreshAllLinks);
        }

        // Add App toggles
        if (addAppToggleBtn) addAppToggleBtn.addEventListener("click", () => toggleAddAppBox());
        if (addAppCancelBtn) addAppCancelBtn.addEventListener("click", () => toggleAddAppBox(false));
        if (addAppSubmitBtn) addAppSubmitBtn.addEventListener("click", handleAddApp);
        if (addAppUrlInput) {
            addAppUrlInput.addEventListener("keydown", e => {
                if (e.key === "Enter") handleAddApp();
                else if (e.key === "Escape") toggleAddAppBox(false);
            });
        }

        // Global shortcut: press "/" anywhere outside inputs to focus search
        document.addEventListener("keydown", e => {
            if (e.key === "/" && document.activeElement !== input && document.activeElement !== addAppUrlInput && document.activeElement !== addAppNameInput) {
                e.preventDefault();
                input.focus();
                input.select();
            }
        });

        // Initial Renders
        renderApps();
        renderHistory();
        renderWatchLater();
        renderSavedLinks();
        syncAppLinks();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
