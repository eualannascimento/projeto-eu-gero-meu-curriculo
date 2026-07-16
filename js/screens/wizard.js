/**
 * Tela do wizard: renderização de campos, timeline, listas e validação.
 * Recebe o contexto compartilhado do app via init(ctx).
 */
const EuGeroWizardScreen = (function () {
  'use strict';

  const {
    SECTIONS, ACTION_VERBS, createEmptyListItem, skillsToText, SHORT_LABELS
  } = EuGeroConfig;

  let ctx = null;

  function init(context) {
    ctx = context;
  }

  function clearCurrentSection(section) {
    if (!section) return;
    const state = ctx.getState();
    if (section.id === 'personal') {
      state.personal = { fullName: '', headline: '', email: '', phone: '', location: '', linkedinUrl: '' };
    } else if (section.id === 'summary') {
      state.summary = '';
    } else if (section.id === 'skills') {
      state.skillsText = '';
      state.skills = [];
    } else if (section.list) {
      state[section.id] = [];
    }
    ctx.saveState();
    renderWizardStep();
    ctx.debouncedUpdatePreviews();
    ctx.showToast(`Seção "${SHORT_LABELS[section.id] || section.title}" limpa.`);
  }

  function renderWizardTimeline() {
    const state = ctx.getState();
    const els = ctx.els;
    if (!els.wizardTimeline) return;
    const sections = ctx.activeSections();
    els.wizardTimeline.innerHTML = sections.map((section, i) => {
      const label = SHORT_LABELS[section.id] || section.title;
      const isActive = i === state.currentStep;
      const isDone = i < state.currentStep;
      const cls = `timeline-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`;
      const ariaCurrent = isActive ? ' aria-current="step"' : '';
      return `
        <button type="button" class="${cls}" data-step="${i}" title="${ctx.escapeAttr(section.title)}" aria-label="Etapa ${i + 1}: ${ctx.escapeAttr(label)}"${ariaCurrent}>
          <span class="timeline-step-num">${i + 1}</span><span class="timeline-step-label">${ctx.escapeHtml(label)}</span>
        </button>
      `;
    }).join('');

    els.wizardTimeline.querySelectorAll('.timeline-step').forEach((btn) => {
      btn.addEventListener('click', () => ctx.goToStep(parseInt(btn.dataset.step, 10)));
    });

    const activeBtn = els.wizardTimeline.querySelector('.timeline-step.active');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  function renderWizardStep() {
    const state = ctx.getState();
    const els = ctx.els;
    const sections = ctx.activeSections();
    const section = sections[state.currentStep];
    if (!section) {
      state.currentStep = 0;
      ctx.saveState();
      if (sections.length === 0) return;
      return renderWizardStep();
    }

    if (!els.wizardSteps) return;

    const titleEl = document.getElementById('wizard-step-title');
    const counterEl = document.getElementById('wizard-step-counter');
    const descEl = document.getElementById('wizard-step-desc');

    if (titleEl) titleEl.textContent = SHORT_LABELS[section.id] || section.title;
    if (counterEl) counterEl.textContent = `Etapa ${state.currentStep + 1} de ${sections.length}`;
    if (descEl) descEl.textContent = section.description || '';

    if (els.wizardProgress) {
      els.wizardProgress.textContent = `Etapa ${state.currentStep + 1} de ${sections.length}: ${section.title}`;
    }

    els.wizardSteps.innerHTML = '';
    const stepEl = document.createElement('div');
    stepEl.className = 'wizard-step';
    stepEl.dataset.sectionId = section.id;

    if (section.list) {
      stepEl.appendChild(renderListSection(section));
    } else if (section.fields) {
      const grid = document.createElement('div');
      grid.className = 'cv-form2';
      grid.style.marginTop = '16px';
      section.fields.forEach((field) => {
        grid.appendChild(renderField(section, field));
      });
      stepEl.appendChild(grid);
    }

    const actionsRow = document.createElement('div');
    actionsRow.style.cssText = 'margin-top: 30px; display: flex; flex-wrap: wrap; gap: 18px; align-items: center;';
    const mutedGhost = 'font-size: 13.5px; color: color-mix(in srgb, var(--color-text) 55%, transparent);';

    const aiBtn = document.createElement('button');
    aiBtn.type = 'button';
    aiBtn.className = 'btn btn-ghost btn-ai-section';
    aiBtn.style.cssText = mutedGhost;
    aiBtn.textContent = 'Travou? Peça ideias a uma IA →';
    aiBtn.addEventListener('click', (e) => ctx.showPrompt('section', section.id, e.currentTarget));
    actionsRow.appendChild(aiBtn);

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn btn-ghost';
    clearBtn.style.cssText = mutedGhost;
    clearBtn.textContent = 'Limpar esta seção';
    clearBtn.addEventListener('click', () => clearCurrentSection(section));
    actionsRow.appendChild(clearBtn);

    stepEl.appendChild(actionsRow);
    els.wizardSteps.appendChild(stepEl);

    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    if (prevBtn) {
      prevBtn.disabled = false;
      prevBtn.textContent = state.currentStep === 0 ? 'Configuração' : 'Anterior';
    }
    if (nextBtn) {
      nextBtn.textContent = state.currentStep === sections.length - 1 ? 'Revisar →' : 'Próximo';
    }

    renderWizardTimeline();
  }

  function fieldErrorId(section, field, index) {
    if (index != null) return `error-${section.id}-${index}-${field.key}`;
    return `error-${section.id}-${field.key}`;
  }

  function renderFieldTip(field) {
    if (!field.tip) return '';
    return `
      <span class="cv-help" tabindex="0" aria-label="Ajuda">?<span class="cv-tip-pop">${ctx.escapeHtml(field.tip)}</span></span>
    `;
  }

  function getFieldIdealMax(field) {
    if (field.idealMax) return field.idealMax;
    if (field.actionVerbs) {
      if (field.key === 'summary') return 550;
      return 260;
    }
    if (field.key === 'skillsText') return 180;
    return 120;
  }

  function renderCharCounter(wrap, field, getValue) {
    const idealMax = getFieldIdealMax(field);
    const counter = document.createElement('span');
    counter.className = 'char-counter';
    counter.setAttribute('aria-live', 'polite');
    const update = () => {
      const len = (getValue() || '').length;
      counter.textContent = `${len}/${idealMax}`;
      counter.classList.toggle('char-counter-over', len > idealMax);
    };
    update();
    wrap.appendChild(counter);
    return update;
  }

  function clearFieldValidation(scope) {
    scope.querySelectorAll('.field-invalid').forEach((el) => {
      el.classList.remove('field-invalid');
      el.removeAttribute('aria-describedby');
    });
    scope.querySelectorAll('.field-error').forEach((el) => el.remove());
  }

  function setFieldInvalid(input, errorId, message) {
    input.classList.add('field-invalid');
    input.setAttribute('aria-describedby', errorId);
    const err = document.createElement('span');
    err.id = errorId;
    err.className = 'field-error';
    err.setAttribute('role', 'alert');
    err.textContent = message;
    input.closest('.field-group')?.appendChild(err);
  }

  function validateCurrentStep() {
    const state = ctx.getState();
    const sections = ctx.activeSections();
    const section = sections[state.currentStep];
    if (!section) return true;

    const scope = ctx.els.wizardSteps;
    if (!scope) return true;

    clearFieldValidation(scope);
    const result = EuGeroValidation.validateSection(state, section);

    result.issues.forEach((issue) => {
      let input;
      if (issue.itemIndex != null) {
        const card = scope.querySelector(`.list-item-card[data-index="${issue.itemIndex}"]`);
        const fieldWrap = card?.querySelector(`[data-field="${issue.fieldKey}"]`);
        input = fieldWrap?.querySelector('input, textarea, select')
          || scope.querySelector(`#field-${issue.sectionId}-${issue.itemIndex}-${issue.fieldKey}`);
      } else {
        input = scope.querySelector(`#field-${issue.sectionId}-${issue.fieldKey}`)
          || scope.querySelector(`[data-field="${issue.fieldKey}"] input, [data-field="${issue.fieldKey}"] textarea, [data-field="${issue.fieldKey}"] select`);
      }
      if (input) {
        const errorId = fieldErrorId(section, { key: issue.fieldKey }, issue.itemIndex);
        setFieldInvalid(input, errorId, issue.message);
      }
    });

    if (!result.valid) {
      ctx.showToast('Revise os campos destacados antes de continuar.', { duration: 4000 });
      const firstInvalid = scope.querySelector('.field-invalid');
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid?.focus?.();
      return false;
    }
    return true;
  }

  function renderField(section, field, options = {}) {
    const wrap = document.createElement('label');
    wrap.className = 'field-group' + (field.fullWidth ? ' field-full' : '');
    wrap.style.display = 'block';
    if (field.fullWidth) wrap.style.gridColumn = '1 / -1';
    wrap.dataset.section = section.id;
    wrap.dataset.field = field.key;

    const value = getFieldValue(section, field, options.item);
    const id = options.id || `field-${section.id}${options.index != null ? `-${options.index}` : ''}-${field.key}`;

    if (field.type === 'skillsTags') {
      renderSkillsTagsField(wrap, section, field, value, id);
      return wrap;
    }

    if (field.type === 'monthYear') {
      renderMonthYearField(wrap, section, field, value, {
        id,
        index: options.index,
        item: options.item
      });
      return wrap;
    }

    const labelRow = document.createElement('span');
    labelRow.style.cssText = 'display:flex; align-items:center; gap:7px; font-size: 13px; margin-bottom: 6px; color: color-mix(in srgb, var(--color-text) 72%, transparent);';
    labelRow.innerHTML = `${field.label}${renderFieldTip(field)}`;
    wrap.appendChild(labelRow);

    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.className = 'cv-input';
      input.id = id;
      input.name = field.key;
      input.rows = 3;
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.required) input.required = true;
      input.value = value;
      wrap.appendChild(input);
    } else if (field.type === 'select') {
      input = document.createElement('select');
      input.className = 'cv-input';
      input.id = id;
      input.name = field.key;
      if (field.required) input.required = true;
      input.innerHTML = `<option value="">Selecione...</option>${(field.options || []).map((o) =>
        `<option value="${ctx.escapeAttr(o)}" ${value === o ? 'selected' : ''}>${ctx.escapeHtml(o)}</option>`
      ).join('')}`;
      wrap.appendChild(input);
    } else {
      input = document.createElement('input');
      input.className = 'cv-input';
      input.type = field.type || 'text';
      input.id = id;
      input.name = field.key;
      input.value = value;
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.required) input.required = true;
      wrap.appendChild(input);
    }

    // Dica de qualidade sob o campo, igual ao modelo.
    let hintEl = null;
    const hintKind = field.actionVerbs ? 'quality' : (field.type === 'email' ? 'email' : null);
    if (hintKind) {
      hintEl = document.createElement('div');
      hintEl.className = 'field-hint';
      hintEl.setAttribute('role', 'status');
      wrap.appendChild(hintEl);
      updateFieldHint(hintEl, hintKind, value);
    }

    const eventName = field.type === 'select' ? 'change' : 'input';
    input.addEventListener(eventName, () => {
      setFieldValue(section, field, input.value, options.item, options.index);
      if (hintEl) updateFieldHint(hintEl, hintKind, input.value);
      clearFieldValidation(wrap);
      ctx.debouncedUpdatePreviews();
      ctx.saveState();
    });

    return wrap;
  }

  // --- Dicas de qualidade (mesma heuristica e textos do modelo) ---
  const QUALITY_VERBS = ['lider', 'otimiz', 'desenvolv', 'cri', 'aument', 'reduz', 'implement', 'gerenci',
    'coorden', 'lanc', 'negoci', 'analis', 'planej', 'execut', 'conduz', 'melhor', 'constru', 'estrutur',
    'automatiz', 'entreg', 'organiz', 'dobr', 'triplic', 'apoi', 'atend', 'vend', 'captei', 'capt', 'arrecad', 'ajud'];

  function textQuality(text) {
    const t = (text || '').trim();
    if (!t) return { kind: 'empty', label: 'Dica: comece com um verbo de ação (ex.: Vendi, Organizei, Atendi…).' };
    const low = t.toLowerCase();
    const hasVerb = QUALITY_VERBS.some((v) => low.includes(v));
    const hasNum = /\d/.test(t);
    if (t.length < 45) return { kind: 'weak', label: 'Continue - conte o que você fez e o impacto disso.' };
    if (hasVerb && hasNum) return { kind: 'great', label: 'Ótimo! Tem verbo de ação e um resultado com número.' };
    if (hasNum) return { kind: 'good', label: 'Bom - que tal começar com um verbo de ação para reforçar?' };
    if (hasVerb) return { kind: 'good', label: 'Bom - tente incluir um número ou resultado concreto.' };
    return { kind: 'weak', label: 'Adicione um verbo de ação no início da frase.' };
  }

  const HINT_STYLE = {
    empty: { c: 'var(--color-neutral-600)', i: 'info' },
    weak: { c: 'var(--color-neutral-700)', i: 'arrow' },
    good: { c: 'var(--color-accent-700)', i: 'check' },
    great: { c: 'var(--color-accent-800)', i: 'star' }
  };

  function hintIconSvg(name, color) {
    const open = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">`;
    const paths = {
      info: '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5"></path><path d="M12 8h.01"></path>',
      arrow: '<path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path>',
      check: '<path d="M20 6L9 17l-5-5"></path>',
      star: '<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3z"></path>'
    };
    return `${open}${paths[name]}</svg>`;
  }

  function updateFieldHint(el, kind, value) {
    let q;
    if (kind === 'email') {
      q = (!value || /.+@.+\..+/.test(value))
        ? { kind: 'good', label: 'Use um e-mail que você consulta com frequência.' }
        : { kind: 'weak', label: 'Esse e-mail parece incompleto - confira o "@" e o domínio.' };
    } else {
      q = textQuality(value);
    }
    const m = HINT_STYLE[q.kind];
    el.style.color = m.c;
    el.innerHTML = `${hintIconSvg(m.i, m.c)}<span>${ctx.escapeHtml(q.label)}</span>`;
  }

  function renderMonthYearField(wrap, section, field, value, { id, index, item }) {
    const state = ctx.getState();
    const parsed = EuGeroDates.parseStoredDate(value);
    const monthId = `${id}-month`;
    const yearId = `${id}-year`;
    const showEndCurrent = item && EuGeroDates.hasEndCurrentFlag(section.id, field.key);
    const isEndDisabled = () => showEndCurrent && item.endCurrent && field.key === 'endDate';

    wrap.innerHTML = `
      <div class="field-label-row">
        <label for="${monthId}">${field.label}${field.required ? ' <span class="required">*</span>' : ''}</label>
        <div class="field-score" aria-live="polite"></div>
      </div>
      <div class="month-year-row ${isEndDisabled() ? 'is-disabled' : ''}">
        <select id="${monthId}" class="month-year-month" aria-label="${ctx.escapeAttr(field.label)} mes" ${isEndDisabled() ? 'disabled' : ''}>
          ${EuGeroDates.monthOptions(parsed.month)}
        </select>
        <select id="${yearId}" class="month-year-year" aria-label="${ctx.escapeAttr(field.label)} ano" ${isEndDisabled() ? 'disabled' : ''}>
          ${EuGeroDates.yearOptions(parsed.year)}
        </select>
      </div>
      ${showEndCurrent ? `
        <label class="checkbox-label end-current-label">
          <input type="checkbox" class="end-current-checkbox" ${item.endCurrent ? 'checked' : ''}>
          Ate hoje
        </label>
      ` : ''}
      ${renderFieldTip(field)}
    `;

    const monthSel = wrap.querySelector('.month-year-month');
    const yearSel = wrap.querySelector('.month-year-year');
    const endCheckbox = wrap.querySelector('.end-current-checkbox');
    const row = wrap.querySelector('.month-year-row');

    function syncDate() {
      if (isEndDisabled()) return;
      const serialized = EuGeroDates.serializeDate(monthSel.value, yearSel.value);
      if (item && index != null) {
        state[section.id][index][field.key] = serialized;
        updateFieldScore(wrap, field, serialized);
      } else {
        setFieldValue(section, field, serialized);
        updateFieldScore(wrap, field, serialized);
      }
      clearFieldValidation(wrap);
      ctx.debouncedUpdatePreviews();
      ctx.saveState();
    }

    monthSel?.addEventListener('change', syncDate);
    yearSel?.addEventListener('change', syncDate);

    if (endCheckbox && item) {
      endCheckbox.addEventListener('change', () => {
        item.endCurrent = endCheckbox.checked;
        if (field.key === 'endDate') {
          const disable = item.endCurrent;
          monthSel.disabled = disable;
          yearSel.disabled = disable;
          row?.classList.toggle('is-disabled', disable);
          if (disable) {
            item.endDate = '';
          }
        } else if (item.endCurrent) {
          item.endDate = '';
          const endField = section.itemFields?.find((f) => f.key === 'endDate');
          const endWrap = wrap.closest('.list-item-card')?.querySelector('[data-field="endDate"]');
          if (endWrap) {
            const endMonth = endWrap.querySelector('.month-year-month');
            const endYear = endWrap.querySelector('.month-year-year');
            if (endMonth) endMonth.disabled = true;
            if (endYear) endYear.disabled = true;
            endWrap.querySelector('.month-year-row')?.classList.add('is-disabled');
          }
        }
        ctx.debouncedUpdatePreviews();
        ctx.saveState();
      });
    }

    updateFieldScore(wrap, field, value);
  }

  const SKILL_SUGGESTIONS = ['Trabalho em equipe', 'Comunicação', 'Atendimento ao cliente', 'Organização',
    'Pacote Office', 'Proatividade', 'Resolução de problemas', 'Liderança', 'Pontualidade', 'Vendas'];

  function renderSkillsTagsField(wrap, section, field, value, id) {
    const state = ctx.getState();
    const tags = EuGeroConfig.parseSkillsText(value || state.skillsText);

    wrap.innerHTML = `
      <span style="display:flex; align-items:center; gap:7px; font-size: 13px; margin-bottom: 6px; color: color-mix(in srgb, var(--color-text) 72%, transparent);">${field.label}${renderFieldTip(field)}</span>
      <input type="text" id="${id}" class="cv-input" placeholder="${ctx.escapeAttr(field.placeholder || 'Ex.: Atendimento ao cliente…')}" autocomplete="off">
      <div class="skills-tags-chips" role="list"></div>
      <p class="skills-suggest-title">Sugestões - clique para adicionar</p>
      <div class="skills-suggest-row"></div>
    `;

    const chipsEl = wrap.querySelector('.skills-tags-chips');
    const suggestEl = wrap.querySelector('.skills-suggest-row');
    const input = wrap.querySelector(`#${CSS.escape(id)}`);

    function syncTags(newTags) {
      const text = newTags.map((t) => t.name || t).filter(Boolean).join('; ');
      state.skillsText = text;
      state.skills = newTags;
      clearFieldValidation(wrap);
      ctx.debouncedUpdatePreviews();
      ctx.saveState();
    }

    function renderChips() {
      chipsEl.innerHTML = tags.map((tag, i) => `
        <button type="button" class="skills-tag-chip" role="listitem" data-index="${i}" aria-label="Remover ${ctx.escapeAttr(tag.name || tag)}">
          ${ctx.escapeHtml(tag.name || tag)}<span class="skills-tag-remove">×</span>
        </button>
      `).join('');
      chipsEl.querySelectorAll('.skills-tag-chip').forEach((btn) => {
        btn.addEventListener('click', () => {
          tags.splice(parseInt(btn.dataset.index, 10), 1);
          renderChips();
          renderSuggestions();
          syncTags(tags);
        });
      });
    }

    function renderSuggestions() {
      const existing = new Set(tags.map((t) => (t.name || t).toLowerCase()));
      const options = SKILL_SUGGESTIONS.filter((s) => !existing.has(s.toLowerCase())).slice(0, 6);
      suggestEl.innerHTML = options.map((s) =>
        `<button type="button" class="skills-suggest-btn" data-name="${ctx.escapeAttr(s)}">+ ${ctx.escapeHtml(s)}</button>`
      ).join('');
      suggestEl.querySelectorAll('.skills-suggest-btn').forEach((btn) => {
        btn.addEventListener('click', () => addTag(btn.dataset.name));
      });
    }

    function addTag(raw) {
      const name = raw.trim().replace(/[;,]+$/, '');
      if (!name) return;
      if (tags.some((t) => (t.name || t).toLowerCase() === name.toLowerCase())) return;
      tags.push({ name });
      renderChips();
      renderSuggestions();
      syncTags(tags);
    }

    renderChips();
    renderSuggestions();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ';') {
        e.preventDefault();
        addTag(input.value);
        input.value = '';
      } else if (e.key === 'Backspace' && !input.value && tags.length) {
        tags.pop();
        renderChips();
        renderSuggestions();
        syncTags(tags);
      }
    });

    input.addEventListener('blur', () => {
      if (input.value.trim()) {
        addTag(input.value);
        input.value = '';
      }
    });
  }

  function getFieldValue(section, field, item) {
    const state = ctx.getState();
    if (item) return item[field.key] || '';
    if (section.id === 'personal') return state.personal[field.key] || '';
    if (section.id === 'summary') return state.summary || '';
    if (section.id === 'skills') return skillsToText(state);
    return state[field.key] || '';
  }

  function setFieldValue(section, field, value, item, index) {
    const state = ctx.getState();
    if (item != null && index != null) {
      state[section.id][index][field.key] = value;
      return;
    }
    if (section.id === 'personal') {
      state.personal[field.key] = value;
    } else if (section.id === 'summary') {
      state.summary = value;
    } else if (section.id === 'skills') {
      state.skillsText = value;
      state.skills = EuGeroConfig.parseSkillsText(value);
    } else {
      state[field.key] = value;
    }
  }

  function renderListSection(section) {
    const state = ctx.getState();
    const container = document.createElement('div');
    container.className = 'list-section';

    if (!Array.isArray(state[section.id])) state[section.id] = [];
    const items = state[section.id];

    const listEl = document.createElement('div');
    listEl.className = 'list-items';
    listEl.id = `list-items-${section.id}`;
    listEl.style.cssText = `display: flex; flex-direction: column; gap: ${section.id === 'languages' ? '14px' : '20px'};`;

    if (items.length === 0) items.push(createEmptyListItem(section.id));

    items.forEach((item, index) => {
      listEl.appendChild(createListItemEl(section, item, index));
    });

    container.appendChild(listEl);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-secondary btn-add-item';
    addBtn.style.cssText = 'align-self: flex-start; min-height: 42px; margin-top: 20px;';
    addBtn.textContent = `+ Adicionar ${(LIST_ITEM_LABELS[section.id] || 'item').toLowerCase()}`;
    addBtn.addEventListener('click', () => appendListItem(section.id));
    container.appendChild(addBtn);

    return container;
  }

  const LIST_ITEM_LABELS = {
    experiences: 'Experiência',
    education: 'Formação',
    languages: 'Idioma',
    certifications: 'Certificado',
    projects: 'Projeto'
  };

  function createListItemEl(section, item, index) {
    const makeRemoveBtn = (card) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-ghost btn-remove-item';
      btn.style.fontSize = '13px';
      btn.textContent = 'Remover';
      btn.addEventListener('click', () => {
        removeListItem(section.id, parseInt(card.dataset.index, 10));
      });
      return btn;
    };

    // Idiomas: linha simples (Idioma | Nível | Remover), como no modelo.
    if (section.id === 'languages') {
      const card = document.createElement('div');
      card.className = 'list-item-card cv-form2';
      card.dataset.index = String(index);
      card.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: end;';
      section.itemFields.forEach((field) => {
        card.appendChild(renderField(section, field, { item, index, id: `field-${section.id}-${index}-${field.key}` }));
      });
      const removeBtn = makeRemoveBtn(card);
      removeBtn.style.minHeight = '40px';
      card.appendChild(removeBtn);
      return card;
    }

    // Demais listas: card blueprint com cantos, como no modelo.
    const card = document.createElement('div');
    card.className = 'list-item-card blueprint';
    card.dataset.index = String(index);
    card.style.padding = '20px';
    card.innerHTML = '<i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>';

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;';
    const num = document.createElement('span');
    num.className = 'list-item-num';
    num.style.cssText = 'font-family: var(--font-heading); font-weight: 600; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-accent-700);';
    num.textContent = `${LIST_ITEM_LABELS[section.id] || 'Item'} ${String(index + 1).padStart(2, '0')}`;
    header.appendChild(num);
    header.appendChild(makeRemoveBtn(card));
    card.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'cv-form2';
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 14px;';
    section.itemFields.forEach((field) => {
      grid.appendChild(renderField(section, field, { item, index, id: `field-${section.id}-${index}-${field.key}` }));
    });
    card.appendChild(grid);

    return card;
  }

  function reindexListCards(sectionId) {
    const container = document.getElementById(`list-items-${sectionId}`);
    if (!container) return;
    const label = LIST_ITEM_LABELS[sectionId] || 'Item';
    const cards = container.querySelectorAll('.list-item-card');
    cards.forEach((card, i) => {
      card.dataset.index = String(i);
      const num = card.querySelector('.list-item-num');
      if (num) num.textContent = `${label} ${String(i + 1).padStart(2, '0')}`;
    });
  }

  function appendListItem(sectionId) {
    const state = ctx.getState();
    const section = SECTIONS.find((s) => s.id === sectionId);
    if (!section) return;
    if (!Array.isArray(state[sectionId])) state[sectionId] = [];
    const newItem = createEmptyListItem(sectionId);
    state[sectionId].push(newItem);
    const index = state[sectionId].length - 1;

    const container = document.getElementById(`list-items-${sectionId}`);
    if (container) {
      const card = createListItemEl(section, newItem, index);
      container.appendChild(card);
      reindexListCards(sectionId);
      const firstField = card.querySelector('input:not([type="checkbox"]), textarea, select');
      firstField?.focus();
    } else {
      renderWizardStep();
    }

    ctx.saveState();
    ctx.debouncedUpdatePreviews();
  }

  function removeListItem(sectionId, index) {
    const state = ctx.getState();
    const items = state[sectionId];
    if (!items || index < 0 || index >= items.length) return;

    const removed = { ...items[index] };
    const removedIndex = index;
    items.splice(index, 1);

    const container = document.getElementById(`list-items-${sectionId}`);
    const card = container?.querySelector(`.list-item-card[data-index="${index}"]`);
    card?.remove();
    reindexListCards(sectionId);

    if (items.length === 0) {
      appendListItem(sectionId);
    }

    ctx.saveState();
    ctx.debouncedUpdatePreviews();

    ctx.showToast('Item removido.', {
      actionLabel: 'Desfazer',
      duration: 5000,
      onAction: () => {
        const section = SECTIONS.find((s) => s.id === sectionId);
        if (!section) return;
        ctx.getState()[sectionId].splice(removedIndex, 0, removed);
        const listContainer = document.getElementById(`list-items-${sectionId}`);
        if (listContainer) {
          const newCard = createListItemEl(section, removed, removedIndex);
          const siblings = listContainer.querySelectorAll('.list-item-card');
          if (removedIndex >= siblings.length) {
            listContainer.appendChild(newCard);
          } else {
            listContainer.insertBefore(newCard, siblings[removedIndex]);
          }
          reindexListCards(sectionId);
        } else {
          renderWizardStep();
        }
        ctx.saveState();
        ctx.debouncedUpdatePreviews();
        ctx.showToast('Item restaurado.');
      }
    });
  }

  function reorderListItem(sectionId, index, direction) {
    const state = ctx.getState();
    const items = state[sectionId];
    const newIndex = index + direction;
    if (!items || newIndex < 0 || newIndex >= items.length) return;

    const tmp = items[index];
    items[index] = items[newIndex];
    items[newIndex] = tmp;

    const container = document.getElementById(`list-items-${sectionId}`);
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.list-item-card'));
    const cardA = cards[index];
    const cardB = cards[newIndex];
    if (direction < 0) {
      container.insertBefore(cardA, cardB);
    } else {
      container.insertBefore(cardB, cardA);
    }
    reindexListCards(sectionId);
    ctx.saveState();
    ctx.debouncedUpdatePreviews();
  }

  function updateFieldScore(wrap, field, value) {
    const scoreEl = wrap.querySelector('.field-score');
    if (!scoreEl) return;
    const score = EuGeroScoring.scoreField(value, field, ACTION_VERBS);
    scoreEl.textContent = EuGeroScoring.getLabelText(score);
    scoreEl.className = `field-score score-${score}`;
    scoreEl.title = `Nota: ${EuGeroScoring.getLabelText(score)}`;
  }

  return {
    init,
    renderWizardStep,
    validateCurrentStep,
    clearCurrentSection,
    appendListItem,
    removeListItem,
    reorderListItem
  };
})();
