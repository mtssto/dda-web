document.addEventListener('DOMContentLoaded', () => {
    // --- Language Switching Logic ---
    window.translations = window.translations || {};

    const commonTranslations = {
        es: {
            'nav.bio': 'SOBRE MÍ',
            'nav.prensa': 'PRENSA',
            'nav.muestras': 'MUESTRAS',
            'nav.obras': 'OBRAS',
            'nav.proyectos': 'PROYECTOS',
            'nav.textos': 'TEXTOS',
            'nav.shop': 'SHOP',
            'nav.contact': 'CONTACTO',
            'footer.rights': 'Todos los derechos reservados.',
            'auth.guarantee': 'Autenticidad Garantizada',
            'auth.shipping': 'Envío Global',
            'auth.service': 'Atención Personal',
            'close': 'CERRAR',
            'more': 'MÁS'
        },
        en: {
            'nav.bio': 'ABOUT ME',
            'nav.prensa': 'PRESS',
            'nav.muestras': 'EXHIBITIONS',
            'nav.obras': 'ARTWORKS',
            'nav.proyectos': 'PROJECTS',
            'nav.textos': 'TEXTS',
            'nav.shop': 'SHOP',
            'nav.contact': 'CONTACT',
            'footer.rights': 'All rights reserved.',
            'auth.guarantee': 'Authenticity Guaranteed',
            'auth.shipping': 'Global Shipping',
            'auth.service': 'Personal Service',
            'close': 'CLOSE',
            'more': 'MORE'
        }
    };

    window.changeLanguage = function (lang) {
        localStorage.setItem('preferredLanguage', lang);

        updateElements(commonTranslations[lang]);

        if (window.pageTranslations && window.pageTranslations[lang]) {
            updateElements(window.pageTranslations[lang]);
        }

        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.style.fontWeight = '600';
                btn.style.opacity = '1';
            } else {
                btn.style.fontWeight = '300';
                btn.style.opacity = '0.5';
            }
        });

        document.body.classList.remove('lang-es', 'lang-en');
        document.body.classList.add('lang-' + lang);

        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    };

    function updateElements(t) {
        if (!t) return;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                el.textContent = t[key];
            }
        });

        const navMap = {
            'MUESTRAS': 'nav.muestras',
            'EXHIBITIONS': 'nav.muestras',
            'SHOP': 'nav.shop',
            'ARTWORKS': 'nav.obras',
            'OBRAS': 'nav.obras',
            'PRENSA': 'nav.prensa',
            'PRESS': 'nav.prensa',
            'PROYECTOS': 'nav.proyectos',
            'PROJECTS': 'nav.proyectos',
            'TEXTOS': 'nav.textos',
            'TEXTS': 'nav.textos',
            'ABOUT ME': 'nav.bio',
            'SOBRE MÍ': 'nav.bio',
            'CONTACT': 'nav.contact',
            'CONTACTO': 'nav.contact',
            'CLOSE': 'close',
            'CERRAR': 'close',
            'MORE': 'more',
            'MÁS': 'more'
        };

        // Specially target index.html a wrappers and close-btn
        document.querySelectorAll('.index-nav-wrapper a, .close-btn').forEach(link => {
            if (!link.hasAttribute('data-i18n')) {
                const text = link.textContent.trim().toUpperCase();
                if (navMap[text] && t[navMap[text]]) {
                    link.textContent = t[navMap[text]];
                    link.setAttribute('data-i18n', navMap[text]);
                }
            }
        });
    }

    // --- Inject Language Switcher dynamically ---
    function injectLanguageSwitcher() {
        // Build switcher HTML
        const switcherHTML = `
            <a href="#" class="lang-btn" data-lang="es" style="font-family:'Inter', sans-serif; font-size: 0.9rem; text-decoration: none; color: #111; transition: opacity 0.3s;">ES</a>
            <span style="font-family:'Inter', sans-serif; font-size: 0.9rem; color: #111; opacity: 0.5;">|</span>
            <a href="#" class="lang-btn" data-lang="en" style="font-family:'Inter', sans-serif; font-size: 0.9rem; text-decoration: none; color: #111; transition: opacity 0.3s;">EN</a>
        `;

        // 1. Inject into Global Close Container
        const closeContainer = document.querySelector('.close-container');
        if (closeContainer && !closeContainer.querySelector('.lang-switcher-global')) {
            const div = document.createElement('div');
            div.className = 'lang-switcher-global';
            div.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-right: 20px;';
            div.innerHTML = switcherHTML;
            // Insert it before the CLOSE button
            closeContainer.insertBefore(div, closeContainer.firstChild);
        }

        // 2. Inject into Index Nav Wrapper
        const indexNavWrapper = document.querySelector('.nav-right-stack');
        if (indexNavWrapper && !indexNavWrapper.querySelector('.lang-switcher-global')) {
            const div = document.createElement('div');
            div.className = 'lang-switcher-global';
            div.style.cssText = 'display: flex; gap: 8px; align-items: center; justify-content: flex-end; margin-bottom: 20px; pointer-events: auto;';
            div.innerHTML = switcherHTML;
            // Prepend inside nav-right-stack
            indexNavWrapper.insertBefore(div, indexNavWrapper.firstChild);
        }
    }

    injectLanguageSwitcher();

    // Initialize
    const savedLang = localStorage.getItem('preferredLanguage') || 'es';
    window.changeLanguage(savedLang);

    // Event delegation for language switching
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('lang-btn')) {
            e.preventDefault();
            const lang = e.target.getAttribute('data-lang');
            if (lang) window.changeLanguage(lang);
        }
    });

});
