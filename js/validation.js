/**
 * Validacao inline de campos - modulo puro.
 */
const EuGeroValidation = (function () {
  'use strict';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  function isEmpty(value) {
    if (value == null) return true;
    return String(value).trim().length === 0;
  }

  function validateEmail(value) {
    if (isEmpty(value)) return { ok: false, message: 'Informe um e-mail.' };
    if (!EMAIL_RE.test(String(value).trim())) return { ok: false, message: 'Formato de e-mail invalido.' };
    return { ok: true, message: '' };
  }

  function validateUrl(value) {
    if (isEmpty(value)) return { ok: true, message: '', value: '' };
    const normalized = EuGeroUtils.safeUrl(value);
    if (!normalized) return { ok: false, message: 'URL invalida.', value: '' };
    return { ok: true, message: '', value: normalized };
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

  function validateSectionIssues(state, section) {
    const issues = [];
    const safeState = state && typeof state === 'object' ? state : {};

    if (section.list) {
      const items = Array.isArray(safeState[section.id]) ? safeState[section.id] : [];
      items.forEach((item, index) => {
        section.itemFields.forEach(field => {
          const value = item && typeof item === 'object' ? item[field.key] ?? '' : '';
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
        let value;
        if (section.id === 'personal') value = (safeState.personal || {})[field.key] || '';
        else if (section.id === 'summary') value = safeState.summary || '';
        else if (section.id === 'skills') {
          value = safeState.skillsText || (typeof EuGeroConfig !== 'undefined' ? EuGeroConfig.skillsToText(safeState) : '');
        } else value = safeState[field.key] || '';

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

    return issues;
  }

  function validateSection(state, section) {
    if (!section || typeof section !== 'object') return { valid: true, issues: [] };
    const issues = validateSectionIssues(state, section);
    return { valid: issues.length === 0, issues };
  }

  function validateResume(state, sections) {
    const activeSections = Array.isArray(sections)
      ? sections
      : (typeof EuGeroConfig !== 'undefined'
        ? EuGeroConfig.getActiveSections(state?.enabledSections)
        : []);
    const issues = activeSections.flatMap((section, stepIndex) => validateSectionIssues(state, section)
      .map((issue) => ({
        ...issue,
        itemId: issue.itemIndex == null ? section.id : `${section.id}-${issue.itemIndex}`,
        field: issue.fieldKey,
        sectionId: section.id,
        sectionTitle: section.title,
        stepIndex
      })));
    return { valid: issues.length === 0, issues, firstIssue: issues[0] || null };
  }

  function getWizardErrorTarget(error) {
    const itemMatch = String(error?.itemId || '').match(/^(.*)-(\d+)$/);
    const itemIndex = itemMatch ? Number(itemMatch[2]) : null;
    const itemId = String(error?.itemId || '');
    return {
      itemIndex,
      fieldId: `field-${itemId}-${error?.field || ''}`,
      summaryHref: `#field-${itemId}-${error?.field || ''}`
    };
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
    validateResume,
    getWizardErrorTarget,
    isEmpty,
    resolveStepAdvance
  };
})();
