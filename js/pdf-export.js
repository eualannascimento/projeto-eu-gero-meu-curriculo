/**
 * Geracao de PDF real (download direto, sem dialogo de impressao) via jsPDF
 * vendorizado (js/vendor/jspdf.umd.min.js + js/vendor/fonts-barlow.js).
 * Cobre as 5 familias estruturais de layout (Regra 02 do spec
 * feat-download-pdf-real.md): centered, left, sidebar, banner, creative.
 */
const EuGeroPdfExport = (function () {
  'use strict';

  const MARGIN_MM = { estreita: 12, padrao: 16, confortavel: 20 };
  const DENSITY = {
    normal: { fontPt: 10.5, lineHeightMult: 1.35 },
    condensado: { fontPt: 10, lineHeightMult: 1.2 }
  };
  const PAGE_W = 210;
  const PAGE_H = 297;
  const PT_TO_MM = 25.4 / 72;

  function getJsPDF() {
    const ns = (typeof window !== 'undefined' && window.jspdf)
      || (typeof globalThis !== 'undefined' && globalThis.jspdf);
    if (!ns || !ns.jsPDF) {
      throw new Error('jsPDF nao carregado. Inclua js/vendor/jspdf.umd.min.js antes de gerar o PDF.');
    }
    return ns.jsPDF;
  }

  // ---- Cor: deriva a familia de acento (accent/700/900/100) a partir do
  // thumbAccent do template (unica cor exposta em js/config.js). ----
  function hexToRgb(hex) {
    const clean = (hex || '#334155').replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function mix(rgb, target, amount) {
    return rgb.map((c, i) => Math.round(c + (target[i] - c) * amount));
  }

  function accentPalette(hex) {
    const accent = hexToRgb(hex);
    return {
      accent,
      accent700: mix(accent, [0, 0, 0], 0.28),
      accent900: mix(accent, [0, 0, 0], 0.5),
      accent100: mix(accent, [255, 255, 255], 0.9)
    };
  }

  function registerFonts(doc) {
    if (typeof EuGeroPdfFonts !== 'undefined' && EuGeroPdfFonts.register) {
      EuGeroPdfFonts.register(doc);
      return true;
    }
    return false;
  }

  // ---- Estrutura de dados do conteudo (independente de HTML), espelhando
  // as secoes que js/preview.js renderiza. ----
  function formatPeriod(start, end, isCurrent) {
    if (typeof EuGeroDates !== 'undefined') return EuGeroDates.formatPeriod(start, end, isCurrent);
    if (!start && !end) return '';
    return `${start || ''}${start && end ? ' - ' : ''}${isCurrent ? 'Atual' : (end || '')}`;
  }

  function textBlock(text) {
    return text ? [{ type: 'text', text }] : [];
  }

  function itemBlocks(items, mapper) {
    return (items || []).map(mapper);
  }

  function buildSectionsData(state, enabledSections) {
    const p = state.personal || {};
    const enabled = enabledSections || EuGeroConfig.getActiveSections(state.enabledSections);
    const enabledSet = new Set(enabled.map((s) => s.id));
    const sections = [];

    if (enabledSet.has('summary') && state.summary?.trim()) {
      sections.push({ id: 'summary', title: 'Resumo', blocks: textBlock(state.summary.trim()) });
    }

    if (enabledSet.has('experiences') && (state.experiences || []).some((e) => e.company || e.title || e.description)) {
      const items = state.experiences.filter((e) => e.company || e.title);
      sections.push({
        id: 'experiences',
        title: 'Experiência',
        blocks: itemBlocks(items, (e) => ({
          type: 'item',
          title: e.title || 'Cargo',
          sub: e.company || '',
          period: e.period || formatPeriod(e.startDate, e.endDate, e.endCurrent),
          desc: e.description || ''
        }))
      });
    }

    if (enabledSet.has('education') && (state.education || []).some((e) => e.institution || e.degree)) {
      const items = state.education.filter((e) => e.institution || e.degree);
      sections.push({
        id: 'education',
        title: 'Formação',
        blocks: itemBlocks(items, (e) => ({
          type: 'item',
          title: e.degree || 'Curso',
          sub: e.institution || '',
          period: e.period || formatPeriod(e.startDate, e.endDate),
          desc: ''
        }))
      });
    }

    const skills = EuGeroConfig.getSkillsFromState(state);
    if (enabledSet.has('skills') && skills.length) {
      sections.push({ id: 'skills', title: 'Habilidades', blocks: textBlock(skills.map((s) => s.name || s).join('  ·  ')) });
    }

    if (enabledSet.has('languages') && (state.languages || []).some((l) => l.language?.trim?.())) {
      const line = state.languages.filter((l) => l.language)
        .map((l) => `${l.language}${l.level ? ` (${l.level})` : ''}`).join('  ·  ');
      sections.push({ id: 'languages', title: 'Idiomas', blocks: textBlock(line) });
    }

    const listSection = (id, title, items, keys, mapper) => {
      const filtered = (items || []).filter((item) => keys.some((k) => item[k]?.trim?.()));
      if (enabledSet.has(id) && filtered.length) {
        sections.push({ id, title, blocks: itemBlocks(filtered, mapper) });
      }
    };

    listSection('certifications', 'Certificados', state.certifications, ['name'], (c) => ({
      type: 'item', title: c.name, sub: `${c.issuer || ''}${(c.year || c.date) ? ` · ${c.year || c.date}` : ''}`, period: '', desc: ''
    }));
    listSection('projects', 'Projetos', state.projects, ['name'], (p2) => ({
      type: 'item', title: p2.name, sub: '', period: '', desc: p2.description || ''
    }));
    listSection('volunteering', 'Voluntariado', state.volunteering, ['organization'], (v) => ({
      type: 'item', title: `${v.role || 'Função'} · ${v.organization}`, sub: '', period: formatPeriod(v.startDate, v.endDate, v.endCurrent), desc: ''
    }));
    listSection('publications', 'Publicações', state.publications, ['title'], (pub) => ({
      type: 'item', title: pub.title, sub: pub.publisher || '', period: '', desc: ''
    }));
    listSection('awards', 'Prêmios e Honrarias', state.awards, ['title'], (a) => ({
      type: 'item', title: `${a.title} · ${a.issuer || ''}`, sub: '', period: '', desc: ''
    }));
    listSection('organizations', 'Organizações', state.organizations, ['name'], (o) => ({
      type: 'item', title: `${o.name} · ${o.role || ''}`, sub: '', period: '', desc: ''
    }));
    listSection('courses', 'Cursos', state.courses, ['name'], (c) => ({
      type: 'item', title: c.name, sub: c.institution || '', period: '', desc: ''
    }));

    return { personal: p, sections };
  }

  // ---- Helpers de desenho (paginacao, texto, cabecalhos de secao) ----
  function makeCursor(doc, margin) {
    return { x: margin, y: margin, margin, colWidth: PAGE_W - margin * 2 };
  }

  function ensureSpace(doc, cursor, heightMm) {
    if (cursor.y + heightMm > PAGE_H - cursor.margin) {
      doc.addPage();
      cursor.y = cursor.margin;
    }
  }

  function setFont(doc, family, style, sizePt, hasFonts) {
    if (hasFonts && (family === 'Barlow' || family === 'BarlowCondensed')) {
      doc.setFont(family, style === 'bold' ? 'bold' : 'normal');
    } else {
      doc.setFont('helvetica', style === 'bold' ? 'bold' : 'normal');
    }
    doc.setFontSize(sizePt);
  }

  function drawWrappedText(doc, cursor, text, x, width, sizePt, lineHeightMult, color) {
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, width);
    const lineHeightMm = sizePt * PT_TO_MM * lineHeightMult;
    lines.forEach((line) => {
      ensureSpace(doc, cursor, lineHeightMm);
      doc.text(line, x, cursor.y + sizePt * PT_TO_MM * 0.8);
      cursor.y += lineHeightMm;
    });
  }

  function drawSectionHeading(doc, cursor, title, x, width, palette, density, hasFonts, skipDivider) {
    ensureSpace(doc, cursor, 8);
    cursor.y += 3;
    setFont(doc, 'BarlowCondensed', 'bold', density.fontPt + 1.5, hasFonts);
    doc.setTextColor(palette.accent700[0], palette.accent700[1], palette.accent700[2]);
    doc.text(title.toUpperCase(), x, cursor.y);
    cursor.y += 2.5;
    if (!skipDivider) {
      doc.setDrawColor(224, 224, 227);
      doc.line(x, cursor.y, x + width, cursor.y);
    }
    cursor.y += 3;
    setFont(doc, 'Barlow', 'normal', density.fontPt, hasFonts);
  }

  function drawBlocks(doc, cursor, blocks, x, width, palette, density, hasFonts) {
    blocks.forEach((block) => {
      if (block.type === 'text') {
        setFont(doc, 'Barlow', 'normal', density.fontPt, hasFonts);
        drawWrappedText(doc, cursor, block.text, x, width, density.fontPt, density.lineHeightMult, [58, 60, 62]);
        cursor.y += 1.5;
        return;
      }
      ensureSpace(doc, cursor, 6);
      setFont(doc, 'BarlowCondensed', 'bold', density.fontPt + 1.5, hasFonts);
      doc.setTextColor(palette.accent900[0], palette.accent900[1], palette.accent900[2]);
      doc.text(block.title, x, cursor.y);
      if (block.period) {
        setFont(doc, 'Barlow', 'normal', density.fontPt - 0.5, hasFonts);
        doc.setTextColor(107, 109, 111);
        const larguraTitulo = doc.getTextWidth(block.title);
        const larguraPeriodo = doc.getTextWidth(block.period);
        const cabemNaMesmaLinha = (larguraTitulo + larguraPeriodo + 4) <= width;
        if (cabemNaMesmaLinha) {
          doc.text(block.period, x + width, cursor.y, { align: 'right' });
          cursor.y += density.fontPt * PT_TO_MM * 1.3;
        } else {
          cursor.y += density.fontPt * PT_TO_MM * 1.3;
          doc.text(block.period, x + 3, cursor.y);
          cursor.y += density.fontPt * PT_TO_MM * 1.3;
        }
      } else {
        cursor.y += density.fontPt * PT_TO_MM * 1.3;
      }
      if (block.sub) {
        setFont(doc, 'Barlow', 'normal', density.fontPt, hasFonts);
        doc.setTextColor(palette.accent700[0], palette.accent700[1], palette.accent700[2]);
        doc.text(block.sub, x, cursor.y);
        cursor.y += density.fontPt * PT_TO_MM * 1.3;
      }
      if (block.desc) {
        drawWrappedText(doc, cursor, block.desc, x, width, density.fontPt, density.lineHeightMult, [58, 60, 62]);
      }
      cursor.y += 3;
    });
  }

  function contactLine(personal) {
    return [personal.email, personal.phone, personal.location].filter(Boolean).join('   ·   ');
  }

  // ---- Layouts (5 familias estruturais) ----
  function layoutCentered(doc, data, palette, margin, density, hasFonts) {
    const cursor = makeCursor(doc, margin);
    const { personal, sections } = data;
    setFont(doc, 'BarlowCondensed', 'bold', 24, hasFonts);
    doc.setTextColor(26, 26, 46);
    doc.text((personal.fullName || 'Seu Nome').toUpperCase(), PAGE_W / 2, cursor.y + 8, { align: 'center' });
    cursor.y += 13;
    setFont(doc, 'Barlow', 'normal', density.fontPt + 1, hasFonts);
    doc.setTextColor(palette.accent700[0], palette.accent700[1], palette.accent700[2]);
    doc.text((personal.headline || 'Título profissional').toUpperCase(), PAGE_W / 2, cursor.y, { align: 'center' });
    cursor.y += 6;
    setFont(doc, 'Barlow', 'normal', density.fontPt - 0.5, hasFonts);
    doc.setTextColor(107, 109, 111);
    doc.text(contactLine(personal) || 'e-mail · telefone · cidade', PAGE_W / 2, cursor.y, { align: 'center' });
    cursor.y += 5;
    doc.setDrawColor(224, 224, 227);
    doc.line(margin, cursor.y, PAGE_W - margin, cursor.y);
    cursor.y += 8;

    sections.forEach((s) => {
      drawSectionHeading(doc, cursor, s.title, margin, cursor.colWidth, palette, density, hasFonts);
      drawBlocks(doc, cursor, s.blocks, margin, cursor.colWidth, palette, density, hasFonts);
    });
  }

  function layoutLeft(doc, data, palette, margin, density, hasFonts) {
    const cursor = makeCursor(doc, margin);
    const { personal, sections } = data;
    setFont(doc, 'BarlowCondensed', 'bold', 26, hasFonts);
    doc.setTextColor(26, 26, 46);
    doc.text(personal.fullName || 'Seu Nome', margin, cursor.y + 8);
    cursor.y += 13;
    setFont(doc, 'Barlow', 'normal', density.fontPt + 1, hasFonts);
    doc.setTextColor(107, 109, 111);
    doc.text(personal.headline || 'Título profissional', margin, cursor.y);
    cursor.y += 6;
    setFont(doc, 'Barlow', 'normal', density.fontPt - 0.5, hasFonts);
    doc.text(contactLine(personal) || 'contato@email.com · cidade', margin, cursor.y);
    cursor.y += 9;

    sections.forEach((s) => {
      drawSectionHeading(doc, cursor, s.title, margin, cursor.colWidth, palette, density, hasFonts);
      drawBlocks(doc, cursor, s.blocks, margin, cursor.colWidth, palette, density, hasFonts);
    });
  }

  function layoutBanner(doc, data, palette, margin, density, hasFonts) {
    const { personal, sections } = data;
    doc.setFillColor(palette.accent900[0], palette.accent900[1], palette.accent900[2]);
    const bannerH = 32;
    doc.rect(0, 0, PAGE_W, bannerH, 'F');
    setFont(doc, 'BarlowCondensed', 'bold', 22, hasFonts);
    doc.setTextColor(238, 244, 250);
    doc.text((personal.fullName || 'Seu Nome').toUpperCase(), margin, 14);
    setFont(doc, 'Barlow', 'normal', density.fontPt + 1, hasFonts);
    doc.setTextColor(185, 205, 224);
    doc.text((personal.headline || 'Título profissional').toUpperCase(), margin, 21);
    setFont(doc, 'Barlow', 'normal', density.fontPt - 0.5, hasFonts);
    doc.setTextColor(159, 182, 205);
    doc.text(contactLine(personal), margin, 27);

    const cursor = makeCursor(doc, margin);
    cursor.y = bannerH + 10;
    sections.forEach((s) => {
      drawSectionHeading(doc, cursor, s.title, margin, cursor.colWidth, palette, density, hasFonts);
      drawBlocks(doc, cursor, s.blocks, margin, cursor.colWidth, palette, density, hasFonts);
    });
  }

  function layoutSidebar(doc, data, palette, margin, density, hasFonts) {
    const { personal, sections } = data;
    const sidebarW = PAGE_W * 0.38;
    doc.setFillColor(palette.accent100[0], palette.accent100[1], palette.accent100[2]);
    doc.rect(0, 0, sidebarW, PAGE_H, 'F');

    const sideCursor = { x: margin, y: margin, margin, colWidth: sidebarW - margin * 1.4 };
    setFont(doc, 'BarlowCondensed', 'bold', 18, hasFonts);
    doc.setTextColor(palette.accent900[0], palette.accent900[1], palette.accent900[2]);
    const nameLines = doc.splitTextToSize((personal.fullName || 'Seu Nome').toUpperCase(), sideCursor.colWidth);
    nameLines.forEach((line) => { doc.text(line, sideCursor.x, sideCursor.y); sideCursor.y += 7; });
    sideCursor.y += 1;
    setFont(doc, 'Barlow', 'normal', density.fontPt - 0.5, hasFonts);
    doc.setTextColor(palette.accent700[0], palette.accent700[1], palette.accent700[2]);
    drawWrappedText(doc, sideCursor, (personal.headline || 'Título profissional').toUpperCase(), sideCursor.x, sideCursor.colWidth, density.fontPt - 0.5, 1.3, palette.accent700);
    sideCursor.y += 4;

    setFont(doc, 'BarlowCondensed', 'bold', density.fontPt, hasFonts);
    doc.setTextColor(palette.accent700[0], palette.accent700[1], palette.accent700[2]);
    doc.text('CONTATO', sideCursor.x, sideCursor.y);
    sideCursor.y += 5;
    setFont(doc, 'Barlow', 'normal', density.fontPt - 1, hasFonts);
    doc.setTextColor(58, 60, 62);
    [personal.email, personal.phone, personal.location].filter(Boolean).forEach((line) => {
      drawWrappedText(doc, sideCursor, line, sideCursor.x, sideCursor.colWidth, density.fontPt - 1, 1.3, [58, 60, 62]);
    });
    if (personal.linkedinUrl) {
      drawWrappedText(doc, sideCursor, personal.linkedinUrl, sideCursor.x, sideCursor.colWidth, density.fontPt - 1, 1.3, [58, 60, 62]);
    }
    sideCursor.y += 4;

    const skills = EuGeroConfig.getSkillsFromState(data.state || {});
    const sidebarSectionIds = new Set(['skills', 'languages']);
    const mainSections = data.sections.filter((s) => !sidebarSectionIds.has(s.id));
    const skillsSection = data.sections.find((s) => s.id === 'skills');
    const languagesSection = data.sections.find((s) => s.id === 'languages');

    [skillsSection, languagesSection].filter(Boolean).forEach((s) => {
      setFont(doc, 'BarlowCondensed', 'bold', density.fontPt, hasFonts);
      doc.setTextColor(palette.accent700[0], palette.accent700[1], palette.accent700[2]);
      doc.text(s.title.toUpperCase(), sideCursor.x, sideCursor.y);
      sideCursor.y += 5;
      setFont(doc, 'Barlow', 'normal', density.fontPt - 1, hasFonts);
      doc.setTextColor(58, 60, 62);
      s.blocks.forEach((b) => {
        drawWrappedText(doc, sideCursor, b.text, sideCursor.x, sideCursor.colWidth, density.fontPt - 1, 1.3, [58, 60, 62]);
      });
      sideCursor.y += 4;
    });

    const mainCursor = { x: sidebarW + margin, y: margin, margin, colWidth: PAGE_W - sidebarW - margin * 1.6 };
    mainSections.forEach((s) => {
      drawSectionHeading(doc, mainCursor, s.title, mainCursor.x, mainCursor.colWidth, palette, density, hasFonts);
      drawBlocks(doc, mainCursor, s.blocks, mainCursor.x, mainCursor.colWidth, palette, density, hasFonts);
    });
  }

  function layoutCreative(doc, data, palette, margin, density, hasFonts) {
    const { personal, sections } = data;
    const cursor = makeCursor(doc, margin);
    const badgeSize = 16;
    doc.setFillColor(palette.accent[0], palette.accent[1], palette.accent[2]);
    doc.rect(margin, cursor.y, badgeSize, badgeSize, 'F');
    const initials = (personal.fullName || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'SN';
    setFont(doc, 'BarlowCondensed', 'bold', 16, hasFonts);
    doc.setTextColor(255, 255, 255);
    doc.text(initials, margin + badgeSize / 2, cursor.y + badgeSize / 2 + 2, { align: 'center' });

    const textX = margin + badgeSize + 6;
    const textW = cursor.colWidth - badgeSize - 6;
    setFont(doc, 'BarlowCondensed', 'bold', 18, hasFonts);
    doc.setTextColor(26, 26, 46);
    doc.text((personal.fullName || 'Seu Nome').toUpperCase(), textX, cursor.y + 6);
    setFont(doc, 'Barlow', 'normal', density.fontPt, hasFonts);
    doc.setTextColor(palette.accent700[0], palette.accent700[1], palette.accent700[2]);
    doc.text((personal.headline || 'Título profissional').toUpperCase(), textX, cursor.y + 11);
    setFont(doc, 'Barlow', 'normal', density.fontPt - 0.5, hasFonts);
    doc.setTextColor(107, 109, 111);
    doc.text(contactLine(personal), textX, cursor.y + 16, { maxWidth: textW });

    cursor.y += badgeSize + 8;
    sections.forEach((s) => {
      drawSectionHeading(doc, cursor, s.title, margin, cursor.colWidth, palette, density, hasFonts);
      drawBlocks(doc, cursor, s.blocks, margin, cursor.colWidth, palette, density, hasFonts);
    });
  }

  const LAYOUTS = {
    centered: layoutCentered,
    left: layoutLeft,
    banner: layoutBanner,
    sidebar: layoutSidebar,
    creative: layoutCreative
  };

  function generatePdf(state, enabledSections, templateId, marginKey, densityKey) {
    const JSPDF = getJsPDF();
    const doc = new JSPDF({ unit: 'mm', format: 'a4', compress: true });
    const hasFonts = registerFonts(doc);
    setFont(doc, 'Barlow', 'normal', 10.5, hasFonts);

    const meta = EuGeroConfig.getTemplateMeta(templateId);
    const palette = accentPalette(meta.thumbAccent);
    const margin = MARGIN_MM[marginKey] || MARGIN_MM.padrao;
    const density = DENSITY[densityKey] || DENSITY.normal;
    const data = buildSectionsData(state, enabledSections);
    data.state = state;

    const layoutFn = LAYOUTS[meta.layout] || LAYOUTS.centered;
    layoutFn(doc, data, palette, margin, density, hasFonts);

    return doc;
  }

  return {
    generatePdf,
    buildSectionsData,
    accentPalette,
    drawSectionHeading,
    drawBlocks
  };
})();
