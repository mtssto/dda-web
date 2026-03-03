document.addEventListener('DOMContentLoaded', () => {
    const navBurger = document.getElementById('navBurger');
    const navDrawer = document.getElementById('navDrawer');
    const navOverlay = document.getElementById('navOverlay');
    const navClose = document.getElementById('navClose');

    function navSetOpen(v) {
        if (!navDrawer) return;
        navDrawer.classList.toggle('is-open', v);
        if (navBurger) {
            navBurger.setAttribute('aria-expanded', String(v));
            navBurger.classList.toggle('is-open', v);
        }
        if (navOverlay) navOverlay.hidden = !v;
        document.body.style.overflow = v ? 'hidden' : '';
    }

    if (navBurger) navBurger.addEventListener('click', () => navSetOpen(true));
    if (navClose) navClose.addEventListener('click', () => navSetOpen(false));
    if (navOverlay) navOverlay.addEventListener('click', () => navSetOpen(false));

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') navSetOpen(false);
    });

    // Mobile dropdown toggle functionality
    const mobileDropdownItems = document.querySelectorAll('.navbar-drawer__links .navbar__item');

    mobileDropdownItems.forEach(item => {
        // Target the FIRST anchor tag which functions as the toggle
        const toggleLink = item.querySelector('a');
        const dropdown = item.querySelector('.dropdown-content');

        if (toggleLink && dropdown) {
            toggleLink.addEventListener('click', (e) => {
                // Check if we are in mobile view (drawer mode)
                // We use 1024px to match the CSS breakpoint for the drawer/burger
                if (window.innerWidth <= 1024) {
                    e.preventDefault();
                    e.stopPropagation(); // Stop bubbling

                    // Optional: Close other dropdowns (Accordion style)
                    mobileDropdownItems.forEach(otherItem => {
                        if (otherItem !== item && otherItem.classList.contains('is-active')) {
                            otherItem.classList.remove('is-active');
                        }
                    });

                    item.classList.toggle('is-active');
                }
            });
        }
    });

    // Close all dropdowns when resizing to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            mobileDropdownItems.forEach(item => {
                item.classList.remove('is-active');
            });
        }
    });

    // --- Language Switching Logic ---

    // Global Translations (Navigation & Common)
    // Pages can extend this by adding to window.translations or handling their own data-i18n
    window.translations = window.translations || {};

    const commonTranslations = {
        es: {
            'nav.bio': 'Bio',
            'nav.prensa': 'Prensa',
            'nav.muestras': 'Muestras',
            'nav.obras': 'Obras',
            'nav.proyectos': 'Proyectos',
            'nav.textos': 'Publicaciones',
            'nav.shop': 'Shop',
            'nav.contact': 'Contact',
            'footer.rights': 'Todos los derechos reservados.'
        },
        en: {
            'nav.bio': 'Bio',
            'nav.prensa': 'Press',
            'nav.muestras': 'Exhibitions',
            'nav.obras': 'Artworks',
            'nav.proyectos': 'Projects',
            'nav.textos': 'Publications',
            'nav.shop': 'Shop',
            'nav.contact': 'Contact',
            'footer.rights': 'All rights reserved.'
        }
    };

    // Deep merge or simple assign? Simple assign for now
    // We want to ensure we don't overwrite page-specific translations if they loaded first (unlikely) 
    // or we want to provide a base.

    // Let's define a global function
    window.changeLanguage = function (lang) {
        localStorage.setItem('preferredLanguage', lang);

        // 1. Common Translations
        updateElements(commonTranslations[lang]);

        // 2. Page Specific Translations (if any)
        if (window.pageTranslations && window.pageTranslations[lang]) {
            updateElements(window.pageTranslations[lang]);
        }

        // 3. Update active state of buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
            // Optional: Bold weight or color change
            btn.style.fontWeight = btn.getAttribute('data-lang') === lang ? 'bold' : 'normal';
        });

        // 4. Update body class
        document.body.classList.remove('lang-es', 'lang-en');
        document.body.classList.add('lang-' + lang);

        // 5. Dispatch event for other scripts
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    };

    function updateElements(t) {
        if (!t) return;

        // 1. Standard data-i18n approach
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                el.textContent = t[key];
            }
        });

        // 2. Fallback for Navbar Links without data-i18n (Dynamic matching)
        // This ensures other pages get translated nav even if I didn't edit their HTML
        const navMap = {
            'About': 'nav.bio',
            'Bio': 'nav.bio',
            'Prensa': 'nav.prensa',
            'Muestras': 'nav.muestras',
            'Obras': 'nav.obras',
            'Proyectos': 'nav.proyectos',
            'Projects': 'nav.proyectos',
            'Publicaciones': 'nav.textos',
            'Publications': 'nav.textos',
            'Shop': 'nav.shop',
            'Contact': 'nav.contact'
        };

        document.querySelectorAll('.navbar__links a, .navbar-drawer__links a').forEach(link => {
            if (!link.hasAttribute('data-i18n')) {
                const text = link.textContent.trim();
                if (navMap[text] && t[navMap[text]]) {
                    link.textContent = t[navMap[text]];
                    // Optionally add the attribute for future updates
                    link.setAttribute('data-i18n', navMap[text]);
                }
            }
        });
    }

    // --- Inject Language Switcher if not present ---
    function injectLanguageSwitcher() {
        const navLinks = document.querySelector('.navbar__links');
        const navDrawerLinks = document.querySelector('.navbar-drawer__links');

        // Desktop
        if (navLinks && !navLinks.querySelector('.lang-switcher')) {
            const div = document.createElement('div');
            div.className = 'lang-switcher';
            div.style.cssText = 'margin-left: 15px; display: inline-block; font-size: 0.9rem;';
            div.innerHTML = `
                <a href="#" class="lang-btn" data-lang="es" style="text-decoration: none; color: inherit;">ES</a> | 
                <a href="#" class="lang-btn" data-lang="en" style="text-decoration: none; color: inherit;">EN</a>
            `;
            navLinks.appendChild(div);
        }

        // Mobile
        if (navDrawerLinks && !navDrawerLinks.querySelector('.lang-switcher-mobile')) {
            const div = document.createElement('div');
            div.className = 'lang-switcher-mobile';
            div.style.cssText = 'margin-top: 15px; font-size: 1rem;';
            div.innerHTML = `
                <a href="#" class="lang-btn" data-lang="es" style="margin-right: 10px;">ES</a>
                <a href="#" class="lang-btn" data-lang="en">EN</a>
            `;
            navDrawerLinks.appendChild(div);
        }
    }

    injectLanguageSwitcher();

    // Initialize
    const savedLang = localStorage.getItem('preferredLanguage') || 'es';
    window.changeLanguage(savedLang);

    // Listeners for buttons (using delegation to catch dynamically added ones or ones in different parts)
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('lang-btn')) {
            e.preventDefault();
            const lang = e.target.getAttribute('data-lang');
            if (lang) window.changeLanguage(lang);
        }
    });

});
