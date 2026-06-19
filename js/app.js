// ============================================================
// app.js — Multi-Page Controller
// Detects which page is loaded and initializes the correct logic.
// ============================================================

const RESULT_KEY = 'timetable_generator_result';
const THEME_KEY = 'timetable_generator_theme';

document.addEventListener('DOMContentLoaded', async () => {
  initThemeToggle();
  initParityToggle();

  // Load data from localStorage (or load sample if empty)
  if (!TimetableData.load()) {
    await TimetableData.loadSampleData();
  }

  // Detect page by body id
  const pageId = document.body.id;

  switch (pageId) {
    case 'page-setup':
      initSetupPage();
      break;
    case 'page-generate':
      initGeneratePage();
      break;
    case 'page-timetable':
      initTimetablePage();
      break;
    case 'page-export':
      initExportPage();
      break;
  }
});

// ---- THEME TOGGLE ----
function initThemeToggle() {
  injectThemeStyles();

  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(savedTheme);

  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const nextTheme = document.documentElement.classList.contains('theme-light') ? 'dark' : 'light';
      localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  });
}

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.documentElement.classList.toggle('theme-light', isLight);
  document.documentElement.classList.toggle('dark', !isLight);

  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    const icon = button.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = isLight ? 'dark_mode' : 'light_mode';
    button.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    button.setAttribute('title', isLight ? 'Switch to dark mode' : 'Switch to light mode');
  });
}

function injectThemeStyles() {
  if (document.getElementById('mixed-theme-overrides')) return;

  const style = document.createElement('style');
  style.id = 'mixed-theme-overrides';
  style.textContent = `
    html.theme-light,
    html.theme-light body {
      background: #f8fafc !important;
      color: #0f172a !important;
    }

    html.theme-light .bg-background,
    html.theme-light .dark\\:bg-background {
      background-color: #f8fafc !important;
    }

    html.theme-light .bg-surface,
    html.theme-light .bg-surface-bright,
    html.theme-light .dark\\:bg-surface-bright {
      background-color: #ffffff !important;
    }

    html.theme-light .bg-surface-container-lowest,
    html.theme-light .bg-surface-container-low,
    html.theme-light .dark\\:bg-surface-container-low {
      background-color: #f1f5f9 !important;
    }

    html.theme-light .bg-surface-container,
    html.theme-light .bg-surface-variant {
      background-color: #e2e8f0 !important;
    }

    html.theme-light .bg-surface-container-high,
    html.theme-light .bg-surface-container-highest {
      background-color: #ffffff !important;
    }

    html.theme-light .bg-secondary-container,
    html.theme-light .bg-primary-container {
      background-color: #e2e8f0 !important;
    }

    html.theme-light .bg-primary {
      background-color: #334155 !important;
    }

    html.theme-light .text-on-background,
    html.theme-light .text-on-surface,
    html.theme-light .text-on-secondary-container,
    html.theme-light .text-on-primary-container {
      color: #0f172a !important;
    }

    html.theme-light .text-on-surface-variant,
    html.theme-light .text-primary {
      color: #475569 !important;
    }

    html.theme-light .text-on-primary-fixed {
      color: #0f172a !important;
    }

    html.theme-light .bg-primary.text-on-primary-fixed,
    html.theme-light .bg-primary .text-on-primary-fixed,
    html.theme-light .text-on-primary {
      color: #ffffff !important;
    }

    html.theme-light .border-outline-variant,
    html.theme-light .border-outline {
      border-color: #cbd5e1 !important;
    }

    html.theme-light input,
    html.theme-light select,
    html.theme-light textarea {
      background-color: #ffffff !important;
      color: #0f172a !important;
    }
  `;
  document.head.appendChild(style);
}

// ---- TOAST ----
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.style.cssText = `padding:12px 20px;margin-bottom:8px;border-radius:6px;color:#fff;font-size:13px;font-family:Inter,sans-serif;
    box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:opacity 0.3s ease;max-width:360px;`;
  toast.style.background = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#6366f1';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ---- RESULT PERSISTENCE ----
function saveResult(result) {
  try {
    localStorage.setItem(RESULT_KEY, JSON.stringify(result));
  } catch (e) { console.warn('Failed to save result:', e); }
}

function loadResult() {
  try {
    const raw = localStorage.getItem(RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

// ================================================================
// SEMESTER PARITY TOGGLE
// ================================================================
function initParityToggle() {
  const btnOdd = document.getElementById('btn-sem-odd');
  const btnEven = document.getElementById('btn-sem-even');

  function updateParityUI() {
    const parity = localStorage.getItem('timetable_semester_parity') || 'odd';
    const activeClass = 'bg-primary-container text-on-primary-container font-semibold';
    const inactiveClass = 'text-on-surface-variant hover:bg-surface-container-high';

    if (btnOdd && btnEven) {
      if (parity === 'odd') {
        btnOdd.className = `flex-1 py-2.5 px-4 flex items-center justify-center gap-2 font-body-md text-body-md transition-all duration-200 ${activeClass}`;
        btnEven.className = `flex-1 py-2.5 px-4 flex items-center justify-center gap-2 font-body-md text-body-md transition-all duration-200 ${inactiveClass}`;
      } else {
        btnEven.className = `flex-1 py-2.5 px-4 flex items-center justify-center gap-2 font-body-md text-body-md transition-all duration-200 ${activeClass}`;
        btnOdd.className = `flex-1 py-2.5 px-4 flex items-center justify-center gap-2 font-body-md text-body-md transition-all duration-200 ${inactiveClass}`;
      }
    }
  }

  updateParityUI();

  if (btnOdd) {
    btnOdd.addEventListener('click', () => {
      localStorage.setItem('timetable_semester_parity', 'odd');
      updateParityUI();
      if (typeof currentStep !== 'undefined') updateWizardUI(); // Re-render the current setup step
    });
  }

  if (btnEven) {
    btnEven.addEventListener('click', () => {
      localStorage.setItem('timetable_semester_parity', 'even');
      updateParityUI();
      if (typeof currentStep !== 'undefined') updateWizardUI(); // Re-render the current setup step
    });
  }
}

// ================================================================
// PAGE: SETUP (main.html)
// ================================================================
let currentStep = 1;

function getActiveSemesters() {
  const parity = localStorage.getItem('timetable_semester_parity') || 'odd';
  return parity === 'even' ? [2, 4, 6, 8] : [1, 3, 5, 7];
}

function initSetupPage() {
  renderSetupBranches();

  document.querySelectorAll('[id^="step-indicator-"]').forEach(stepEl => {
    const step = parseInt(stepEl.id.replace('step-indicator-', ''), 10);
    if (!Number.isNaN(step)) {
      stepEl.addEventListener('click', () => {
        currentStep = step;
        updateWizardUI();
      });
    }
  });

  const btnAddBranch = document.getElementById('btn-add-branch');
  if (btnAddBranch) {
    btnAddBranch.addEventListener('click', () => {
      TimetableData.addBranch(`Branch ${TimetableData.getBranches().length + 1}`);
      renderSetupBranches();
    });
  }

  const btnNext = document.getElementById('btn-next-step');
  const btnPrev = document.getElementById('btn-prev-step');

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateWizardUI();
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (currentStep < 4) {
        currentStep++;
        updateWizardUI();
      } else {
        // On final step, validate before navigating
        const validation = TimetableData.validate();
        if (!validation.valid) {
          showToast(validation.errors[0], 'error');
          return;
        }
        TimetableData.save();
        showToast('Configuration Saved!', 'success');
        setTimeout(() => {
          window.location.href = 'Generate(dark).html';
        }, 500);
      }
    });
  }
}

function updateWizardUI() {
  const stepContainerIds = ['step-branches', 'step-subjects', 'step-sections', 'step-teachers'];

  // Update progress indicators
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`step-indicator-${i}`);
    const containerEl = document.getElementById(stepContainerIds[i - 1]);

    if (stepEl) {
      const circle = stepEl.querySelector('.indicator-circle');
      const text = stepEl.querySelector('.indicator-text');
      stepEl.classList.add('cursor-pointer');

      if (i < currentStep) {
        circle.className = 'w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold indicator-circle';
        text.className = 'font-label-sm text-label-sm text-emerald-500 uppercase tracking-wider indicator-text';
      } else if (i === currentStep) {
        circle.className = 'w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary-fixed text-[10px] font-bold ring-4 ring-background indicator-circle';
        text.className = 'font-label-sm text-label-sm text-primary uppercase tracking-wider indicator-text';
      } else {
        circle.className = 'w-6 h-6 rounded-full border border-outline-variant bg-surface-container flex items-center justify-center text-on-surface-variant text-[10px] font-bold indicator-circle';
        text.className = 'font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider indicator-text';
      }
    }

    if (containerEl) {
      if (i === currentStep) {
        containerEl.classList.remove('hidden');
        containerEl.classList.add('flex');
      } else {
        containerEl.classList.add('hidden');
        containerEl.classList.remove('flex');
      }
    }
  }

  // Update prev/next buttons
  const btnPrev = document.getElementById('btn-prev-step');
  const btnNextText = document.getElementById('btn-next-step-text');

  if (btnPrev) {
    btnPrev.style.display = currentStep === 1 ? 'none' : 'flex';
  }

  if (btnNextText) {
    btnNextText.textContent = currentStep === 4 ? 'Save & Generate' : 'Next Step';
  }

  // Re-render content for the active step
  switch (currentStep) {
    case 1: renderSetupBranches(); break;
    case 2: renderSetupSubjects(); break;
    case 3: renderSetupSections(); break;
    case 4: renderSetupTeachers(); break;
  }
}

function renderSetupBranches() {
  const container = document.getElementById('branches-list');
  if (!container) return;

  const branches = TimetableData.getBranches();
  // Keep the decorative vertical line
  container.innerHTML = `
    <div class="absolute left-[39px] top-4 bottom-10 w-[1px] bg-[#333338] z-0"></div>
    <div class="flex flex-col gap-component-gap relative z-10" id="branches-cards"></div>
  `;

  const cardsContainer = document.getElementById('branches-cards');

  branches.forEach(branch => {
    const card = document.createElement('div');
    card.className = 'flex items-start';
    card.innerHTML = `
      <div class="w-10 h-10 border-b border-l border-[#333338] rounded-bl-lg translate-y-4 -translate-x-px"></div>
      <div class="bg-surface-container-high border border-outline-variant rounded-lg p-card-padding flex-1 relative overflow-hidden group">
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
            <h3 class="font-headline-md text-headline-md text-on-surface">${branch.name}</h3>
          </div>
          <button class="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity btn-del-branch"
                  data-id="${branch.id}" title="Delete branch">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
        <div class="grid grid-cols-3 gap-6">
          <div>
            <label class="block font-caption text-caption text-on-surface-variant mb-1 uppercase tracking-wider">Branch Code</label>
            <input class="branch-name-input w-full bg-surface-container border border-outline-variant rounded-DEFAULT px-3 py-1.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
                   type="text" value="${branch.name}" data-id="${branch.id}" />
          </div>
          <div>
            <label class="block font-caption text-caption text-on-surface-variant mb-1 uppercase tracking-wider">Semesters Active</label>
            <div class="flex items-center gap-2 h-[34px]">
              ${getActiveSemesters().map(sem => `
                <div class="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-DEFAULT border border-outline-variant ${branch.semesters.includes(sem) ? '' : 'opacity-50'}">
                  <span class="w-1.5 h-1.5 rounded-full ${branch.semesters.includes(sem) ? 'bg-primary' : 'bg-outline-variant'}"></span>
                  <span class="font-caption text-caption">S${sem}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    cardsContainer.appendChild(card);
  });

  // Event delegation for name changes
  cardsContainer.querySelectorAll('.branch-name-input').forEach(inp => {
    inp.addEventListener('change', (e) => {
      TimetableData.updateBranch(e.target.dataset.id, { name: e.target.value });
    });
  });

  // Event delegation for delete
  cardsContainer.querySelectorAll('.btn-del-branch').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      TimetableData.removeBranch(id);
      renderSetupBranches();
    });
  });
}

function populateFilterOptions(filterBranchId, filterSemId) {
  const selBranch = document.getElementById(filterBranchId);
  const selSem = document.getElementById(filterSemId);
  if (!selBranch || !selSem) return;

  const branches = TimetableData.getBranches();

  // Keep current selection if possible
  const currentBranch = selBranch.value;
  const currentSem = selSem.value;

  selBranch.innerHTML = '<option value="">Select Branch</option>';
  branches.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.text = b.name;
    selBranch.appendChild(opt);
  });

  const activeSems = getActiveSemesters();
  selSem.innerHTML = '<option value="">Select Semester</option>';
  activeSems.forEach(sem => {
    const opt = document.createElement('option');
    opt.value = sem;
    opt.text = `Semester ${sem}`;
    selSem.appendChild(opt);
  });

  if (currentBranch && branches.find(b => b.id === currentBranch)) {
    selBranch.value = currentBranch;
  } else if (branches.length > 0) {
    selBranch.value = branches[0].id; // Default to first branch
  }

  if (currentSem && activeSems.includes(parseInt(currentSem))) {
    selSem.value = currentSem;
  } else if (activeSems.length > 0) {
    selSem.value = activeSems[0]; // Default to first active sem
  }
}

// ================================================================
// STEP 2: SUBJECTS
// ================================================================
function renderSetupSubjects() {
  const container = document.getElementById('subjects-list');
  if (!container) return;

  populateFilterOptions('filter-subject-branch', 'filter-subject-semester');

  const selBranch = document.getElementById('filter-subject-branch');
  const selSem = document.getElementById('filter-subject-semester');

  const branchId = selBranch.value;
  const semester = parseInt(selSem.value);

  // Re-render when filters change
  selBranch.onchange = renderSetupSubjects;
  selSem.onchange = renderSetupSubjects;

  if (!branchId) {
    container.innerHTML = '<div class="text-on-surface-variant p-4">Please select a branch and semester above.</div>';
    return;
  }

  const subjects = TimetableData.getSubjectsByBranchSem(branchId, semester);

  container.innerHTML = `
    <div class="absolute left-[39px] top-4 bottom-10 w-[1px] bg-[#333338] z-0"></div>
    <div class="flex flex-col gap-component-gap relative z-10" id="subjects-cards"></div>
  `;

  const cardsContainer = document.getElementById('subjects-cards');

  subjects.forEach(sub => {
    const card = document.createElement('div');
    card.className = 'flex items-start';
    card.innerHTML = `
      <div class="w-10 h-10 border-b border-l border-[#333338] rounded-bl-lg translate-y-4 -translate-x-px"></div>
      <div class="bg-surface-container-high border border-outline-variant rounded-lg p-card-padding flex-1 relative overflow-hidden group">
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
            <h3 class="font-headline-md text-headline-md text-on-surface">${sub.name} (${sub.code})</h3>
          </div>
          <button class="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity btn-del-subject"
                  data-id="${sub.id}" title="Delete subject">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block font-caption text-caption text-on-surface-variant mb-1 uppercase tracking-wider">Subject Name</label>
            <input class="subj-name-input w-full bg-surface-container border border-outline-variant rounded-DEFAULT px-3 py-1.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
                   type="text" value="${sub.name}" data-id="${sub.id}" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block font-caption text-caption text-on-surface-variant mb-1 uppercase tracking-wider">Code</label>
                <input class="subj-code-input w-full bg-surface-container border border-outline-variant rounded-DEFAULT px-3 py-1.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
                       type="text" value="${sub.code}" data-id="${sub.id}" />
            </div>
            <div>
                <label class="block font-caption text-caption text-on-surface-variant mb-1 uppercase tracking-wider">Credits</label>
                <select class="subj-credits-input w-full bg-surface-container border border-outline-variant rounded-DEFAULT px-3 py-1.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors" data-id="${sub.id}">
                    <option value="2" ${sub.credits === 2 ? 'selected' : ''}>2 (Theory)</option>
                    <option value="3" ${sub.credits === 3 ? 'selected' : ''}>3 (Theory)</option>
                    <option value="4" ${sub.credits === 4 ? 'selected' : ''}>4 (Lab)</option>
                </select>
            </div>
          </div>
        </div>
      </div>
    `;
    cardsContainer.appendChild(card);
  });

  // Add Subject button logic
  const btnAdd = document.getElementById('btn-add-subject');
  if (btnAdd) {
    btnAdd.onclick = () => {
      TimetableData.addSubject('New Subject', 'SUBXXX', 3, branchId, semester);
      renderSetupSubjects();
    };
  }

  // Update handlers
  cardsContainer.querySelectorAll('.subj-name-input').forEach(inp => {
    inp.addEventListener('change', (e) => { TimetableData.updateSubject(e.target.dataset.id, { name: e.target.value }); });
  });
  cardsContainer.querySelectorAll('.subj-code-input').forEach(inp => {
    inp.addEventListener('change', (e) => { TimetableData.updateSubject(e.target.dataset.id, { code: e.target.value }); });
  });
  cardsContainer.querySelectorAll('.subj-credits-input').forEach(inp => {
    inp.addEventListener('change', (e) => { TimetableData.updateSubject(e.target.dataset.id, { credits: parseInt(e.target.value) }); });
  });

  // Delete handler
  cardsContainer.querySelectorAll('.btn-del-subject').forEach(btn => {
    btn.addEventListener('click', (e) => {
      TimetableData.removeSubject(e.currentTarget.dataset.id);
      renderSetupSubjects();
    });
  });
}

// ================================================================
// STEP 3: SECTIONS
// ================================================================
function renderSetupSections() {
  const container = document.getElementById('sections-list');
  if (!container) return;

  populateFilterOptions('filter-section-branch', 'filter-section-semester');

  const selBranch = document.getElementById('filter-section-branch');
  const selSem = document.getElementById('filter-section-semester');

  const branchId = selBranch.value;
  const semester = parseInt(selSem.value);

  // Re-render when filters change
  selBranch.onchange = renderSetupSections;
  selSem.onchange = renderSetupSections;

  if (!branchId) {
    container.innerHTML = '<div class="text-on-surface-variant p-4">Please select a branch and semester above.</div>';
    return;
  }

  const sections = TimetableData.getSectionsByBranchSem(branchId, semester);

  container.innerHTML = `<div class="grid grid-cols-3 gap-4" id="sections-cards"></div>`;

  const cardsContainer = document.getElementById('sections-cards');

  sections.forEach(sec => {
    const card = document.createElement('div');
    card.className = 'bg-surface-container-high border border-outline-variant rounded-lg p-card-padding flex justify-between items-center group relative overflow-hidden';
    card.innerHTML = `
      <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded bg-surface-container flex items-center justify-center font-bold text-on-surface border border-outline-variant">
            ${sec.name}
        </div>
        <span class="font-body-md text-on-surface">Section ${sec.name}</span>
      </div>
      <button class="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity btn-del-section"
              data-id="${sec.id}" title="Delete section">
        <span class="material-symbols-outlined text-[18px]">delete</span>
      </button>
    `;
    cardsContainer.appendChild(card);
  });

  // Add Section button logic
  const btnAdd = document.getElementById('btn-add-section');
  if (btnAdd) {
    btnAdd.onclick = () => {
      const names = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const newName = names[sections.length % names.length]; // Simple logic to assign A, B, C
      TimetableData.addSection(newName, branchId, semester);
      renderSetupSections();
    };
  }

  // Delete handler
  cardsContainer.querySelectorAll('.btn-del-section').forEach(btn => {
    btn.addEventListener('click', (e) => {
      TimetableData.removeSection(e.currentTarget.dataset.id);
      renderSetupSections();
    });
  });
}

// ================================================================
// STEP 4: TEACHERS
// ================================================================
function renderSetupTeachers() {
  const container = document.getElementById('teachers-list');
  if (!container) return;

  populateFilterOptions('filter-teacher-branch', 'filter-teacher-semester');

  const selBranch = document.getElementById('filter-teacher-branch');
  const selSem = document.getElementById('filter-teacher-semester');

  const branchId = selBranch.value;
  const semester = parseInt(selSem.value);

  // Re-render when filters change
  if (selBranch && selSem) {
    selBranch.onchange = renderSetupTeachers;
    selSem.onchange = renderSetupTeachers;
  }

  if (!branchId) {
    container.innerHTML = '<div class="text-on-surface-variant p-4">Please select a branch and semester above.</div>';
    return;
  }

  const allTeachers = TimetableData.getTeachers();
  const branchSubjects = TimetableData.getSubjectsByBranchSem(branchId, semester);
  const branchSubjectIds = branchSubjects.map(s => s.id);

  // Only show teachers who teach at least one subject in this branch/sem, OR have no subjects assigned yet
  const teachers = allTeachers.filter(t => {
    if (t.subjectIds.length === 0) return true;
    return t.subjectIds.some(id => branchSubjectIds.includes(id));
  });

  container.innerHTML = `<div class="grid grid-cols-2 gap-4" id="teachers-cards"></div>`;

  const cardsContainer = document.getElementById('teachers-cards');

  teachers.forEach(tch => {
    const assignedSubjectIds = Array.isArray(tch.subjectIds) ? tch.subjectIds : [];
    const card = document.createElement('div');
    card.className = 'bg-surface-container-high border border-outline-variant rounded-lg p-card-padding flex flex-col gap-4 relative overflow-hidden group';
    card.innerHTML = `
      <div class="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
      <div class="flex justify-between items-start">
        <div class="flex-1 mr-4">
            <input class="tch-name-input w-full bg-transparent border-b border-outline-variant px-1 py-1 font-headline-md text-headline-md text-on-surface focus:outline-none focus:border-primary transition-colors"
                   type="text" value="${tch.name}" data-id="${tch.id}" />
        </div>
        <button class="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity btn-del-teacher"
                data-id="${tch.id}" title="Delete teacher">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
      <div>
        <label class="block font-caption text-caption text-on-surface-variant mb-2 uppercase tracking-wider">Assigned Subjects</label>
        <div class="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2 custom-scroll">
            ${branchSubjects.map(sub => `
                <label class="flex items-center gap-2 cursor-pointer p-1 hover:bg-surface-container rounded transition-colors">
                    <input type="checkbox" class="tch-subj-checkbox accent-primary" 
                           data-tid="${tch.id}" data-sid="${sub.id}" ${assignedSubjectIds.includes(sub.id) ? 'checked' : ''} />
                    <span class="font-body-md text-body-md text-on-surface flex-1">${sub.code}</span>
                </label>
            `).join('')}
        </div>
      </div>
    `;
    cardsContainer.appendChild(card);
  });

  // Add Teacher button logic
  const btnAdd = document.getElementById('btn-add-teacher');
  if (btnAdd) {
    btnAdd.onclick = () => {
      TimetableData.addTeacher('New Teacher', []);
      renderSetupTeachers();
    };
  }

  // Update handlers
  cardsContainer.querySelectorAll('.tch-name-input').forEach(inp => {
    inp.addEventListener('change', (e) => { TimetableData.updateTeacher(e.target.dataset.id, { name: e.target.value }); });
  });

  cardsContainer.querySelectorAll('.tch-subj-checkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const tid = e.target.dataset.tid;
      const sid = e.target.dataset.sid;
      const teacher = TimetableData.getTeacherById(tid);
      if (teacher) {
        let subjects = Array.isArray(teacher.subjectIds) ? [...teacher.subjectIds] : [];
        if (e.target.checked) {
          if (!subjects.includes(sid)) subjects.push(sid);
        } else {
          subjects = subjects.filter(id => id !== sid);
        }
        TimetableData.updateTeacher(tid, { subjectIds: subjects });
      }
    });
  });

  // Delete handler
  cardsContainer.querySelectorAll('.btn-del-teacher').forEach(btn => {
    btn.addEventListener('click', (e) => {
      TimetableData.removeTeacher(e.currentTarget.dataset.id);
      renderSetupTeachers();
    });
  });
}

// ================================================================
// PAGE: GENERATE
// ================================================================
function initGeneratePage() {
  // ---- Sync range slider labels ----
  const popSlider = document.getElementById('param-population');
  const popLabel = document.getElementById('param-population-label');
  if (popSlider && popLabel) {
    popSlider.addEventListener('input', () => { popLabel.textContent = popSlider.value; });
  }

  const mutSlider = document.getElementById('param-mutation');
  const mutLabel = document.getElementById('param-mutation-label');
  if (mutSlider && mutLabel) {
    mutSlider.addEventListener('input', () => { mutLabel.textContent = mutSlider.value + '%'; });
  }

  const btnGenerate = document.getElementById('btn-generate');
  const btnStop = document.getElementById('btn-stop');

  if (btnGenerate) {
    btnGenerate.addEventListener('click', () => {
      const currentParity = localStorage.getItem('timetable_semester_parity') || 'odd';
      // Validate data first (only for the selected parity)
      const validation = TimetableData.validate(currentParity);
      if (!validation.valid) {
        showToast(validation.errors[0], 'error');
        return;
      }

      const popSize = parseInt(document.getElementById('param-population')?.value || 200);
      const maxGen = parseInt(document.getElementById('param-generations')?.value || 500);
      const mutRate = parseFloat(document.getElementById('param-mutation')?.value || 5) / 100;

      // UI: show stop, hide generate
      btnGenerate.style.display = 'none';
      if (btnStop) btnStop.style.display = 'flex';

      const btnText = document.getElementById('btn-generate-text');

      GeneticAlgorithm.run(
        {
          populationSize: popSize,
          maxGenerations: maxGen,
          mutationRate: mutRate,
          semesterParity: localStorage.getItem('timetable_semester_parity') || 'odd'
        },
        // Progress callback
        (gen, maxGen, bestFitness) => {
          const pct = Math.round((gen / maxGen) * 100);
          const progBar = document.getElementById('progress-bar');
          const progText = document.getElementById('progress-text');

          if (progBar) progBar.style.width = pct + '%';
          if (progText) progText.textContent = `Gen ${gen}/${maxGen} — ${pct}%`;
        },
        // Complete callback
        (result) => {
          // Save to localStorage for other pages
          saveResult(result);

          btnGenerate.style.display = 'flex';
          if (btnStop) btnStop.style.display = 'none';
          if (btnText) btnText.textContent = 'Re-Generate';

          // Update stats
          const statHard = document.getElementById('stat-hard');
          const statSoft = document.getElementById('stat-soft');
          const statTime = document.getElementById('stat-time');

          if (statHard) statHard.textContent = result.fitness.hardViolations;
          if (statSoft) statSoft.textContent = result.fitness.softPenalty;
          if (statTime) statTime.textContent = result.elapsed + 's';

          const progText = document.getElementById('progress-text');
          if (progText) progText.textContent = '100% — Complete!';
          const progBar = document.getElementById('progress-bar');
          if (progBar) progBar.style.width = '100%';

          if (result.fitness.hardViolations === 0) {
            showToast(`Optimal ${semesterParity} semester timetable generated!`, 'success');
          } else {
            showToast(`Done with ${result.fitness.hardViolations} hard violation(s).`, 'error');
          }
        }
      );
    });
  }

  if (btnStop) {
    btnStop.addEventListener('click', () => {
      GeneticAlgorithm.stop();
      btnGenerate.style.display = 'flex';
      btnStop.style.display = 'none';
    });
  }
}

// ================================================================
// PAGE: TIMETABLE
// ================================================================
function initTimetablePage() {
  const result = loadResult();
  if (!result || !result.timetable) {
    showToast('No timetable generated yet. Go to the Generate page first.', 'error');
    return;
  }

  const data = TimetableData.getAllData();
  const generatedSectionIds = new Set(Object.keys(result.timetable || {}));
  const sections = data.sections.filter(section => generatedSectionIds.has(section.id));
  const branches = data.branches;
  const teachers = getTeachersInTimetable(result.timetable, data.teachers);

  const selView = document.getElementById('tt-view-select');
  const lblView = document.getElementById('tt-view-label');
  const btnSectionView = document.getElementById('btn-section-view');
  const btnTeacherView = document.getElementById('btn-teacher-view');

  let currentView = 'section'; // 'section' or 'teacher'

  function updateViewUI() {
    if (!selView || !lblView) return;

    selView.innerHTML = '';

    if (currentView === 'section') {
      lblView.textContent = 'SECTION';
      btnSectionView.className = 'px-3 py-1 bg-surface-variant text-on-surface rounded font-body-md text-body-md';
      btnTeacherView.className = 'px-3 py-1 text-on-surface-variant hover:text-on-surface font-body-md text-body-md transition-colors';

      if (sections.length === 0) {
        addDisabledOption(selView, 'No generated sections');
      }

      sections.forEach(s => {
        const branch = branches.find(b => b.id === s.branchId);
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.text = `${branch?.name || '?'} Sem-${s.semester} Sec-${s.name}`;
        selView.appendChild(opt);
      });
    } else {
      lblView.textContent = 'TEACHER';
      btnTeacherView.className = 'px-3 py-1 bg-surface-variant text-on-surface rounded font-body-md text-body-md';
      btnSectionView.className = 'px-3 py-1 text-on-surface-variant hover:text-on-surface font-body-md text-body-md transition-colors';

      if (teachers.length === 0) {
        addDisabledOption(selView, 'No generated teachers');
      }

      teachers.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.text = t.name;
        selView.appendChild(opt);
      });
    }

    renderCurrentView();
  }

  function renderCurrentView() {
    if (!selView.value) {
      renderTimetableEmptyState(currentView === 'section' ? 'No generated sections to display.' : 'No generated teachers to display.');
      return;
    }
    if (currentView === 'section') {
      renderGrid(selView.value, result.timetable, data);
    } else {
      renderTeacherGrid(selView.value, result.timetable, data);
    }
  }

  if (selView) {
    selView.addEventListener('change', renderCurrentView);
  }

  if (btnSectionView) {
    btnSectionView.addEventListener('click', () => {
      if (currentView !== 'section') {
        currentView = 'section';
        updateViewUI();
      }
    });
  }

  if (btnTeacherView) {
    btnTeacherView.addEventListener('click', () => {
      if (currentView !== 'teacher') {
        currentView = 'teacher';
        updateViewUI();
      }
    });
  }

  // Initialize
  updateViewUI();

  // Violations
  renderViolationsPanel(result, data);
}

function addDisabledOption(select, text) {
  const opt = document.createElement('option');
  opt.value = '';
  opt.text = text;
  opt.disabled = true;
  opt.selected = true;
  select.appendChild(opt);
}

function getTeachersInTimetable(timetable, teachers) {
  const teacherIds = new Set();
  Object.values(timetable || {}).forEach(sectionGrid => {
    sectionGrid.forEach(dayGrid => {
      dayGrid.forEach(cell => {
        if (cell?.teacherId) teacherIds.add(cell.teacherId);
      });
    });
  });
  return teachers.filter(teacher => teacherIds.has(teacher.id));
}

function renderTimetableEmptyState(message) {
  const body = document.getElementById('timetable-body');
  if (!body) return;
  body.innerHTML = `
    <div class="col-span-6 min-h-[240px] flex items-center justify-center text-on-surface-variant font-body-md text-body-md">
      ${message}
    </div>`;
}

function renderGrid(sectionId, timetable, data) {
  const body = document.getElementById('timetable-body');
  if (!body) return;
  body.innerHTML = '';

  const grid = timetable[sectionId];
  if (!grid) {
    renderTimetableEmptyState('This section was not included in the generated timetable.');
    return;
  }

  const slotLabels = data.slotLabels;
  const breakIndices = data.breakIndices || new Set();
  const numDays = data.days.length;

  // Build mapping: visual slot index → teaching slot index
  // Visual slots include breaks; teaching slots are the GA grid indices
  let teachingIdx = 0;

  for (let visualSlot = 0; visualSlot < slotLabels.length; visualSlot++) {
    const isBreak = breakIndices.has(visualSlot);

    // Time label cell
    const timeCell = document.createElement('div');
    timeCell.className = 'border-b border-r border-outline-variant p-2 flex items-center justify-center font-caption text-caption text-on-surface-variant';

    if (isBreak) {
      // Break row — time label
      timeCell.innerHTML = `<span class="italic text-xs">${slotLabels[visualSlot]}</span>`;
      timeCell.style.background = 'rgba(99, 102, 241, 0.08)';
      body.appendChild(timeCell);

      // Break row — span across all day columns
      for (let day = 0; day < numDays; day++) {
        const breakCell = document.createElement('div');
        const isLast = day === numDays - 1;
        breakCell.className = `border-b ${isLast ? '' : 'border-r'} border-outline-variant p-1 flex items-center justify-center`;
        breakCell.style.background = 'rgba(99, 102, 241, 0.08)';
        if (day === Math.floor(numDays / 2)) {
          breakCell.innerHTML = `<span class="font-caption text-caption text-primary/60 italic text-xs">${slotLabels[visualSlot] === 'LUNCH BREAK' ? 'Lunch Break' : 'Short Break'}</span>`;
        }
        body.appendChild(breakCell);
      }
      continue; // Don't increment teachingIdx for breaks
    }

    timeCell.innerHTML = slotLabels[visualSlot].replace('-', '<br/>');
    body.appendChild(timeCell);

    const slot = teachingIdx; // This is the GA grid slot index

    // Day cells
    for (let day = 0; day < numDays; day++) {
      const cell = grid[day][slot];
      const div = document.createElement('div');
      const isLast = day === numDays - 1;
      div.className = `border-b ${isLast ? '' : 'border-r'} border-outline-variant p-2 relative`;

      if (!cell) {
        // Check if rest after lab
        if (slot > 0 && grid[day][slot - 1] && grid[day][slot - 1].type === 'lab_cont') {
          div.innerHTML = `<div class="flex items-center justify-center h-full font-caption text-caption text-integrity-success italic">Free Slot</div>`;
          div.classList.add('bg-surface-container-lowest');
        } else {
          // Empty
          div.innerHTML = '';
        }
      } else if (cell.type === 'lab_cont') {
        div.classList.add('bg-surface-container-highest');
        div.innerHTML = `
          <div class="absolute top-1 left-1 bottom-1 w-1 bg-primary rounded-l"></div>
          <div class="ml-2 pl-2 flex flex-col justify-center h-full">
            <span class="font-caption text-caption text-on-surface-variant italic">(Lab cont.)</span>
          </div>`;
      } else {
        const subject = data.subjects.find(s => s.id === cell.subjectId);
        const teacher = data.teachers.find(t => t.id === cell.teacherId);
        const isLab = cell.type === 'lab' || cell.type === 'practical';
        const accentColor = isLab ? 'bg-primary' : 'bg-integrity-success';

        if (isLab) div.classList.add('bg-surface-container-highest');

        div.innerHTML = `
          <div class="absolute top-1 left-1 bottom-1 w-1 ${accentColor} rounded-l"></div>
          <div class="ml-2 pl-2 flex flex-col justify-center h-full">
            <span class="font-body-md text-body-md text-on-surface font-semibold">${subject?.name || '?'}${isLab ? ' Lab' : ''}</span>
            <span class="font-caption text-caption text-on-surface-variant">${teacher?.name || '?'}</span>
          </div>`;
      }

      body.appendChild(div);
    }

    teachingIdx++;
  }
}

function renderTeacherGrid(teacherId, timetable, data) {
  const body = document.getElementById('timetable-body');
  if (!body) return;
  body.innerHTML = '';

  const slotLabels = data.slotLabels;
  const breakIndices = data.breakIndices || new Set();
  const numDays = data.days.length;

  let teachingIdx = 0;

  for (let visualSlot = 0; visualSlot < slotLabels.length; visualSlot++) {
    const isBreak = breakIndices.has(visualSlot);

    const timeCell = document.createElement('div');
    timeCell.className = 'border-b border-r border-outline-variant p-2 flex items-center justify-center font-caption text-caption text-on-surface-variant';

    if (isBreak) {
      timeCell.innerHTML = `<span class="italic text-xs">${slotLabels[visualSlot]}</span>`;
      timeCell.style.background = 'rgba(99, 102, 241, 0.08)';
      body.appendChild(timeCell);

      for (let day = 0; day < numDays; day++) {
        const breakCell = document.createElement('div');
        const isLast = day === numDays - 1;
        breakCell.className = `border-b ${isLast ? '' : 'border-r'} border-outline-variant p-1 flex items-center justify-center`;
        breakCell.style.background = 'rgba(99, 102, 241, 0.08)';
        if (day === Math.floor(numDays / 2)) {
          breakCell.innerHTML = `<span class="font-caption text-caption text-primary/60 italic text-xs">${slotLabels[visualSlot] === 'LUNCH BREAK' ? 'Lunch Break' : 'Short Break'}</span>`;
        }
        body.appendChild(breakCell);
      }
      continue;
    }

    timeCell.innerHTML = slotLabels[visualSlot].replace('-', '<br/>');
    body.appendChild(timeCell);

    const slot = teachingIdx;

    for (let day = 0; day < numDays; day++) {
      let cellText = '';
      let cellColor = '';
      let isLabCont = false;
      let found = false;

      // Search all sections for this teacher
      for (const sectionId of Object.keys(timetable)) {
        const cell = timetable[sectionId][day][slot];
        if (cell && cell.teacherId === teacherId) {
          found = true;
          if (cell.type === 'lab_cont') {
            isLabCont = true;
          } else {
            const subject = data.subjects.find(s => s.id === cell.subjectId);
            const section = data.sections.find(s => s.id === sectionId);
            const branch = section ? data.branches.find(b => b.id === section.branchId) : null;
            const isLab = cell.type === 'lab' || cell.type === 'practical';
            cellColor = isLab ? 'bg-primary' : 'bg-integrity-success';

            cellText = `
              <div class="absolute top-1 left-1 bottom-1 w-1 ${cellColor} rounded-l"></div>
              <div class="ml-2 pl-2 flex flex-col justify-center h-full">
                <span class="font-body-md text-body-md text-on-surface font-semibold">${subject?.name || '?'}${isLab ? ' Lab' : ''}</span>
                <span class="font-caption text-caption text-on-surface-variant">${branch?.name || '?'} Sec-${section?.name || '?'}</span>
              </div>`;
          }
          break; // Stop searching once found
        }
      }

      const div = document.createElement('div');
      const isLast = day === numDays - 1;
      div.className = `border-b ${isLast ? '' : 'border-r'} border-outline-variant p-2 relative`;

      if (found) {
        if (isLabCont) {
          div.classList.add('bg-surface-container-highest');
          div.innerHTML = `
            <div class="absolute top-1 left-1 bottom-1 w-1 bg-primary rounded-l"></div>
            <div class="ml-2 pl-2 flex flex-col justify-center h-full">
              <span class="font-caption text-caption text-on-surface-variant italic">(Lab cont.)</span>
            </div>`;
        } else {
          if (cellColor === 'bg-primary') div.classList.add('bg-surface-container-highest');
          div.innerHTML = cellText;
        }
      } else {
        // Not found, maybe it's a rest slot after a lab for this teacher?
        // Let's check the previous slot to see if they were in a lab_cont
        let wasInLabCont = false;
        if (slot > 0) {
          for (const sectionId of Object.keys(timetable)) {
            const prevCell = timetable[sectionId][day][slot - 1];
            if (prevCell && prevCell.teacherId === teacherId && prevCell.type === 'lab_cont') {
              wasInLabCont = true;
              break;
            }
          }
        }

        if (wasInLabCont) {
          div.innerHTML = `<div class="flex items-center justify-center h-full font-caption text-caption text-integrity-success italic">Free Slot</div>`;
          div.classList.add('bg-surface-container-lowest');
        } else {
          div.innerHTML = '';
        }
      }

      body.appendChild(div);
    }

    teachingIdx++;
  }
}

function renderViolationsPanel(result, data) {
  const list = document.getElementById('violations-list');
  if (!list) return;
  list.innerHTML = '';

  const hard = result.fitness.hardDetails || [];
  const soft = result.fitness.softDetails || [];

  if (hard.length === 0 && soft.length === 0) {
    list.innerHTML = `<div class="flex items-center gap-2 text-integrity-success font-body-md text-body-md">
      <span class="material-symbols-outlined text-[16px]">check_circle</span>
      No constraint violations detected.
    </div>`;
    return;
  }

  hard.forEach(v => {
    const el = document.createElement('div');
    el.className = 'flex items-start gap-3 p-3 bg-surface border border-error/20 rounded';
    el.innerHTML = `<span class="material-symbols-outlined text-error text-lg mt-0.5">error</span>
      <div>
        <div class="font-body-md text-body-md text-on-surface font-medium">${v.type}</div>
        <div class="font-caption text-caption text-on-surface-variant mt-1">${v.message}</div>
      </div>`;
    list.appendChild(el);
  });

  soft.forEach(v => {
    const el = document.createElement('div');
    el.className = 'flex items-start gap-3 p-3 bg-surface border border-tertiary/20 rounded';
    el.innerHTML = `<span class="material-symbols-outlined text-tertiary text-lg mt-0.5">warning</span>
      <div>
        <div class="font-body-md text-body-md text-on-surface font-medium">${v.type}</div>
        <div class="font-caption text-caption text-on-surface-variant mt-1">${v.message}</div>
      </div>`;
    list.appendChild(el);
  });
}

// ================================================================
// PAGE: EXPORT
// ================================================================
function initExportPage() {
  const result = loadResult();
  if (!result || !result.timetable) {
    showToast('No timetable generated yet. Go to the Generate page first.', 'error');
    return;
  }

  const data = TimetableData.getAllData();
  const generatedSectionIds = new Set(Object.keys(result.timetable || {}));
  const sections = data.sections.filter(section => generatedSectionIds.has(section.id));
  const generatedBranchIds = new Set(sections.map(section => section.branchId));
  const branches = data.branches.filter(branch => generatedBranchIds.has(branch.id));

  const selBranch = document.getElementById('export-branch-select');
  const selSection = document.getElementById('export-section-select');

  // Populate branches
  if (selBranch) {
    selBranch.innerHTML = '';
    if (branches.length === 0) {
      addDisabledOption(selBranch, 'No generated branches');
    }

    branches.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.text = b.name;
      selBranch.appendChild(opt);
    });
    selBranch.addEventListener('change', () => {
      updateExportSections(selBranch.value, selSection, sections, branches);
      updatePreview(selSection, result, data);
    });
    // Initial populate
    if (selBranch.value) {
      updateExportSections(selBranch.value, selSection, sections, branches);
    }
  }

  if (selSection) {
    selSection.addEventListener('change', () => updatePreview(selSection, result, data));
  }

  // Buttons
  document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    const sid = selSection?.value;
    if (sid) {
      TimetableExport.exportSectionCSV(sid, result.timetable, data);
      showToast('CSV downloaded!', 'success');
    }
  });

  document.getElementById('btn-export-all')?.addEventListener('click', () => {
    TimetableExport.exportAllCSVs(result.timetable, data);
    showToast('Downloading all CSVs...', 'success');
  });

  document.getElementById('btn-print')?.addEventListener('click', () => {
    const sid = selSection?.value;
    if (sid) {
      TimetableExport.printTimetable(sid, result.timetable, data);
    }
  });

  document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
    const sid = selSection?.value;
    if (sid) {
      TimetableExport.printTimetable(sid, result.timetable, data);
    } else {
      showToast('Please select a section to export.', 'error');
    }
  });

  // Initial preview
  setTimeout(() => updatePreview(selSection, result, data), 100);
}

function updateExportSections(branchId, selSection, sections, branches) {
  if (!selSection) return;
  selSection.innerHTML = '';
  const filtered = sections.filter(s => s.branchId === branchId);

  if (filtered.length === 0) {
    addDisabledOption(selSection, 'No generated sections');
    return;
  }

  filtered.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.text = `Sem ${s.semester} — Section ${s.name}`;
    selSection.appendChild(opt);
  });
}

function updatePreview(selSection, result, data) {
  const preview = document.getElementById('export-preview');
  if (!preview) return;
  if (!selSection?.value) {
    preview.innerHTML = `
      <div class="h-full min-h-[240px] flex items-center justify-center text-on-surface-variant font-body-md text-body-md">
        No generated section selected.
      </div>`;
    return;
  }
  preview.innerHTML = TimetableExport.generatePreviewHTML(selSection.value, result.timetable, data);
}
