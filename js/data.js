// ============================================================
// data.js — Data Models, CRUD, Persistence & Sample Data
// ============================================================

const TimetableData = (() => {
  // ---- Internal State ----
  let branches = [];
  let subjects = [];
  let teachers = [];
  let sections = [];
  let rooms = [];
  let timeslots = [];

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
      // If isLab is explicitly provided, use it; otherwise auto-detect
      if (updates.isLab !== undefined) {
        subject.isLab = updates.isLab;
      } else {
        const isMath = subject.name.toLowerCase().includes('math') || subject.code.toUpperCase().startsWith('MA');
        subject.isLab = updates.credits === 4 && !isMath;
      }
      subject.theorySlots = subject.isLab ? 3 : subject.credits;
      subject.labSessions = subject.isLab ? 2 : 0;
    } else if (updates.isLab !== undefined) {
      // isLab changed without credits changing
      subject.isLab = updates.isLab;
      subject.theorySlots = subject.isLab ? 3 : subject.credits;
      subject.labSessions = subject.isLab ? 2 : 0;
    }
    // Allow overriding classes per week independently
    if (updates.theorySlots !== undefined) {
      subject.theorySlots = updates.theorySlots;
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
    const data = { branches, subjects, teachers, sections, rooms, timeslots, _idCounter };
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
      rooms = data.rooms || [];
      timeslots = data.timeslots || [];
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
    rooms = [];
    timeslots = [];
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

        // Check each subject has at least one teacher (warning only — teachers are auto-generated)
        branchSubjects.forEach(sub => {
          const subTeachers = getTeachersForSubject(sub.id);
          if (subTeachers.length === 0) {
            warnings.push(`${branch.name} Sem-${sem}: Subject "${sub.name}" has no teacher assigned (will use placeholder).`);
          }
        });

        // Check total slots don't exceed available (5 days × 6 teaching slots = 30)
        const totalSlots = branchSubjects.reduce((sum, sub) => {
          // theorySlots = hours of theory per week, labSessions = hours of lab per week
          return sum + sub.theorySlots + sub.labSessions;
        }, 0);

        const maxTeachingSlots = DAYS.length * TEACHING_SLOTS;
        if (totalSlots > maxTeachingSlots) {
          warnings.push(
            `${branch.name} Sem-${sem}: Total required slots (${totalSlots}) exceed available ${maxTeachingSlots} slots/week.`
          );
        }


      });
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  // ---- GET ALL DATA (for GA) ----
  function getAllData() {
    return {
      branches: [...branches],
      subjects: [...subjects],
      teachers: [...teachers],
      sections: [...sections],
      rooms: [...rooms],
      timeslots: [...timeslots],
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
      rooms: [...rooms],
      timeslots: [...timeslots],
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
   * Load data from the New-Data/ directory using the curriculum-driven model.
   * Data sources:
   *   - New-Data/departments.json → branches
   *   - New-Data/sections.json → sections (mapped to semesters via curriculum)
   *   - New-Data/Y1_courses.json..Y4_courses.json → course catalog
   *   - New-Data/curriculum.json → section↔course mapping
   *   - New-Data/rooms.json → room inventory
   *   - New-Data/timeslot.json → timeslot definitions
   */
  async function loadSampleData() {
    clearAll();

    try {
      const timestamp = Date.now();
      const basePath = '../New-Data';

      // Fetch all data files in parallel
      const [deptRes, secRes, y1Res, y2Res, y3Res, y4Res, currRes, roomRes, tsRes] = await Promise.all([
        fetch(`${basePath}/departments.json?v=${timestamp}`),
        fetch(`${basePath}/sections.json?v=${timestamp}`),
        fetch(`${basePath}/Y1_courses.json?v=${timestamp}`),
        fetch(`${basePath}/Y2_courses.json?v=${timestamp}`),
        fetch(`${basePath}/Y3_courses.json?v=${timestamp}`),
        fetch(`${basePath}/Y4_courses.json?v=${timestamp}`),
        fetch(`${basePath}/curriculum.json?v=${timestamp}`),
        fetch(`${basePath}/rooms.json?v=${timestamp}`),
        fetch(`${basePath}/timeslot.json?v=${timestamp}`)
      ]);

      const deptDefs = await deptRes.json();
      const secDefs = await secRes.json();
      const y1Courses = await y1Res.json();
      const y2Courses = await y2Res.json();
      const y3Courses = await y3Res.json();
      const y4Courses = await y4Res.json();
      const curriculumDefs = await currRes.json();
      const roomDefs = await roomRes.json();
      const timeslotDefs = await tsRes.json();

      // Store rooms and timeslots for future use
      rooms = roomDefs || [];
      timeslots = timeslotDefs || [];

      // ---- 1. Build course lookup map from all Y*_courses files ----
      const allCourses = [...y1Courses, ...y2Courses, ...y3Courses, ...y4Courses];
      const courseLookup = {};
      for (const course of allCourses) {
        courseLookup[course.id] = course;
      }
      console.log(`Loaded ${allCourses.length} courses into lookup (${Object.keys(courseLookup).length} unique).`);

      // ---- 2. Create branches from departments ----
      const branchMap = {}; // dept.id → internal branch object
      for (const dept of deptDefs) {
        const branch = addBranch(dept.name, [1, 2, 3, 4, 5, 6, 7, 8]);
        branchMap[dept.id] = branch;
      }

      // ---- 3. Create sections from sections.json ----
      // Each section entry has: id, department, year, section, strength
      // We need to figure out which semesters each section participates in via curriculum.json
      const sectionIdToBranch = {}; // e.g. "CI_2A" → internal branch object
      const sectionDefMap = {};     // e.g. "CI_2A" → { ...secDef }
      for (const sec of secDefs) {
        const branch = branchMap[sec.department];
        if (!branch) {
          console.warn(`Section ${sec.id}: department "${sec.department}" not found in departments.json, skipping.`);
          continue;
        }
        sectionIdToBranch[sec.id] = branch;
        sectionDefMap[sec.id] = sec;
      }

      // Build a map: sectionId → Set of semesters from curriculum.json
      const sectionSemesters = {}; // e.g. "CI_2A" → Set([3, 4])
      for (const entry of curriculumDefs) {
        for (const secId of entry.section_id) {
          if (!sectionSemesters[secId]) sectionSemesters[secId] = new Set();
          sectionSemesters[secId].add(entry.semester);
        }
      }

      // Now create internal section objects for each (sectionDef, semester) pair
      const internalSectionMap = {}; // "CI_2A|3" → internal section object
      for (const [secId, sems] of Object.entries(sectionSemesters)) {
        const branch = sectionIdToBranch[secId];
        const secDef = sectionDefMap[secId];
        if (!branch || !secDef) continue;

        for (const sem of sems) {
          const internalSec = addSection(secDef.section, branch.id, sem, secDef.strength || 60);
          internalSectionMap[`${secId}|${sem}`] = internalSec;
        }
      }

      // ---- 4. Create subjects per section using curriculum entries ----
      // Track created subjects to avoid duplicates: key = "branchId|semester|courseId"
      const subjectDedup = {}; // "branchId|semester|courseId" → internal subject object
      const createdSubjects = [];

      for (const entry of curriculumDefs) {
        const semester = entry.semester;

        for (const courseEntry of entry.courses) {
          const courseId = courseEntry.course_id;
          const courseDef = courseLookup[courseId];

          if (!courseDef) {
            console.warn(`Curriculum references course "${courseId}" but it's not in any Y*_courses.json, skipping.`);
            continue;
          }

          // Determine which branch(es) this course applies to via the section_ids
          const branchesForCourse = new Set();
          for (const secId of entry.section_id) {
            const branch = sectionIdToBranch[secId];
            if (branch) branchesForCourse.add(branch);
          }

          for (const branch of branchesForCourse) {
            const dedupKey = `${branch.id}|${semester}|${courseId}`;
            if (subjectDedup[dedupKey]) continue; // Already created

            // Determine subject properties from course type
            const courseType = courseDef.type || 'theory';
            const theoryHours = courseDef.theory_hours || 0;
            const labHours = courseDef.lab_hours || 0;

            let isLab = false;
            let theorySlots = theoryHours;
            let labSessions = 0;

            if (courseType === 'theory') {
              isLab = false;
              theorySlots = theoryHours || courseDef.credits;
              labSessions = 0;
            } else if (courseType === 'lab') {
              isLab = true;
              theorySlots = 0;
              labSessions = labHours || 2;
            } else if (courseType === 'theory_lab') {
              isLab = true;
              theorySlots = theoryHours || 3;
              labSessions = labHours || 2;
            } else if (courseType === 'audit') {
              isLab = labHours > 0;
              theorySlots = theoryHours || 0;
              labSessions = labHours || 2;
            }

            const sub = {
              id: generateId('SUB'),
              name: courseDef.name,
              code: courseId,
              credits: courseDef.credits,
              isLab: isLab,
              branchId: branch.id,
              semester: semester,
              theorySlots: theorySlots,
              labSessions: labSessions,
              isElective: courseEntry.is_elective || false
            };

            subjects.push(sub);
            subjectDedup[dedupKey] = sub;
            createdSubjects.push(sub);
          }
        }
      }

      // ---- 5. Auto-generate placeholder teachers (one per subject-section pair) ----
      // Faculty will be loaded from faculty.json later; for now create TBD placeholders
      let teacherCounter = 1;
      for (const sub of createdSubjects) {
        const subSections = getSectionsByBranchSem(sub.branchId, sub.semester);
        for (const sec of subSections) {
          addTeacher(`TBD-${sub.code}-Sec${sec.name}`, [sub.id]);
          teacherCounter++;
        }
      }

      save();
      console.log(`Data loaded: ${branches.length} branches, ${subjects.length} subjects, ${sections.length} sections, ${teachers.length} teachers, ${rooms.length} rooms, ${timeslots.length} timeslots.`);
      return true;
    } catch (e) {
      console.error('Failed to load New-Data:', e);
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
