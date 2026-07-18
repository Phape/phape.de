const categories = Array.isArray(window.linkCategories) ? window.linkCategories : [];
const categoriesContainer = document.getElementById("categories");
const searchInput = document.getElementById("link-search");
const resultsCount = document.getElementById("results-count");
const emptyState = document.getElementById("empty-state");
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeValue = document.querySelector(".theme-toggle__value");
const cardTemplate = document.getElementById("link-card-template");
const lazyImages = [];
const observedIcons = new WeakSet();

const PLACEHOLDER_ICON =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%23cfd8dc'/%3E%3C/svg%3E";
const THEME_STORAGE_KEY = "phape.links.theme";

function getFaviconUrl(linkUrl) {
    try {
        const { hostname } = new URL(linkUrl);
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
    } catch {
        return PLACEHOLDER_ICON;
    }
}

function renderCategories() {
    const fragment = document.createDocumentFragment();

    categories.forEach((category) => {
        const section = document.createElement("section");
        section.className = "category";
        section.dataset.categoryId = category.id;

        const header = document.createElement("div");
        header.className = "category__header";

        const titleWrap = document.createElement("div");
        const heading = document.createElement("h2");
        heading.textContent = category.title;
        const count = document.createElement("p");
        count.className = "category__count";
        count.textContent = `${category.links.length} Links`;
        titleWrap.append(heading, count);

        header.append(titleWrap);

        const grid = document.createElement("div");
        grid.className = "category__grid";

        category.links.forEach((link) => {
            const card = cardTemplate.content.firstElementChild.cloneNode(true);
            const anchor = card;
            const icon = card.querySelector(".link-card__icon");
            const linkTitle = card.querySelector(".link-card__title");
            const linkHost = card.querySelector(".link-card__host");

            anchor.href = link.url;
            anchor.dataset.searchText = `${category.title} ${link.title} ${link.url}`.toLowerCase();
            anchor.title = link.url;

            linkTitle.textContent = link.title;
            linkHost.textContent = new URL(link.url).hostname;

            icon.alt = "";
            icon.dataset.src = link.icon || getFaviconUrl(link.url);
            icon.src = PLACEHOLDER_ICON;
            lazyImages.push(icon);

            grid.append(card);
        });

        section.append(header, grid);
        fragment.append(section);
    });

    categoriesContainer.replaceChildren(fragment);
}

function loadVisibleIcons() {
    if ("IntersectionObserver" in window) {
        const observer = loadVisibleIcons.observer || new IntersectionObserver((entries, observerInstance) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const image = entry.target;
                if (image.dataset.src) {
                    image.src = image.dataset.src;
                    image.removeAttribute("data-src");
                }
                observerInstance.unobserve(image);
            });
        }, {
            rootMargin: "180px 0px",
        });

        loadVisibleIcons.observer = observer;

        lazyImages.forEach((image) => {
            if (!image.dataset.src || observedIcons.has(image)) {
                return;
            }

            observedIcons.add(image);
            observer.observe(image);
        });
        return;
    }

    lazyImages.forEach((image) => {
        image.src = image.dataset.src;
        image.removeAttribute("data-src");
    });
}

function filterLinks() {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    document.querySelectorAll(".category").forEach((section) => {
        let sectionVisibleCount = 0;

        section.querySelectorAll(".link-card").forEach((card) => {
            const matches = query === "" || card.dataset.searchText.includes(query);
            card.hidden = !matches;

            if (matches) {
                sectionVisibleCount += 1;
                visibleCount += 1;
            }
        });

        section.hidden = sectionVisibleCount === 0;
        const count = section.querySelector(".category__count");
        if (count) {
            count.textContent = `${sectionVisibleCount} Links`;
        }
    });

    emptyState.hidden = visibleCount !== 0;
    resultsCount.textContent = query === ""
        ? `${visibleCount} Links in ${categories.length} Kategorien`
        : `${visibleCount} Treffer für „${searchInput.value.trim()}“`;

    loadVisibleIcons();
}

function getStoredTheme() {
    try {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        return storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
            ? storedTheme
            : "system";
    } catch {
        return "system";
    }
}

function applyTheme(theme) {
    if (theme === "system") {
        document.documentElement.removeAttribute("data-theme");
        themeValue.textContent = "Auto";
        themeToggle.setAttribute("aria-pressed", "false");
        return;
    }

    document.documentElement.setAttribute("data-theme", theme);
    themeValue.textContent = theme === "dark" ? "Dark" : "Light";
    themeToggle.setAttribute("aria-pressed", "true");
}

function storeTheme(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // Ignore storage failures in private browsing / locked-down contexts.
    }
}

function cycleTheme() {
    const currentTheme = getStoredTheme();
    const nextTheme = currentTheme === "system"
        ? "dark"
        : currentTheme === "dark"
            ? "light"
            : "system";

    storeTheme(nextTheme);
    applyTheme(nextTheme);
}

function initTheme() {
    applyTheme(getStoredTheme());
    themeToggle.addEventListener("click", cycleTheme);
}

function initSearch() {
    searchInput.addEventListener("input", filterLinks);
}

renderCategories();
initTheme();
initSearch();
filterLinks();
