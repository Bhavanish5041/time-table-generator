// ============================================================
// data.js — Data Models, CRUD, Persistence & Sample Data
// ============================================================

const TimetableData = (() => {
  // ---- Internal State ----
  let branches = [];
  let subjects = [];
  let teachers = [];
  let sections = [];

  const STORAGE_KEY = 'timetable_generator_data_v5';
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const SLOTS_PER_DAY = 8; // Total visual rows (6 teaching + 2 breaks)
  const TEACHING_SLOTS = 6; // Actual schedulable slots
  const SLOT_LABELS = [
    '9:00-10:00', '10:00-11:00', 'SHORT BREAK',
    '11:30-12:30', '12:30-1:30', 'LUNCH BREAK',
    '2:30-3:30', '3:30-4:30'
  ];
  // Indices in SLOT_LABELS that are breaks (not schedulable)
  const BREAK_INDICES = new Set([2, 5]);
  const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

  // ---- ID Generator ----
  let _idCounter = 0;
  function generateId(prefix) {
    _idCounter++;
    return `${prefix}_${Date.now()}_${_idCounter}`;
  }

  // ---- BRANCH CRUD ----
  function addBranch(name, semesters = [1, 2, 3, 4, 5, 6, 7, 8]) {
    const branch = {
      id: generateId('BR'),
      name: name.trim().toUpperCase(),
      semesters: [...semesters]
    };
    branches.push(branch);
    save();
    return branch;
  }

  function updateBranch(id, updates) {
    const branch = branches.find(b => b.id === id);
    if (!branch) return null;
    if (updates.name !== undefined) branch.name = updates.name.trim().toUpperCase();
    if (updates.semesters !== undefined) branch.semesters = [...updates.semesters];
    save();
    return branch;
  }

  function removeBranch(id) {
    // Cascade: remove subjects, sections tied to this branch
    subjects = subjects.filter(s => s.branchId !== id);
    sections = sections.filter(s => s.branchId !== id);
    branches = branches.filter(b => b.id !== id);
    // Clean teacher assignments
    teachers.forEach(t => {
      t.subjectIds = t.subjectIds.filter(sid => subjects.some(s => s.id === sid));
    });
    save();
  }

  function getBranches() {
    return [...branches];
  }

  function getBranchById(id) {
    return branches.find(b => b.id === id) || null;
  }

  // ---- SUBJECT CRUD ----
  function addSubject(name, code, credits, branchId, semester, hasLabFlag, exactTheory, exactLab) {
    const isMath = name.toLowerCase().includes('math') || code.toUpperCase().startsWith('MA');
    const hasLab = hasLabFlag !== undefined ? hasLabFlag : (credits === 4 && !isMath);
    const subject = {
      id: generateId('SUB'),
      name: name.trim(),
      code: code.trim().toUpperCase(),
      credits: credits,
      isLab: hasLab,
      branchId: branchId,
      semester: semester,
      // Derived: weekly theory slots and lab sessions
      theorySlots: exactTheory !== undefined ? exactTheory : (hasLab ? 3 : credits),
      labSessions: exactLab !== undefined ? exactLab : (hasLab ? 1 : 0)
    };
    subjects.push(subject);
    save();
    return subject;
  }

  function updateSubject(id, updates) {
    const subject = subjects.find(s => s.id === id);
    if (!subject) return null;
    if (updates.name !== undefined) subject.name = updates.name.trim();
    if (updates.code !== undefined) subject.code = updates.code.trim().toUpperCase();
    if (updates.credits !== undefined) {
      subject.credits = updates.credits;
      const isMath = subject.name.toLowerCase().includes('math') || subject.code.toUpperCase().startsWith('MA');
      subject.isLab = updates.credits === 4 && !isMath;
      subject.theorySlots = subject.isLab ? 3 : subject.credits;
      subject.labSessions = subject.isLab ? 1 : 0;
    }
    save();
    return subject;
  }

  function removeSubject(id) {
    subjects = subjects.filter(s => s.id !== id);
    // Clean teacher assignments
    teachers.forEach(t => {
      t.subjectIds = t.subjectIds.filter(sid => sid !== id);
    });
    save();
  }

  function getSubjects() {
    return [...subjects];
  }

  function getSubjectById(id) {
    return subjects.find(s => s.id === id) || null;
  }

  function getSubjectsByBranchSem(branchId, semester) {
    return subjects.filter(s => s.branchId === branchId && s.semester === semester);
  }

  // ---- SECTION CRUD ----
  function addSection(name, branchId, semester, strength = 0) {
    const section = {
      id: generateId('SEC'),
      name: name.trim().toUpperCase(),
      branchId: branchId,
      semester: semester,
      strength: strength
    };
    sections.push(section);
    save();
    return section;
  }

  function removeSection(id) {
    sections = sections.filter(s => s.id !== id);
    save();
  }

  function getSections() {
    return [...sections];
  }

  function getSectionsByBranchSem(branchId, semester) {
    return sections.filter(s => s.branchId === branchId && s.semester === semester);
  }

  // ---- TEACHER CRUD ----
  function addTeacher(name, subjectIds = []) {
    const teacher = {
      id: generateId('TCH'),
      name: name.trim(),
      subjectIds: Array.isArray(subjectIds) ? [...subjectIds] : []
    };
    teachers.push(teacher);
    save();
    return teacher;
  }

  function updateTeacher(id, updates) {
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return null;
    if (updates.name !== undefined) teacher.name = updates.name.trim();
    if (updates.subjectIds !== undefined) {
      teacher.subjectIds = Array.isArray(updates.subjectIds) ? [...updates.subjectIds] : [];
    }
    save();
    return teacher;
  }

  function removeTeacher(id) {
    teachers = teachers.filter(t => t.id !== id);
    save();
  }

  function getTeachers() {
    return [...teachers];
  }

  function getTeacherById(id) {
    return teachers.find(t => t.id === id) || null;
  }

  function getTeachersForSubject(subjectId) {
    return teachers.filter(t => t.subjectIds.includes(subjectId));
  }

  // ---- PERSISTENCE ----
  function save() {
    const data = { branches, subjects, teachers, sections, _idCounter };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      branches = data.branches || [];
      if (branches.length === 0) return false; // Force sample data if completely empty

      subjects = data.subjects || [];
      teachers = (data.teachers || []).map(t => ({
        ...t,
        subjectIds: Array.isArray(t.subjectIds) ? t.subjectIds : []
      }));
      sections = data.sections || [];
      _idCounter = data._idCounter || 0;
      
      // Auto-patch: Filter out sections with invalid/corrupted branch IDs
      sections = sections.filter(s => branches.some(b => b.id === s.branchId));
      // Auto-patch: Upgrade branches to support 8 semesters
      for (const branch of branches) {
        if (!branch.semesters || branch.semesters.length < 8) {
          branch.semesters = [1, 2, 3, 4, 5, 6, 7, 8];
        }
      }

      // Auto-patch: Math should never have labs
      for (const sub of subjects) {
        const isMath = sub.name.toLowerCase().includes('math') || (sub.code && sub.code.toUpperCase().startsWith('MA'));
        if (isMath && sub.isLab) {
          sub.isLab = false;
          sub.theorySlots = sub.credits;
          sub.labSessions = 0;
        }
      }

      // Auto-patch: Ensure every branch and semester has at least one default section ("A")
      for (const branch of branches) {
        for (const sem of branch.semesters) {
          const branchSections = sections.filter(s => s.branchId === branch.id && s.semester === sem);
          if (branchSections.length === 0) {
            sections.push({
              id: generateId('SEC'),
              name: 'A',
              branchId: branch.id,
              semester: sem,
              strength: 60
            });
          }
        }
      }

      // Auto-patch: 1:1 Teacher Generation (replace dummy teachers)
      if (teachers.length < 50 && subjects.length > 0) {
        teachers = []; // Wipe the old dummy teachers
        let teacherCounter = 1;
        for (const sub of subjects) {
          const subSections = sections.filter(s => s.branchId === sub.branchId && s.semester === sub.semester);
          for (const sec of subSections) {
            teachers.push({
              id: generateId('TCH'),
              name: `Prof. T${teacherCounter++} (${sub.code} - Sec ${sec.name})`,
              subjectIds: [sub.id]
            });
          }
        }
      }

      save(); // Save the patched data

      return true;
    } catch (e) {
      console.warn('localStorage load failed:', e);
      return false;
    }
  }

  function clearAll() {
    branches = [];
    subjects = [];
    teachers = [];
    sections = [];
    _idCounter = 0;
    localStorage.removeItem(STORAGE_KEY);
  }

  // ---- VALIDATION ----
  function validate(parity = null) {
    const errors = [];
    const warnings = [];

    if (branches.length === 0) {
      errors.push('No branches defined. Add at least one branch.');
    }

    const activeSemesters = parity === 'even' ? [2, 4, 6, 8] : (parity === 'odd' ? [1, 3, 5, 7] : [1, 2, 3, 4, 5, 6, 7, 8]);

    branches.forEach(branch => {
      branch.semesters.filter(sem => activeSemesters.includes(sem)).forEach(sem => {
        const branchSubjects = getSubjectsByBranchSem(branch.id, sem);
        const branchSections = getSectionsByBranchSem(branch.id, sem);

        if (branchSubjects.length === 0) {
          warnings.push(`${branch.name} Sem-${sem}: No subjects defined.`);
        }

        if (branchSections.length === 0 && branchSubjects.length > 0) {
          errors.push(`${branch.name} Sem-${sem}: Has subjects but no sections.`);
        }

        // Check each subject has at least one teacher
        branchSubjects.forEach(sub => {
          const subTeachers = getTeachersForSubject(sub.id);
          if (subTeachers.length === 0) {
            errors.push(`${branch.name} Sem-${sem}: Subject "${sub.name}" has no teacher assigned.`);
          }
        });

        // Check total slots don't exceed available (5 days × 6 teaching slots = 30)
        const totalSlots = branchSubjects.reduce((sum, sub) => {
          // theorySlots = hours of theory per week, labSessions = hours of lab per week
          return sum + sub.theorySlots + sub.labSessions;
        }, 0);

        const maxTeachingSlots = DAYS.length * TEACHING_SLOTS;
        if (totalSlots > maxTeachingSlots) {
          errors.push(
            `${branch.name} Sem-${sem}: Total required slots (${totalSlots}) exceed available ${maxTeachingSlots} slots/week.`
          );
        }


      });
    });

    if (teachers.length === 0) {
      errors.push('No teachers defined. Add at least one teacher.');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // ---- GET ALL DATA (for GA) ----
  function getAllData() {
    return {
      branches: [...branches],
      subjects: [...subjects],
      teachers: [...teachers],
      sections: [...sections],
      days: DAYS,
      slotsPerDay: SLOTS_PER_DAY,
      teachingSlots: TEACHING_SLOTS,
      slotLabels: SLOT_LABELS,
      breakIndices: BREAK_INDICES,
      semesters: SEMESTERS
    };
  }

  /**
   * Get data filtered by semester parity.
   * @param {'odd'|'even'} parity - 'odd' for semesters 1,3; 'even' for 2,4
   * @returns {Object} Same shape as getAllData but filtered
   */
  function getAllDataFiltered(parity) {
    const activeSemesters = parity === 'even' ? [2, 4, 6, 8] : [1, 3, 5, 7];

    const filteredSections = sections.filter(s => activeSemesters.includes(s.semester));
    const filteredSubjects = subjects.filter(s => activeSemesters.includes(s.semester));
    const filteredSubjectIds = new Set(filteredSubjects.map(s => s.id));

    // Only include teachers who teach at least one active subject
    const filteredTeachers = teachers
      .map(t => ({
        ...t,
        subjectIds: t.subjectIds.filter(sid => filteredSubjectIds.has(sid))
      }))
      .filter(t => t.subjectIds.length > 0);

    return {
      branches: [...branches],
      subjects: filteredSubjects,
      teachers: filteredTeachers,
      sections: filteredSections,
      days: DAYS,
      slotsPerDay: SLOTS_PER_DAY,
      teachingSlots: TEACHING_SLOTS,
      slotLabels: SLOT_LABELS,
      breakIndices: BREAK_INDICES,
      semesters: activeSemesters
    };
  }

  // ---- SAMPLE DATA ----
  /**
   * Load sample data asynchronously from the JSON files.
   */
  async function loadSampleData() {
    clearAll();

    try {
      // Fetch data from root since the HTML files are in /frontend/
      const timestamp = Date.now();
      const [deptRes, secRes, subjRes] = await Promise.all([
        fetch(`../departments.json?v=${timestamp}`),
        fetch(`../sections.json?v=${timestamp}`),
        fetch(`../subjects.json?v=${timestamp}`)
      ]);

      const deptDefs = await deptRes.json();
      const secDefs = await secRes.json();
      const subjDefs = await subjRes.json();

      // Create branches
      const branchMap = {};
      for (const dept of deptDefs) {
        const branch = addBranch(dept.name, [1, 2, 3, 4, 5, 6, 7, 8]); // Pass dept.name instead of dept.id so the UI looks correct
        branchMap[dept.id] = branch;
      }

      // Create sections for both odd and even semesters based on the year
      for (const sec of secDefs) {
        const branch = branchMap[sec.department];
        if (!branch) continue;
        const oddSemester = (sec.year - 1) * 2 + 1;
        const evenSemester = oddSemester + 1;
        addSection(sec.section, branch.id, oddSemester, sec.strength || 0);
        addSection(sec.section, branch.id, evenSemester, sec.strength || 0);
      }

      // Ensure every branch and semester has at least one default section ("A")
      for (const key of Object.keys(branchMap)) {
        const branch = branchMap[key];
        for (let sem = 1; sem <= 8; sem++) {
          const branchSections = getSectionsByBranchSem(branch.id, sem);
          if (branchSections.length === 0) {
            addSection('A', branch.id, sem, 60); // Default strength 60
          }
        }
      }

      // Create subjects from the new subjects.json format
      // Format: [ { college, branch, semesters: [ { semester, subjects: [ { name, credits } ] } ] } ]
      const createdSubjects = [];
      for (const branchData of subjDefs) {
        // Handle CSE vs CS mapping if necessary
        const branchId = branchData.branch === 'CSE' ? 'CS' : branchData.branch;
        const branch = branchMap[branchId];
        if (!branch) continue;

        let subjectCounter = 1;
        for (const semData of branchData.semesters) {
          const semester = semData.semester;
          for (const sub of semData.subjects) {
            // Use the code from JSON if available, else generate a placeholder
            const code = sub.code || `${branchId}${semester}0${subjectCounter++}`;
            const hasLabFlag = sub.type ? sub.type.includes('lab') : undefined;
            const newSub = addSubject(sub.name, code, sub.credits, branch.id, semester, hasLabFlag, sub.theory_hours, sub.lab_hours);
            createdSubjects.push(newSub);
          }
        }
      }

      // Generate a unique teacher for EVERY (Subject, Section) pair
      let teacherCounter = 1;
      for (const sub of createdSubjects) {
        const subSections = getSectionsByBranchSem(sub.branchId, sub.semester);
        for (const sec of subSections) {
          addTeacher(`Prof. T${teacherCounter++} (${sub.code} - Sec ${sec.name})`, [sub.id]);
        }
      }

      save();
      console.log('Sample data loaded from JSON successfully.');
      return true;
    } catch (e) {
      console.error('Failed to load JSON data:', e);
      return false;
    }
  }

  // ---- PUBLIC API ----
  return {
    // Constants
    DAYS,
    SLOTS_PER_DAY,
    TEACHING_SLOTS,
    SLOT_LABELS,
    BREAK_INDICES,
    SEMESTERS,

    // Branch
    addBranch, updateBranch, removeBranch, getBranches, getBranchById,

    // Subject
    addSubject, updateSubject, removeSubject, getSubjects,
    getSubjectById, getSubjectsByBranchSem,

    // Section
    addSection, removeSection, getSections, getSectionsByBranchSem,

    // Teacher
    addTeacher, updateTeacher, removeTeacher, getTeachers,
    getTeacherById, getTeachersForSubject,

    // Persistence
    save, load, clearAll,

    // Validation & Data
    validate, getAllData, getAllDataFiltered,

    // Sample
    loadSampleData
  };
})();
