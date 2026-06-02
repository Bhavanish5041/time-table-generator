// ============================================================
// app.js — Multi-Page Controller
// Detects which page is loaded and initializes the correct logic.
// ============================================================

const RESULT_KEY = 'timetable_generator_result';

document.addEventListener('DOMContentLoaded', () => {

  // Load data from localStorage (or load sample if empty)
  if (!TimetableData.load()) {
    TimetableData.loadSampleData();
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
// PAGE: SETUP (main.html)
// ================================================================
let currentStep = 1;

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
    const containerEl = document.getElementById(stepContainerIds[i-1]);
    
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
              ${[1,2,3,4].map(sem => `
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
  
  selBranch.innerHTML = '<option value="">Select Branch</option>';
  branches.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.text = b.name;
    selBranch.appendChild(opt);
  });
  
  if (currentBranch && branches.find(b => b.id === currentBranch)) {
    selBranch.value = currentBranch;
  } else if (branches.length > 0) {
    selBranch.value = branches[0].id; // Default to first branch
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
  
  // Default semester to 1 if not selected
  if (!selSem.value) selSem.value = '1';
  
  const branchId = selBranch.value;
  const semester = parseInt(selSem.value) || 1;
  
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
  
  // Default semester to 1 if not selected
  if (!selSem.value) selSem.value = '1';
  
  const branchId = selBranch.value;
  const semester = parseInt(selSem.value) || 1;
  
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
  
  const teachers = TimetableData.getTeachers();
  const subjects = TimetableData.getSubjects(); // All subjects available to map
  
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
            ${subjects.map(sub => `
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
        if(teacher) {
            let subjects = Array.isArray(teacher.subjectIds) ? [...teacher.subjectIds] : [];
            if (e.target.checked) {
                if(!subjects.includes(sid)) subjects.push(sid);
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
  // Sync range slider labels
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
      // Validate data first
      const validation = TimetableData.validate();
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
        { populationSize: popSize, maxGenerations: maxGen, mutationRate: mutRate },
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
            showToast('Optimal timetable generated!', 'success');
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
  const sections = data.sections;
  const branches = data.branches;

  // Populate section dropdown
  const selSection = document.getElementById('tt-section-select');
  if (selSection) {
    selSection.innerHTML = '';
    sections.forEach(s => {
      const branch = branches.find(b => b.id === s.branchId);
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.text = `${branch?.name || '?'} Sem-${s.semester} Sec-${s.name}`;
      selSection.appendChild(opt);
    });
    selSection.addEventListener('change', () => renderGrid(selSection.value, result.timetable, data));

    // Render initial
    if (selSection.value) {
      renderGrid(selSection.value, result.timetable, data);
    }
  }

  // Violations
  renderViolationsPanel(result, data);
}

function renderGrid(sectionId, timetable, data) {
  const body = document.getElementById('timetable-body');
  if (!body) return;
  body.innerHTML = '';

  const grid = timetable[sectionId];
  if (!grid) return;

  const slotLabels = data.slotLabels;

  for (let slot = 0; slot < 6; slot++) {
    // Time label cell
    const timeCell = document.createElement('div');
    timeCell.className = 'border-b border-r border-outline-variant p-2 flex items-center justify-center font-caption text-caption text-on-surface-variant';
    timeCell.innerHTML = slotLabels[slot].replace('-', '<br/>');
    body.appendChild(timeCell);

    // Day cells
    for (let day = 0; day < 6; day++) {
      const cell = grid[day][slot];
      const div = document.createElement('div');
      const isLast = day === 5;
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
        const isLab = cell.type === 'lab';
        const accentColor = isLab ? 'bg-primary' : 'bg-integrity-success';

        if (isLab) div.classList.add('bg-surface-container-highest');

        div.innerHTML = `
          <div class="absolute top-1 left-1 bottom-1 w-1 ${accentColor} rounded-l"></div>
          <div class="ml-2 pl-2 flex flex-col justify-center h-full">
            <span class="font-body-md text-body-md text-on-surface font-semibold">${subject?.code || '?'}${isLab ? ' Lab' : ''}</span>
            <span class="font-caption text-caption text-on-surface-variant">${teacher?.name || '?'}</span>
          </div>`;
      }

      body.appendChild(div);
    }
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
  const branches = data.branches;
  const sections = data.sections;

  const selBranch = document.getElementById('export-branch-select');
  const selSection = document.getElementById('export-section-select');

  // Populate branches
  if (selBranch) {
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

  // Initial preview
  setTimeout(() => updatePreview(selSection, result, data), 100);
}

function updateExportSections(branchId, selSection, sections, branches) {
  if (!selSection) return;
  selSection.innerHTML = '';
  const filtered = sections.filter(s => s.branchId === branchId);
  filtered.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.text = `Sem ${s.semester} — Section ${s.name}`;
    selSection.appendChild(opt);
  });
}

function updatePreview(selSection, result, data) {
  const preview = document.getElementById('export-preview');
  if (!preview || !selSection?.value) return;
  preview.innerHTML = TimetableExport.generatePreviewHTML(selSection.value, result.timetable, data);
}
