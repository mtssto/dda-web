document.addEventListener('DOMContentLoaded', () => {
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
            'press.6': 'Diego De Aduriz, sus kimonos y sus máscaras',
            'press.7': 'Macba celebra sus 10 años con dos muestras...',
            'press.8': 'Diez años del Museo de Arte Contemporáneo',
            'press.9': 'La llave y el testigo, de Diego De Aduriz',
            'press.10': 'Nuevo espacio en barrio La Sexta',
            'press.11': 'Muestras colectivas de fin de año',
            'press.12': 'Empezó con 50 obras... el MACBA, con planes de ampliación y dos nuevas muestras',
            'elefantes.p1': '“El nombre de la muestra surge en honor a los Atlantes de la galería: su presencia es tan imponente que terminan invadiendo todo lo que se desarrolle en ese lugar. Por eso, el artista y los atlantes firmaron un pacto de convivencia pacífica: las estatuas garantizan un espacio tranquilo para la muestra, y Diego De Aduriz ofrece una serie de obras a tono con estos gigantes de piedra y su paisaje neoclásico”, cuenta la curadora Silvana Moreno.',
            'elefantes.p2': 'Hace 21 años que Diego De Aduriz viene creando su propia mitología: paisajes psíquicos, criaturas esotéricas y autorretratos donde abandona la dimensión humana. En esta muestra, se vuelve un poco atlante, él también, en una serie de autorretratos.',
            'elefantes.p3': 'La imaginación ilimitada tiene su contrapeso terrenal en las técnicas clásicas de dibujo y pintura, con trazos limpios y geométricos en marcador, pastel tiza y al temple, en tonos tierra, ocre y óxido.',
            'elefantes.p4': '“Aquí, lo celestial y lo carnal se unen en un bazar de pinturas rupestres extraterrestres”, describe la curadora.',
            'index.welcome_shop': 'Descubre obras originales exclusivas.',
            'index.go_to_shop': 'IR AL SHOP'
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
            'press.6': 'Diego De Aduriz, his kimonos and his masks',
            'press.7': 'Macba celebrates its 10 years with two exhibitions...',
            'press.8': 'Ten years of the Museum of Contemporary Art',
            'press.9': 'The key and the witness, by Diego De Aduriz',
            'press.10': 'New space in La Sexta neighborhood',
            'press.11': 'End of year collective exhibitions',
            'press.12': 'Started with 50 artworks... MACBA, with expansion plans and two new exhibitions',
            'elefantes.p1': '“The name of the exhibition pays tribute to the gallery’s Atlantes: their presence is so imposing that they end up permeating everything that takes place in that space. That is why the artist and the Atlantes signed a pact of peaceful coexistence: the statues guarantee a calm setting for the exhibition, and Diego De Aduriz offers a series of works attuned to these stone giants and their neoclassical landscape,” says curator Silvana Moreno.',
            'elefantes.p2': 'For the past 21 years, Diego De Aduriz has been creating his own mythology: psychic landscapes, esoteric creatures, and self-portraits in which he abandons the human dimension. In this exhibition, he becomes a bit of an Atlante as well, in a series of self-portraits.',
            'elefantes.p3': 'This boundless imagination is grounded by the counterweight of classical drawing and painting techniques, with clean, geometric strokes in marker, chalk pastel, and tempera, in earth, ochre, and rust tones.',
            'elefantes.p4': '“Here, the celestial and the carnal come together in a bazaar of extraterrestrial cave paintings,” the curator describes.',
            'index.welcome_shop': 'Discover exclusive original artworks.',
            'index.go_to_shop': 'GO TO SHOP'
        }
    };

    function mergeTranslations(lang) {
        const merged = Object.assign({}, commonTranslations[lang] || {});
        if (window.platformTranslations && window.platformTranslations[lang]) {
            Object.assign(merged, window.platformTranslations[lang]);
        }
        if (window.pageTranslations && window.pageTranslations[lang]) {
            Object.assign(merged, window.pageTranslations[lang]);
        }
        return merged;
    }

    window.changeLanguage = function (lang) {
        localStorage.setItem('preferredLanguage', lang);
        document.documentElement.lang = lang;

        const t = mergeTranslations(lang);
        updateElements(t);

        document.querySelectorAll('.lang-btn').forEach(btn => {
            const isActive = btn.getAttribute('data-lang') === lang;
            btn.classList.toggle('active', isActive);
            btn.style.fontWeight = isActive ? '600' : '300';
            btn.style.opacity = isActive ? '1' : '0.5';
            btn.setAttribute('aria-pressed', String(isActive));
        });

        document.body.classList.remove('lang-es', 'lang-en');
        document.body.classList.add('lang-' + lang);

        if (window.PlatformHeader && window.PlatformHeader.refresh) {
            window.PlatformHeader.refresh();
        }

        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    };

    function updateElements(t) {
        if (!t) return;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) el.textContent = t[key];
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (t[key]) el.setAttribute('placeholder', t[key]);
        });

        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            if (t[key]) el.setAttribute('aria-label', t[key]);
        });

        const navMap = {
            'MUESTRAS': 'nav.muestras', 'EXHIBITIONS': 'nav.muestras',
            'SHOP': 'nav.shop', 'ARTWORKS': 'nav.obras', 'OBRAS': 'nav.obras',
            'PRENSA': 'nav.prensa', 'PRESS': 'nav.prensa',
            'PROYECTOS': 'nav.proyectos', 'PROJECTS': 'nav.proyectos',
            'PUBLICACIONES': 'nav.textos', 'PUBLICATIONS': 'nav.textos',
            'ABOUT ME': 'nav.bio', 'SOBRE MÍ': 'nav.bio',
            'CONTACT': 'nav.contact', 'CONTACTO': 'nav.contact',
            'CLOSE': 'close', 'CERRAR': 'close', 'MORE': 'more', 'MÁS': 'more',
            'CUADERNO': 'nav.journal', 'NOTEBOOK': 'nav.journal',
            'CATÁLOGO': 'nav.catalog', 'CATALOG': 'nav.catalog'
        };

        document.querySelectorAll('.index-nav-wrapper a, .close-btn, .platform-header__nav a').forEach(link => {
            if (!link.hasAttribute('data-i18n')) {
                const text = link.textContent.trim().toUpperCase();
                if (navMap[text] && t[navMap[text]]) {
                    link.textContent = t[navMap[text]];
                    link.setAttribute('data-i18n', navMap[text]);
                }
            }
        });
    }

    function injectLanguageSwitcher() {
        const switcherHTML = `
            <a href="#" class="lang-btn" data-lang="es" style="font-family:'Inter', sans-serif; font-size: 0.9rem; text-decoration: none; color: #111; transition: opacity 0.3s;">ES</a>
            <span style="font-family:'Inter', sans-serif; font-size: 0.9rem; color: #111; opacity: 0.5;">|</span>
            <a href="#" class="lang-btn" data-lang="en" style="font-family:'Inter', sans-serif; font-size: 0.9rem; text-decoration: none; color: #111; transition: opacity 0.3s;">EN</a>
        `;

        const closeContainer = document.querySelector('.close-container:not([data-platform-header])');
        if (closeContainer && !closeContainer.querySelector('.lang-switcher-global')) {
            const div = document.createElement('div');
            div.className = 'lang-switcher-global';
            div.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-right: 20px;';
            div.innerHTML = switcherHTML;
            closeContainer.insertBefore(div, closeContainer.firstChild);
        }

        const indexNavWrapper = document.querySelector('.nav-right-stack');
        if (indexNavWrapper && !indexNavWrapper.querySelector('.lang-switcher-global')) {
            const div = document.createElement('div');
            div.className = 'lang-switcher-global';
            div.style.cssText = 'display: flex; gap: 8px; align-items: center; justify-content: flex-end; margin-bottom: 20px; pointer-events: auto;';
            div.innerHTML = switcherHTML;
            indexNavWrapper.insertBefore(div, indexNavWrapper.firstChild);
        }
    }

    if (!document.querySelector('[data-platform-header]') && !document.body.classList.contains('has-platform-header')) {
        injectLanguageSwitcher();
    }

    const savedLang = localStorage.getItem('preferredLanguage') || 'es';
    window.changeLanguage(savedLang);

    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('lang-btn')) {
            e.preventDefault();
            const lang = e.target.getAttribute('data-lang');
            if (lang) window.changeLanguage(lang);
        }
    });
});
