/**
 * Validacao inline de campos - modulo puro.
 */
const EuGeroValidation = (function () {
  'use strict';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const URL_RE = /^https?:\/\/.+/i;

  function isEmpty(value) {
    if (value == null) return true;
    return String(value).trim().length === 0;
  }

  function validateEmail(value) {
    if (isEmpty(value)) return { ok: false, message: 'Informe um e-mail.' };
    if (!EMAIL_RE.test(value.trim())) return { ok: false, message: 'Formato de e-mail invalido.' };
    return { ok: true, message: '' };
  }

  function validateUrl(value) {
    if (isEmpty(value)) return { ok: true, message: '' };
    const v = value.trim();
    if (!URL_RE.test(v)) return { ok: false, message: 'URL deve comecar com http:// ou https://' };
    try {
      new URL(v);
      return { ok: true, message: '' };
    } catch (e) {
      return { ok: false, message: 'URL invalida.' };
    }
  }

  function validateRequired(value, label) {
    if (isEmpty(value)) return { ok: false, message: `${label} e obrigatorio.` };
    return { ok: true, message: '' };
  }

  function validateField(value, field) {
    if (field.required && isEmpty(value)) {
      return { ok: false, message: `${field.label} e obrigatorio.` };
    }
    if (isEmpty(value)) return { ok: true, message: '' };

    if (field.type === 'email') return validateEmail(value);
    if (field.type === 'url') return validateUrl(value);

    if (field.minLength && String(value).trim().length < field.minLength) {
      return { ok: false, message: `Minimo de ${field.minLength} caracteres.` };
    }

    return { ok: true, message: '' };
  }

  function validateSection(state, section) {
    const issues = [];

    if (section.list) {
      const items = state[section.id] || [];
      items.forEach((item, index) => {
        section.itemFields.forEach(field => {
          const value = item[field.key] || '';
          const result = validateField(value, field);
          if (!result.ok) {
            issues.push({
              sectionId: section.id,
              itemIndex: index,
              fieldKey: field.key,
              label: field.label,
              message: result.message,
              displayName: items.length > 1
                ? `${field.label} (${section.title} #${index + 1})`
                : `${field.label} (${section.title})`
            });
          }
        });
      });
    } else if (section.fields) {
      section.fields.forEach(field => {
        let value = '';
        if (section.id === 'personal') value = (state.personal || {})[field.key] || '';
        else if (section.id === 'summary') value = state.summary || '';
        else if (section.id === 'skills') {
          value = state.skillsText || (typeof EuGeroConfig !== 'undefined' ? EuGeroConfig.skillsToText(state) : '');
        } else value = state[field.key] || '';

        const result = validateField(value, field);
        if (!result.ok) {
          issues.push({
            sectionId: section.id,
            itemIndex: null,
            fieldKey: field.key,
            label: field.label,
            message: result.message,
            displayName: `${field.label} (${section.title})`
          });
        }
      });
    }

    return { valid: issues.length === 0, issues };
  }

  function resolveStepAdvance(isValid, currentStep, totalSteps) {
    if (!isValid) {
      return { action: 'stay', step: currentStep };
    }
    if (currentStep < totalSteps - 1) {
      return { action: 'advance', step: currentStep + 1 };
    }
    return { action: 'review', step: currentStep };
  }

  return {
    validateEmail,
    validateUrl,
    validateField,
    validateSection,
    isEmpty,
    resolveStepAdvance
  };
})();
