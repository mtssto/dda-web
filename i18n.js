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
            'nav.textos': 'PUBLICACIONES',
            'nav.shop': 'SHOP',
            'nav.contact': 'CONTACTO',
            'footer.rights': 'Todos los derechos reservados.',
            'auth.guarantee': 'Autenticidad Garantizada',
            'auth.shipping': 'Envío Global',
            'auth.service': 'Atención Personal',
            'close': 'CERRAR',
            'more': 'MÁS',
            'press.title': 'Archivo de Prensa',
            'press.0': 'El boom de arteba, 20 años de Rosa Chancho...',
            'press.1': '“El ánimo por las nubes”: nuevos compradores en arteba',
            'press.2': 'Arteba 2025 cerró con buenas ventas',
            'press.3': 'Las galerías debutantes y jóvenes propuestas',
            'press.4': 'Utopia en arteba: experimentan con nuevos materiales',
            'press.5': 'Abrió arteba 2025, con ilusión y un mercado en movimiento',
            'press.6': 'Diego de Aduriz, sus kimonos y sus máscaras',
            'press.7': 'Macba celebra sus 10 años con dos muestras...',
            'press.8': 'Diez años del Museo de Arte Contemporáneo',
            'press.9': 'La llave y el testigo, de Diego de Aduriz',
            'press.10': 'Nuevo espacio en barrio La Sexta',
            'press.11': 'Muestras colectivas de fin de año'
        },
        en: {
            'nav.bio': 'ABOUT ME',
            'nav.prensa': 'PRESS',
            'nav.muestras': 'EXHIBITIONS',
            'nav.obras': 'ARTWORKS',
            'nav.proyectos': 'PROJECTS',
            'nav.textos': 'PUBLICATIONS',
            'nav.shop': 'SHOP',
            'nav.contact': 'CONTACT',
            'footer.rights': 'All rights reserved.',
            'auth.guarantee': 'Authenticity Guaranteed',
            'auth.shipping': 'Global Shipping',
            'auth.service': 'Personal Service',
            'close': 'CLOSE',
            'more': 'MORE',
            'press.title': 'Press Archive',
            'press.0': 'The arteba boom, 20 years of Rosa Chancho...',
            'press.1': '“Spirits are high”: new buyers at arteba',
            'press.2': 'Arteba 2025 closed with good sales',
            'press.3': 'Debuting galleries and young proposals',
            'press.4': 'Utopia at arteba: experimenting with new materials',
            'press.5': 'Arteba 2025 opened, with illusion and a moving market',
            'press.6': 'Diego de Aduriz, his kimonos and his masks',
            'press.7': 'Macba celebrates its 10 years with two exhibitions...',
            'press.8': 'Ten years of the Museum of Contemporary Art',
            'press.9': 'The key and the witness, by Diego de Aduriz',
            'press.10': 'New space in La Sexta neighborhood',
            'press.11': 'End of year collective exhibitions'
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
            'PUBLICACIONES': 'nav.textos',
            'PUBLICATIONS': 'nav.textos',
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
