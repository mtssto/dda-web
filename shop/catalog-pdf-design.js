/* Shared editorial layout for the public and admin artwork catalogs. */
(function (global) {
    'use strict';

    var C = {
        ink: [32, 31, 30],
        muted: [112, 108, 102],
        line: [220, 215, 207],
        paper: [250, 248, 244],
        panel: [246, 244, 239],
        accent: [130, 79, 62],
        watermark: [231, 226, 218]
    };
    var MARGIN = 16;

    function size(doc) {
        return { width: doc.internal.pageSize.getWidth(), height: doc.internal.pageSize.getHeight() };
    }

    function fillPage(doc, color) {
        var page = size(doc);
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(0, 0, page.width, page.height, 'F');
    }

    function setText(doc, color) {
        doc.setTextColor(color[0], color[1], color[2]);
    }

    function addFooter(doc, pageNumber, totalPages) {
        var page = size(doc);
        doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
        doc.setLineWidth(0.25);
        doc.line(MARGIN, page.height - 15, page.width - MARGIN, page.height - 15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        setText(doc, C.muted);
        doc.text('diegodeaduriz.com', MARGIN, page.height - 9);
        doc.text(String(pageNumber).padStart(2, '0') + ' / ' + String(totalPages).padStart(2, '0'), page.width - MARGIN, page.height - 9, { align: 'right' });
        setText(doc, C.ink);
    }

    function addCover(doc, options) {
        options = options || {};
        var page = size(doc);
        fillPage(doc, C.paper);

        doc.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
        doc.rect(MARGIN, 34, 1.5, 26, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setCharSpace(1.4);
        setText(doc, C.ink);
        doc.text('DIEGO DE ADURIZ', MARGIN + 7, 43);
        doc.setCharSpace(0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        setText(doc, C.muted);
        doc.text('OBRA ORIGINAL', MARGIN + 7, 51);

        doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, 72, page.width - MARGIN, 72);

        doc.setFont('times', 'bold');
        doc.setFontSize(38);
        setText(doc, C.ink);
        doc.text('Catálogo', MARGIN, 119);
        doc.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
        doc.rect(MARGIN, 132, 27, 1.2, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        setText(doc, C.muted);
        doc.text(options.subtitle || 'Obras seleccionadas', MARGIN, 148);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setCharSpace(0.7);
        setText(doc, C.accent);
        doc.text(String(options.categoryCount || 0) + ' CATEGORÍAS', MARGIN, 188);
        doc.text(String(options.artworkCount || 0) + ' OBRAS', MARGIN + 48, 188);
        doc.setCharSpace(0);

        doc.setFillColor(C.ink[0], C.ink[1], C.ink[2]);
        doc.rect(0, page.height - 48, page.width, 48, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        setText(doc, [238, 235, 229]);
        doc.text('CATÁLOGO DIGITAL', MARGIN, page.height - 30);
        doc.text(options.date || '', page.width - MARGIN, page.height - 30, { align: 'right' });
        doc.setFont('times', 'italic');
        doc.setFontSize(11);
        setText(doc, [255, 255, 255]);
        doc.text('diegodeaduriz.com', MARGIN, page.height - 18);
        setText(doc, C.ink);
    }

    function addContents(doc, sections, totalPages) {
        var page = size(doc);
        fillPage(doc, C.paper);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setCharSpace(0.9);
        setText(doc, C.ink);
        doc.text('DIEGO DE ADURIZ', MARGIN, 20);
        doc.setCharSpace(0);
        doc.setFont('times', 'italic');
        doc.setFontSize(8.5);
        setText(doc, C.muted);
        doc.text('CATÁLOGO DE OBRA ORIGINAL', page.width - MARGIN, 20, { align: 'right' });
        doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
        doc.setLineWidth(0.25);
        doc.line(MARGIN, 26, page.width - MARGIN, 26);

        doc.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
        doc.rect(MARGIN, 37, 1.5, 25, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setCharSpace(0.9);
        setText(doc, C.accent);
        doc.text('RECORRIDO POR CATEGORÍAS', MARGIN + 7, 42);
        doc.setCharSpace(0);
        doc.setFont('times', 'bold');
        doc.setFontSize(26);
        setText(doc, C.ink);
        doc.text('Contenido', MARGIN + 7, 57);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        setText(doc, C.muted);
        doc.text('Categorías incluidas en esta selección', MARGIN, 72);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setCharSpace(0.6);
        setText(doc, C.accent);
        doc.text(String(sections.length).padStart(2, '0') + ' SECCIONES', page.width - MARGIN, 72, { align: 'right' });
        doc.setCharSpace(0);
        doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
        doc.line(MARGIN, 77, page.width - MARGIN, 77);

        var rowY = 89;
        sections.forEach(function (section, index) {
            doc.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
            doc.circle(MARGIN + 3, rowY - 1, 2.8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.3);
            setText(doc, [255, 255, 255]);
            doc.text(String(index + 1).padStart(2, '0'), MARGIN + 3, rowY + 0.8, { align: 'center' });
            doc.setFont('times', 'bold');
            doc.setFontSize(11.5);
            setText(doc, C.ink);
            var nameX = MARGIN + 9;
            doc.text(section.name, nameX, rowY + 0.8);
            var leaderStart = nameX + doc.getTextWidth(section.name) + 4;
            var pageX = page.width - MARGIN;
            doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
            doc.setLineWidth(0.2);
            if (leaderStart < pageX - 12) doc.line(leaderStart, rowY - 0.7, pageX - 12, rowY - 0.7);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            setText(doc, C.accent);
            doc.text(String(section.page).padStart(2, '0'), pageX, rowY + 0.8, { align: 'right' });
            setText(doc, C.ink);
            rowY += 14;
        });
        addFooter(doc, 2, totalPages);
    }

    function addSectionDivider(doc, section, sectionIndex, pageNumber, totalPages) {
        var page = size(doc);
        fillPage(doc, C.paper);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setCharSpace(1.2);
        setText(doc, C.accent);
        doc.text('SECCIÓN ' + String(sectionIndex).padStart(2, '0'), MARGIN, 29);
        doc.setCharSpace(0);

        doc.setFont('times', 'bold');
        doc.setFontSize(31);
        setText(doc, C.ink);
        var titleLines = doc.splitTextToSize(section.name, page.width - MARGIN * 2);
        doc.text(titleLines, MARGIN, 113);

        doc.setDrawColor(C.accent[0], C.accent[1], C.accent[2]);
        doc.setLineWidth(0.8);
        doc.line(MARGIN, 127, MARGIN + 27, 127);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        setText(doc, C.muted);
        doc.text(String(section.count).padStart(2, '0') + (section.count === 1 ? ' obra' : ' obras'), MARGIN, 140);

        doc.setFont('times', 'bold');
        doc.setFontSize(92);
        setText(doc, C.watermark);
        doc.text(String(sectionIndex).padStart(2, '0'), page.width - MARGIN, page.height - 36, { align: 'right' });
        setText(doc, C.ink);
        addFooter(doc, pageNumber, totalPages);
    }

    function beginArtworkPage(doc, category, pageNumber, totalPages) {
        var page = size(doc);
        fillPage(doc, [255, 255, 255]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setCharSpace(0.8);
        setText(doc, C.muted);
        doc.text('DIEGO DE ADURIZ  /  CATÁLOGO', MARGIN, 14);
        doc.setCharSpace(0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(String(pageNumber).padStart(2, '0') + ' / ' + String(totalPages).padStart(2, '0'), page.width - MARGIN, 14, { align: 'right' });
        doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
        doc.setLineWidth(0.25);
        doc.line(MARGIN, 19, page.width - MARGIN, 19);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setCharSpace(0.7);
        setText(doc, C.accent);
        doc.text(String(category || 'OBRA').toUpperCase(), MARGIN, 29);
        doc.setCharSpace(0);

        var area = { x: MARGIN, y: 35, width: page.width - MARGIN * 2, height: 163 };
        addImageFrame(doc, area.x, area.y, area.width, area.height);
        return area;
    }

    function addImageFrame(doc, x, y, width, height) {
        doc.setFillColor(C.panel[0], C.panel[1], C.panel[2]);
        doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
        doc.setLineWidth(0.25);
        doc.rect(x, y, width, height, 'FD');
    }

    function addImageLabel(doc, label, centerX, y) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setCharSpace(0.7);
        setText(doc, C.muted);
        doc.text(label, centerX, y, { align: 'center' });
        doc.setCharSpace(0);
    }

    function addArtworkDetails(doc, artwork, category, pageNumber, totalPages) {
        var page = size(doc);
        var left = MARGIN;
        var right = page.width - MARGIN;
        var labelGap = 4;
        var titleY = 221;
        doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
        doc.setLineWidth(0.35);
        doc.line(left, 211, right, 211);

        doc.setFont('times', 'bold');
        var titleSize = 17;
        var titleLines;
        do {
            doc.setFontSize(titleSize);
            titleLines = doc.splitTextToSize(artwork.title || 'Obra sin título', right - left);
            if (titleLines.length <= 2 || titleSize <= 12) break;
            titleSize -= 1;
        } while (titleSize >= 12);
        setText(doc, C.ink);
        doc.text(titleLines.slice(0, 2), left, titleY);

        var infoY = titleY + Math.max(1, Math.min(titleLines.length, 2)) * 8 + 2;
        var rightX = left + (right - left) / 2 + 5;
        var details = [
            { label: 'TÉCNICA', value: artwork.technique || 'No especificada', x: left, y: infoY, width: rightX - left - 9 },
            { label: 'DIMENSIONES', value: artwork.dimensions || 'No especificadas', x: rightX, y: infoY, width: right - rightX },
            { label: 'AÑO', value: artwork.year && artwork.year !== 'Consultar año' ? String(artwork.year) : 'No especificado', x: left, y: infoY + 14, width: rightX - left - 9 },
            { label: 'PRECIO', value: artwork.price || 'Consultar', x: rightX, y: infoY + 14, width: right - rightX }
        ];
        details.forEach(function (detail) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.setCharSpace(0.5);
            setText(doc, C.muted);
            doc.text(detail.label, detail.x, detail.y);
            doc.setCharSpace(0);
            doc.setFont('helvetica', detail.label === 'PRECIO' ? 'bold' : 'normal');
            doc.setFontSize(detail.label === 'PRECIO' ? 10 : 8.5);
            setText(doc, detail.label === 'PRECIO' ? C.accent : C.ink);
            var valueLines = doc.splitTextToSize(String(detail.value), detail.width);
            doc.text(valueLines.slice(0, 2), detail.x, detail.y + labelGap);
        });
        addFooter(doc, pageNumber, totalPages);
    }

    global.DDACatalogPdfDesign = {
        addCover: addCover,
        addContents: addContents,
        addSectionDivider: addSectionDivider,
        beginArtworkPage: beginArtworkPage,
        addImageFrame: addImageFrame,
        addImageLabel: addImageLabel,
        addArtworkDetails: addArtworkDetails,
        addFooter: addFooter
    };
})(window);
