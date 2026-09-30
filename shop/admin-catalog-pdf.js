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

    async function addArtworkPage(doc, artwork, category, pageNumber, totalPages) {
        var layout = window.DDACatalogPdfDesign;
        var area = layout.beginArtworkPage(doc, category, pageNumber, totalPages);
        var images = getImages(artwork).slice(0, 2);
        if (images.length === 2) {
            var gap = 8;
            var colW = (area.width - gap) / 2;
            var first = await dataUrl(images[0]);
            var second = await dataUrl(images[1]);
            await addFittedImage(doc, images[0], first, area.x + 4, area.y + 4, colW - 8, area.height - 8);
            await addFittedImage(doc, images[1], second, area.x + colW + gap + 4, area.y + 4, colW - 8, area.height - 8);
            layout.addImageLabel(doc, 'FRENTE', area.x + colW / 2, area.y + area.height + 4);
            layout.addImageLabel(doc, 'REVERSO', area.x + colW + gap + colW / 2, area.y + area.height + 4);
        } else if (images.length === 1) {
            var single = await dataUrl(images[0]);
            await addFittedImage(doc, images[0], single, area.x + 5, area.y + 5, area.width - 10, area.height - 10);
        } else {
            layout.addImageFrame(doc, area.x, area.y, area.width, area.height);
            doc.setFontSize(11);
            doc.setTextColor(130);
            doc.text('Sin imagen disponible', area.x + area.width / 2, area.y + area.height / 2, { align: 'center' });
        }
        layout.addArtworkDetails(doc, artwork, category, pageNumber, totalPages);
    }

    async function generatePdf() {
        var chosen = state.artworks.filter(function (art) { return state.selected.has(String(art.id)); });
        if (!chosen.length || !window.jspdf || !window.jspdf.jsPDF) return;
        generate.disabled = true;
        status.textContent = 'Preparando PDF…';
        try {
            var doc = new window.jspdf.jsPDF();
            var grouped = new Map(PDF_ARTWORK_CATEGORIES.map(function (category) { return [category, []]; }));
            chosen.forEach(function (artwork) { grouped.get(pdfCategory(artwork)).push(artwork); });
            var sections = PDF_ARTWORK_CATEGORIES.map(function (category) {
                return { name: category, artworks: grouped.get(category), count: grouped.get(category).length };
            }).filter(function (section) { return section.count > 0; });
            var totalPages = 2 + sections.reduce(function (total, section) { return total + 1 + section.count; }, 0);
            var nextPage = 3;
            sections.forEach(function (section) {
                section.page = nextPage;
                nextPage += section.count + 1;
            });
            var layout = window.DDACatalogPdfDesign;
            layout.addCover(doc, {
                artworkCount: chosen.length,
                categoryCount: sections.length,
                date: new Date().toLocaleDateString('es-AR'),
                subtitle: 'Obras seleccionadas'
            });
            doc.addPage();
            layout.addContents(doc, sections, totalPages);

            var artworkIndex = 0;
            var currentPage = 2;
            for (var categoryIndex = 0; categoryIndex < sections.length; categoryIndex += 1) {
                var section = sections[categoryIndex];
                currentPage += 1;
                doc.addPage();
                layout.addSectionDivider(doc, section, categoryIndex + 1, currentPage, totalPages);
                for (var artworkIndexInCategory = 0; artworkIndexInCategory < section.artworks.length; artworkIndexInCategory += 1) {
                    artworkIndex += 1;
                    currentPage += 1;
                    doc.addPage();
                    try {
                        await addArtworkPage(doc, section.artworks[artworkIndexInCategory], section.name, currentPage, totalPages);
                    } catch (imageError) {
                        console.warn('No se pudo incluir alguna imagen en el PDF', imageError);
                        var artwork = section.artworks[artworkIndexInCategory];
                        layout.beginArtworkPage(doc, section.name, currentPage, totalPages);
                        layout.addArtworkDetails(doc, artwork, section.name, currentPage, totalPages);
                        status.textContent = 'No se pudo cargar una imagen de: ' + (artwork.title || 'Obra sin título');
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
