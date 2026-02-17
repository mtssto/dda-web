document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const catalogView = document.getElementById('catalog-view');
    const catalogGrid = document.getElementById('catalog-grid');
    const readerView = document.getElementById('reader-view');
    const backBtn = document.getElementById('backToCatalogBtn');

    const loading = document.getElementById('loading');
    const bookContainer = document.querySelector('.book-container');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    let pdfDoc = null;
    let pageFlip = null;

    // --- Book Data ---
    // --- Book Data ---
    window.pageTranslations = {
        es: {
            'catalog.title': 'Textos y Libros',
            'book.read': 'Leer',
            'book.back': '← Volver al Catálogo'
        },
        en: {
            'catalog.title': 'Texts and Books',
            'book.read': 'Read',
            'book.back': '← Back to Catalog'
        }
    };

    const books = [
        {
            id: 'libro_diego',
            title: 'viajeaoriente',
            file: 'libro_diego.pdf',
            image: 'caratula-1.png', // Image cover
            price: '$25.00'
        },
        {
            id: 'libro_diego_2',
            title: 'esto es lo que pasa',
            file: 'libro_diego_2.pdf',
            image: 'caratula-2.png', // Image cover
            price: '$25.00'
        },
        {
            id: 'libro_diego_3',
            title: 'TOMAMOS DE TODOS LOS COLORES',
            file: 'libro_diego_3.pdf',
            image: 'caratula-3.png', // Image cover
            price: '$25.00'
        },

    ];

    function showError(msg) {
        loading.textContent = msg;
        loading.style.color = 'red';
        loading.style.display = 'block';
        console.error(msg);
    }

    // Checking dependencies
    if (typeof pdfjsLib === 'undefined' || typeof St === 'undefined') {
        console.error("Libraries not loaded");
        // We will just let it fail gracefully later or show alert
    }

    // Protocol Check
    if (window.location.protocol === 'file:') {
        showError('Error: This page cannot be run directly from the file system due to browser security restrictions (CORS). Please use a local web server.');
        // We might still want to show the catalog even if reader fails later
    }

    // --- Catalog Logic ---

    function renderCatalog() {
        // Translate title
        const catalogTitle = document.querySelector('.catalog-title');
        if (catalogTitle && !catalogTitle.hasAttribute('data-i18n')) {
            catalogTitle.setAttribute('data-i18n', 'catalog.title');
        }

        // Translate back button
        if (backBtn && !backBtn.hasAttribute('data-i18n')) {
            backBtn.setAttribute('data-i18n', 'book.back');
        }

        catalogGrid.innerHTML = '';
        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.onclick = () => openBook(book);

            let cover;
            if (book.image) {
                cover = document.createElement('img');
                cover.src = book.image;
                cover.className = 'book-cover-img';
                cover.alt = book.title;
            } else {
                cover = document.createElement('div');
                cover.className = 'book-cover-placeholder';
                cover.textContent = book.coverText || book.title;
            }

            const title = document.createElement('h3');
            title.className = 'book-title';
            title.textContent = book.title;

            const btn = document.createElement('button');
            btn.className = 'book-btn';
            btn.setAttribute('data-i18n', 'book.read');
            btn.textContent = 'Leer';

            card.appendChild(cover);
            card.appendChild(title);
            card.appendChild(btn);
            catalogGrid.appendChild(card);
        });

        // Trigger translation update if available
        if (window.changeLanguage) {
            window.changeLanguage(localStorage.getItem('preferredLanguage') || 'es');
        }
    }

    // --- Reader Logic ---

    async function openBook(book) {
        if (!book.file) {
            alert("Este libro aún no tiene archivo PDF asociado.");
            return;
        }

        // Switch Views
        catalogView.style.display = 'none';
        readerView.style.display = 'block';

        // FORCEFUL CLEANUP AND REINIT
        if (pageFlip) {
            try { pageFlip.destroy(); } catch (e) { }
            pageFlip = null;
        }

        // Remove any existing flipbook element
        bookContainer.innerHTML = '';

        // Create fresh element
        const newBookEl = document.createElement('div');
        newBookEl.id = 'flipbook';
        // Hide initially
        newBookEl.style.display = 'none';
        bookContainer.appendChild(newBookEl);

        loading.style.display = 'block';
        loading.style.color = '#666';
        loading.textContent = `Cargando ${book.title}...`;

        // Pass the new element
        await loadPdf(book.file, newBookEl);
    }

    function closeBook() {
        readerView.style.display = 'none';
        catalogView.style.display = 'block';

        if (pageFlip) {
            try { pageFlip.destroy(); } catch (e) { }
            pageFlip = null;
        }
        bookContainer.innerHTML = ''; // Clear DOM
    }

    backBtn.addEventListener('click', closeBook);


    // --- PDF Loading ---
    async function loadPdf(url, bookEl) {
        try {
            loading.textContent = 'Loading Document...';
            pdfDoc = await pdfjsLib.getDocument(url).promise;
            const totalPages = pdfDoc.numPages;

            if (totalPages === 0) {
                showError('Error: PDF has 0 pages.');
                return;
            }

            loading.textContent = `Found ${totalPages} pages. Preparing...`;

            // Adjust scale for mobile
            const isMobile = window.innerWidth < 768;
            const pdfScale = isMobile ? 1.0 : 1.5;

            for (let i = 1; i <= totalPages; i++) {
                // loading.textContent = `Rendering page ${i} of ${totalPages}...`; 

                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: pdfScale });

                const div = document.createElement('div');
                div.classList.add('page');

                const canvas = document.createElement('canvas');
                canvas.classList.add('page-content');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                await page.render(renderContext).promise;

                div.appendChild(canvas);
                bookEl.appendChild(div);
            }

            // Initialize Flipbook
            loading.style.display = 'none';
            bookEl.style.display = 'block';

            // Dynamic dimensions for better mobile fit
            const width = isMobile ? 350 : 550;
            const height = isMobile ? 500 : 700;

            pageFlip = new St.PageFlip(bookEl, {
                width: width,
                height: height,
                size: 'stretch',
                minWidth: 300,
                maxWidth: 1000,
                minHeight: 400,
                maxHeight: 1200,
                maxShadowOpacity: 0.5,
                showCover: true,
                usePortrait: true, // Forces single page mode on smaller screens
                startPage: 0,
                mobileScrollSupport: false // Keep flip effect enabled on mobile
            });

            pageFlip.loadFromHTML(document.querySelectorAll('.page'));

            // Events
            pageFlip.on('flip', (e) => {
                updatePageInfo(totalPages);
            });

            // Initial info
            updatePageInfo(totalPages);

            // Re-attach button listeners since we are in same scope but might have lost refs if DOM changed? 
            // No, buttons are static outside bookEl. But listeners need to refer to current pageFlip instance.
            // We need to ensure listeners don't duplicate. 
            // Better to handle listeners centrally.

        } catch (error) {
            console.error('Error loading PDF:', error);
            showError('Error loading book: ' + error.message);
        }
    }

    function updatePageInfo(totalPages) {
        if (!pageFlip) return;
        const current = pageFlip.getCurrentPageIndex() + 1;
        pageInfo.textContent = `${current} / ${totalPages}`;
    }

    // Global Button Listeners (attached once)
    prevBtn.addEventListener('click', () => {
        if (pageFlip) pageFlip.flipPrev();
    });
    nextBtn.addEventListener('click', () => {
        if (pageFlip) pageFlip.flipNext();
    });

    // Initialize
    renderCatalog();

});
