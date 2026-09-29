/* Admin tool to select works and download a catalog PDF. */
(function () {
    'use strict';

    var PAGE_SIZE = 100;
    var PDF_ARTWORK_CATEGORIES = [
        'Paisajes',
        'Autorretratos',
        'Otros dibujos en papel',
        'Pintura sobre madera',
        'Otras pinturas',
        'Gatos',
        'Pitufos'
    ];
    var state = { artworks: [], selected: new Set(), loading: false };
    var modal, list, count, search, generate, status;

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
        });
    }

    function categoryName(artwork) {
        var category = artwork.category;
        if (category && typeof category === 'object') return category.name || category.slug || '';
        return category || '';
    }

    function isDigital(artwork) {
        var category = categoryName(artwork).toLowerCase();
        var technique = String(artwork.technique || '').toLowerCase();
        var id = String(artwork.slug || artwork.id || '').toLowerCase();
        return category === 'digital' || category.indexOf('digital') !== -1 || technique.indexOf('arte digital') !== -1 || id.indexOf('digital-artwork-') === 0;
    }

    function normalizeCategoryText(value) {
        return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function pdfCategory(artwork) {
        var title = normalizeCategoryText(artwork.title);
        var slug = normalizeCategoryText(artwork.slug || artwork.id);
        var category = normalizeCategoryText(categoryName(artwork));
        var technique = normalizeCategoryText(artwork.technique);
        var theme = title + ' ' + slug + ' ' + category;
        if (/\b(pitufo|pitufos|smurf)\b/.test(theme)) return 'Pitufos';
        if (/\b(gato|gatos|felino|felinos)\b/.test(theme)) return 'Gatos';
        if (/autorretrato/.test(theme)) return 'Autorretratos';
        if (/paisaje/.test(theme)) return 'Paisajes';
        if (/papel/.test(technique) || /dibujo|ilustracion/.test(category)) return 'Otros dibujos en papel';
        if (/madera|wood|puerta/.test(technique)) return 'Pintura sobre madera';
        return 'Otras pinturas';
    }

    function addWatermark(doc) {
        var pageW = doc.internal.pageSize.getWidth();
        var pageH = doc.internal.pageSize.getHeight();
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.06 }));
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(72);
        doc.setTextColor(0);
        doc.text('dda', pageW / 2, pageH / 2, { align: 'center', angle: 45 });
        doc.restoreGraphicsState();
    }

    function addCategoryDivider(doc, category, artworkCount) {
        var pageW = doc.internal.pageSize.getWidth();
        var pageH = doc.internal.pageSize.getHeight();
        addWatermark(doc);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(0);
        doc.text(category, pageW / 2, pageH / 2 - 4, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(artworkCount + (artworkCount === 1 ? ' obra' : ' obras'), pageW / 2, pageH / 2 + 7, { align: 'center' });
        doc.setTextColor(0);
    }

    function getImages(artwork) {
        var images = Array.isArray(artwork.images) ? artwork.images.slice() : [];
        images.sort(function (a, b) {
            if (!!(a && (a.isPrimary || a.primary)) !== !!(b && (b.isPrimary || b.primary))) {
                return (a && (a.isPrimary || a.primary)) ? -1 : 1;
            }
            return Number((a && (a.sortOrder || a.sort_order)) || 0) - Number((b && (b.sortOrder || b.sort_order)) || 0);
        });
        var urls = images.map(function (image) {
            var resolved = DDAImages.resolveImageUrl(image, window.location.href);
            return DDAImages.getPdfImageUrl(resolved);
        }).filter(Boolean);
        if (!urls.length && artwork.image) urls.push(DDAImages.getPdfImageUrl(DDAImages.resolveImageUrl(artwork.image, window.location.href)));
        return urls.filter(function (url, index) { return urls.indexOf(url) === index; });
    }

    function thumbnail(artwork) {
        var images = Array.isArray(artwork.images) ? artwork.images : [];
        var primary = images.find(function (img) { return img && (img.isPrimary || img.primary); }) || images[0];
        var url = primary ? DDAImages.resolveImageUrl(primary, window.location.href) : artwork.image;
        return url ? DDAImages.getTransformedUrl(url, 160) : '';
    }

    function filteredArtworks() {
        var query = search.value.trim().toLowerCase();
        if (!query) return state.artworks;
        return state.artworks.filter(function (art) {
            return String(art.title || '').toLowerCase().indexOf(query) !== -1 ||
                String(categoryName(art)).toLowerCase().indexOf(query) !== -1;
        });
    }

    function updateCount() {
        count.textContent = state.selected.size + ' de ' + state.artworks.length + ' obras seleccionadas';
        generate.disabled = state.loading || state.selected.size === 0;
    }

    function renderList() {
        if (state.loading) {
            list.innerHTML = '<p class="catalog-pdf-empty">Cargando obras…</p>';
            updateCount();
            return;
        }
        var visible = filteredArtworks();
        if (!visible.length) {
            list.innerHTML = '<p class="catalog-pdf-empty">No encontramos obras con esa búsqueda.</p>';
            updateCount();
            return;
        }
        list.innerHTML = visible.map(function (artwork) {
            var id = String(artwork.id);
            var image = thumbnail(artwork);
            return '<label class="catalog-pdf-row">' +
                '<input type="checkbox" data-artwork-id="' + escapeHtml(id) + '" ' + (state.selected.has(id) ? 'checked' : '') + '>' +
                (image ? '<img src="' + escapeHtml(image) + '" alt="" loading="lazy">' : '<span></span>') +
                '<span><span class="catalog-pdf-row__title">' + escapeHtml(artwork.title || 'Obra sin título') + '</span>' +
                '<span class="catalog-pdf-row__category">' + escapeHtml(categoryName(artwork) || 'Sin categoría') + '</span></span>' +
                '<span class="catalog-pdf-row__year">' + escapeHtml(artwork.year || '') + '</span>' +
                '</label>';
        }).join('');
        updateCount();
    }

    async function loadArtworks() {
        state.loading = true;
        renderList();
        try {
            var all = [];
            var page = 0;
            var totalPages = 1;
            do {
                var response = await DDAAuth.apiFetch('/artworks?page=' + page + '&size=' + PAGE_SIZE + '&sort=id,desc');
                if (!response.ok) throw new Error('No se pudieron cargar las obras.');
                var data = await response.json();
                all = all.concat(data.content || []);
                var paging = data.page || data;
                totalPages = Number(paging.totalPages || 1);
                page += 1;
            } while (page < totalPages);

            state.artworks = all.filter(function (art) { return !art.sold && !isDigital(art); });
            state.selected = new Set(state.artworks.map(function (art) { return String(art.id); }));
        } catch (error) {
            status.textContent = error.message || 'No se pudieron cargar las obras.';
            state.artworks = [];
            state.selected.clear();
        } finally {
            state.loading = false;
            renderList();
        }
    }

    function dataUrl(src) {
        function convertImage(image) {
            var canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth || image.width || 800;
            canvas.height = image.naturalHeight || image.height || 800;
            canvas.getContext('2d').drawImage(image, 0, 0);
            return canvas.toDataURL('image/jpeg', 0.92);
        }
        return fetch(src).then(function (response) {
            if (!response.ok) throw new Error('No se pudo cargar una imagen.');
            return response.blob();
        }).then(function (blob) {
            return new Promise(function (resolve, reject) {
                var objectUrl = URL.createObjectURL(blob);
                var image = new Image();
                image.onload = function () {
                    try { resolve(convertImage(image)); } catch (error) { reject(error); }
                    URL.revokeObjectURL(objectUrl);
                };
                image.onerror = function () { URL.revokeObjectURL(objectUrl); reject(new Error('No se pudo procesar una imagen.')); };
                image.src = objectUrl;
            });
        }).catch(function () {
            return new Promise(function (resolve, reject) {
                var image = new Image();
                image.crossOrigin = 'anonymous';
                image.onload = function () {
                    try { resolve(convertImage(image)); } catch (error) { reject(error); }
                };
                image.onerror = function () { reject(new Error('No se pudo cargar una imagen.')); };
                image.src = src;
            });
        });
    }

    function imageDimensions(src) {
        return new Promise(function (resolve, reject) {
            var image = new Image();
            image.onload = function () { resolve({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 }); };
            image.onerror = reject;
            image.src = src;
        });
    }

    function addFittedImage(doc, src, data, x, y, maxW, maxH) {
        return imageDimensions(data).then(function (dims) {
            var scale = Math.min(maxW / dims.width, maxH / dims.height);
            var width = dims.width * scale;
            var height = dims.height * scale;
            var format = String(data).indexOf('data:image/png') === 0 ? 'PNG' : 'JPEG';
            doc.addImage(data, format, x + (maxW - width) / 2, y + (maxH - height) / 2, width, height);
        });
    }

    async function addArtworkPage(doc, artwork) {
        var pageW = doc.internal.pageSize.getWidth();
        var pageH = doc.internal.pageSize.getHeight();
        var margin = 12;
        addWatermark(doc);
        var images = getImages(artwork).slice(0, 2);
        var imageTop = 18;
        var imageMaxH = pageH - 110;
        if (images.length === 2) {
            var gap = 8;
            var colW = (pageW - margin * 2 - gap) / 2;
            var first = await dataUrl(images[0]);
            var second = await dataUrl(images[1]);
            await addFittedImage(doc, images[0], first, margin, imageTop, colW, imageMaxH);
            await addFittedImage(doc, images[1], second, margin + colW + gap, imageTop, colW, imageMaxH);
            doc.setFontSize(8);
            doc.setTextColor(140);
            doc.text('FRENTE', margin + colW / 2, imageTop + imageMaxH + 5, { align: 'center' });
            doc.text('REVERSO', margin + colW + gap + colW / 2, imageTop + imageMaxH + 5, { align: 'center' });
        } else if (images.length === 1) {
            var single = await dataUrl(images[0]);
            await addFittedImage(doc, images[0], single, margin, imageTop, pageW - margin * 2, imageMaxH);
        } else {
            doc.setDrawColor(215);
            doc.rect(margin, imageTop, pageW - margin * 2, imageMaxH);
            doc.setFontSize(11);
            doc.setTextColor(130);
            doc.text('Sin imagen', pageW / 2, imageTop + imageMaxH / 2, { align: 'center' });
        }

        var metaY = pageH - 65;
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        var titleLines = doc.splitTextToSize(artwork.title || 'Obra sin título', pageW - margin * 2);
        doc.text(titleLines, margin, metaY);
        metaY += titleLines.length * 7 + 2;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(75);
        [artwork.technique && 'Técnica: ' + artwork.technique,
            artwork.dimensions && 'Dimensiones: ' + artwork.dimensions,
            artwork.year && artwork.year !== 'Consultar año' && String(artwork.year),
            artwork.price && 'Precio: ' + artwork.price]
            .filter(Boolean).forEach(function (line) { doc.text(doc.splitTextToSize(line, pageW - margin * 2), margin, metaY); metaY += 5; });
    }

    async function generatePdf() {
        var chosen = state.artworks.filter(function (art) { return state.selected.has(String(art.id)); });
        if (!chosen.length || !window.jspdf || !window.jspdf.jsPDF) return;
        generate.disabled = true;
        status.textContent = 'Preparando PDF…';
        try {
            var doc = new window.jspdf.jsPDF();
            var margin = 12;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.text('Catálogo - Diego De Aduriz', margin, 22);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(110);
            doc.text('Generado el ' + new Date().toLocaleDateString('es-AR'), margin, 30);
            doc.text(chosen.length + ' obras', margin, 37);
            doc.setTextColor(0);

            var grouped = new Map(PDF_ARTWORK_CATEGORIES.map(function (category) { return [category, []]; }));
            chosen.forEach(function (artwork) { grouped.get(pdfCategory(artwork)).push(artwork); });
            var artworkIndex = 0;
            for (var categoryIndex = 0; categoryIndex < PDF_ARTWORK_CATEGORIES.length; categoryIndex += 1) {
                var category = PDF_ARTWORK_CATEGORIES[categoryIndex];
                var categoryArtworks = grouped.get(category);
                if (!categoryArtworks.length) continue;
                doc.addPage();
                addCategoryDivider(doc, category, categoryArtworks.length);
                for (var artworkIndexInCategory = 0; artworkIndexInCategory < categoryArtworks.length; artworkIndexInCategory += 1) {
                    artworkIndex += 1;
                    doc.addPage();
                    try {
                        await addArtworkPage(doc, categoryArtworks[artworkIndexInCategory]);
                    } catch (imageError) {
                        console.warn('No se pudo incluir alguna imagen en el PDF', imageError);
                        doc.setFontSize(12);
                        doc.text(categoryArtworks[artworkIndexInCategory].title || 'Obra sin título', margin, 30);
                        doc.setFontSize(10);
                        doc.text('No se pudo cargar una imagen de esta obra.', margin, 40);
                    }
                    status.textContent = 'Armando PDF… ' + artworkIndex + ' de ' + chosen.length;
                }
            }
            doc.save('Catalogo_DiegoDeAduriz.pdf');
            status.textContent = 'Catálogo descargado.';
        } catch (error) {
            console.error('Error al crear catálogo PDF:', error);
            status.textContent = 'No se pudo crear el PDF. Revisá tu conexión e intentá nuevamente.';
        } finally {
            updateCount();
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        modal = document.getElementById('catalogPdfModal');
        if (!modal) return;
        list = document.getElementById('catalogPdfList');
        count = document.getElementById('catalogPdfCount');
        search = document.getElementById('catalogPdfSearch');
        generate = document.getElementById('catalogPdfGenerate');
        status = document.getElementById('catalogPdfStatus');

        function closeModal() { modal.hidden = true; document.body.classList.remove('modal-open'); }
        document.getElementById('openCatalogPdfBtn').addEventListener('click', function () {
            modal.hidden = false;
            document.body.classList.add('modal-open');
            status.textContent = '';
            if (!state.artworks.length) loadArtworks();
            else renderList();
            document.getElementById('catalogPdfSearch').focus();
        });
        document.getElementById('catalogPdfClose').addEventListener('click', closeModal);
        document.getElementById('catalogPdfCancel').addEventListener('click', closeModal);
        modal.addEventListener('click', function (event) { if (event.target === modal) closeModal(); });
        search.addEventListener('input', renderList);
        list.addEventListener('change', function (event) {
            var input = event.target.closest('input[data-artwork-id]');
            if (!input) return;
            if (input.checked) state.selected.add(input.dataset.artworkId);
            else state.selected.delete(input.dataset.artworkId);
            updateCount();
        });
        document.getElementById('catalogPdfSelectVisible').addEventListener('click', function () {
            filteredArtworks().forEach(function (art) { state.selected.add(String(art.id)); });
            renderList();
        });
        document.getElementById('catalogPdfClearVisible').addEventListener('click', function () {
            filteredArtworks().forEach(function (art) { state.selected.delete(String(art.id)); });
            renderList();
        });
        generate.addEventListener('click', generatePdf);
        document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
    });
})();
