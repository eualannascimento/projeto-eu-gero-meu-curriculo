/**
 * Datas estruturadas mes/ano e formatacao para preview/export.
 */
const EuGeroDates = (function () {
  'use strict';

  const MONTHS = [
    { v: '01', l: 'Jan' }, { v: '02', l: 'Fev' }, { v: '03', l: 'Mar' },
    { v: '04', l: 'Abr' }, { v: '05', l: 'Mai' }, { v: '06', l: 'Jun' },
    { v: '07', l: 'Jul' }, { v: '08', l: 'Ago' }, { v: '09', l: 'Set' },
    { v: '10', l: 'Out' }, { v: '11', l: 'Nov' }, { v: '12', l: 'Dez' }
  ];

  const MONTH_LABEL = Object.fromEntries(MONTHS.map(m => [m.v, m.l]));

  function isDateFieldKey(key) {
    return key === 'startDate' || key === 'endDate' || key === 'date';
  }

  function hasEndCurrentFlag(sectionId, fieldKey) {
    return fieldKey === 'endDate' && ['experiences', 'education', 'volunteering', 'organizations'].includes(sectionId);
  }

  function parseStoredDate(value) {
    if (!value || typeof value !== 'string') return { month: '', year: '' };
    const trimmed = value.trim();
    const iso = trimmed.match(/^(\d{4})-(\d{2})$/);
    if (iso) return { month: iso[2], year: iso[1] };

    const slash = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
    if (slash) return { month: slash[1].padStart(2, '0'), year: slash[2] };

    const yearOnly = trimmed.match(/^(\d{4})$/);
    if (yearOnly) return { month: '', year: yearOnly[1] };

    return { month: '', year: '', legacy: trimmed };
  }

  function serializeDate(month, year) {
    if (!year) return '';
    const m = month ? month.padStart(2, '0') : '01';
    return `${year}-${m}`;
  }

  function formatDisplayDate(value, isCurrent) {
    if (isCurrent) return 'Atual';
    if (!value || !String(value).trim()) return '';
    const parsed = parseStoredDate(value);
    if (parsed.legacy) return parsed.legacy;
    if (!parsed.year) return '';
    if (parsed.month && MONTH_LABEL[parsed.month]) {
      return `${MONTH_LABEL[parsed.month]} ${parsed.year}`;
    }
    return parsed.year;
  }

  function formatPeriod(start, end, isCurrent) {
    const s = formatDisplayDate(start, false);
    const e = isCurrent ? 'Atual' : formatDisplayDate(end, false);
    if (!s && !e) return '';
    if (!e) return s;
    if (!s) return e;
    return `${s} - ${e}`;
  }

  function monthOptions(selected) {
    return `<option value="">Mês</option>${MONTHS.map(m =>
      `<option value="${m.v}" ${selected === m.v ? 'selected' : ''}>${m.l}</option>`
    ).join('')}`;
  }

  function yearOptions(selected, from = 1970, to = new Date().getFullYear() + 2) {
    let html = '<option value="">Ano</option>';
    for (let y = to; y >= from; y--) {
      html += `<option value="${y}" ${String(selected) === String(y) ? 'selected' : ''}>${y}</option>`;
    }
    return html;
  }

  return {
    MONTHS,
    isDateFieldKey,
    hasEndCurrentFlag,
    parseStoredDate,
    serializeDate,
    formatDisplayDate,
    formatPeriod,
    monthOptions,
    yearOptions
  };
})();
