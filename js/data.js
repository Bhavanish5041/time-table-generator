// ============================================================
// data.js — Data Models, CRUD, Persistence & Sample Data
// ============================================================

const TimetableData = (() => {
  // ---- Internal State ----
  let branches = [];
  let subjects = [];
  let teachers = [];
  let sections = [];

  const STORAGE_KEY = 'timetable_generator_data';
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const SLOTS_PER_DAY = 6;
  const SLOT_LABELS = [
    '9:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-1:00', '2:00-3:00', '3:00-4:00'
  ];
  const SEMESTERS = [1, 2, 3, 4];

  // ---- ID Generator ----
  let _idCounter = 0;
  function generateId(prefix) {
    _idCounter++;
    return `${prefix}_${Date.now()}_${_idCounter}`;
  }

  // ---- BRANCH CRUD ----
  function addBranch(name, semesters = [1, 2, 3, 4]) {
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
  function addSubject(name, code, credits, branchId, semester) {
    const hasLab = credits === 4;
    const subject = {
      id: generateId('SUB'),
      name: name.trim(),
      code: code.trim().toUpperCase(),
      credits: credits,
      isLab: hasLab,
      branchId: branchId,
      semester: semester,
      // Derived: weekly theory slots and lab sessions
      theorySlots: hasLab ? 3 : credits,
      labSessions: hasLab ? 1 : 0
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
      subject.isLab = updates.credits === 4;
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
  function addSection(name, branchId, semester) {
    const section = {
      id: generateId('SEC'),
      name: name.trim().toUpperCase(),
      branchId: branchId,
      semester: semester
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
      subjectIds: [...subjectIds]
    };
    teachers.push(teacher);
    save();
    return teacher;
  }

  function updateTeacher(id, updates) {
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return null;
    if (updates.name !== undefined) teacher.name = updates.name.trim();
    if (updates.subjectIds !== undefined) teacher.subjectIds = [...updates.subjectIds];
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
      subjects = data.subjects || [];
      teachers = data.teachers || [];
      sections = data.sections || [];
      _idCounter = data._idCounter || 0;
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
  function validate() {
    const errors = [];
    const warnings = [];

    if (branches.length === 0) {
      errors.push('No branches defined. Add at least one branch.');
    }

    branches.forEach(branch => {
      branch.semesters.forEach(sem => {
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

        // Check total slots don't exceed available (6 days × 6 slots = 36)
        const totalSlots = branchSubjects.reduce((sum, sub) => {
          let slots = sub.theorySlots;
          if (sub.labSessions > 0) {
            // Each lab = 2 slots + 1 rest = effectively 3 slots
            slots += sub.labSessions * 3;
          }
          return sum + slots;
        }, 0);

        if (totalSlots > 36) {
          errors.push(
            `${branch.name} Sem-${sem}: Total required slots (${totalSlots}) exceed available 36 slots/week.`
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
      slotLabels: SLOT_LABELS,
      semesters: SEMESTERS
    };
  }

  // ---- SAMPLE DATA ----
  function loadSampleData() {
    clearAll();

    // Branches
    const cse = addBranch('CSE', [1, 2, 3, 4]);
    const ece = addBranch('ECE', [1, 2, 3, 4]);

    // --- CSE Sem 1 ---
    const cse1_math = addSubject('Engineering Mathematics-I', 'MA101', 4, cse.id, 1);
    const cse1_phy = addSubject('Engineering Physics', 'PH101', 3, cse.id, 1);
    const cse1_cp = addSubject('C Programming', 'CS101', 4, cse.id, 1);
    const cse1_bee = addSubject('Basic Electrical Engg', 'EE101', 3, cse.id, 1);
    const cse1_eng = addSubject('Technical English', 'EN101', 2, cse.id, 1);

    // --- CSE Sem 2 ---
    const cse2_math = addSubject('Engineering Mathematics-II', 'MA201', 4, cse.id, 2);
    const cse2_chem = addSubject('Engineering Chemistry', 'CH201', 3, cse.id, 2);
    const cse2_ds = addSubject('Data Structures', 'CS201', 4, cse.id, 2);
    const cse2_dld = addSubject('Digital Logic Design', 'CS202', 3, cse.id, 2);
    const cse2_evs = addSubject('Environmental Science', 'EV201', 2, cse.id, 2);

    // --- CSE Sem 3 ---
    const cse3_math = addSubject('Discrete Mathematics', 'MA301', 3, cse.id, 3);
    const cse3_oop = addSubject('Object Oriented Programming', 'CS301', 4, cse.id, 3);
    const cse3_os = addSubject('Operating Systems', 'CS302', 4, cse.id, 3);
    const cse3_dbms = addSubject('Database Management', 'CS303', 3, cse.id, 3);
    const cse3_eco = addSubject('Engineering Economics', 'HS301', 2, cse.id, 3);

    // --- CSE Sem 4 ---
    const cse4_algo = addSubject('Design & Analysis of Algorithms', 'CS401', 4, cse.id, 4);
    const cse4_cn = addSubject('Computer Networks', 'CS402', 4, cse.id, 4);
    const cse4_se = addSubject('Software Engineering', 'CS403', 3, cse.id, 4);
    const cse4_toc = addSubject('Theory of Computation', 'CS404', 3, cse.id, 4);
    const cse4_mgt = addSubject('Management Studies', 'HS401', 2, cse.id, 4);

    // --- ECE Sem 1 ---
    const ece1_math = addSubject('Engineering Mathematics-I', 'MA101', 4, ece.id, 1);
    const ece1_phy = addSubject('Engineering Physics', 'PH102', 3, ece.id, 1);
    const ece1_bec = addSubject('Basic Electronics', 'EC101', 4, ece.id, 1);
    const ece1_bee = addSubject('Basic Electrical Engg', 'EE102', 3, ece.id, 1);
    const ece1_eng = addSubject('Technical English', 'EN102', 2, ece.id, 1);

    // --- ECE Sem 2 ---
    const ece2_math = addSubject('Engineering Mathematics-II', 'MA202', 4, ece.id, 2);
    const ece2_ss = addSubject('Signals & Systems', 'EC201', 3, ece.id, 2);
    const ece2_edc = addSubject('Electronic Devices & Circuits', 'EC202', 4, ece.id, 2);
    const ece2_ntw = addSubject('Network Theory', 'EC203', 3, ece.id, 2);
    const ece2_evs = addSubject('Environmental Science', 'EV202', 2, ece.id, 2);

    // --- ECE Sem 3 ---
    const ece3_ac = addSubject('Analog Circuits', 'EC301', 4, ece.id, 3);
    const ece3_dc = addSubject('Digital Communication', 'EC302', 3, ece.id, 3);
    const ece3_emft = addSubject('Electromagnetic Field Theory', 'EC303', 3, ece.id, 3);
    const ece3_mp = addSubject('Microprocessors', 'EC304', 4, ece.id, 3);
    const ece3_prob = addSubject('Probability & Statistics', 'MA302', 2, ece.id, 3);

    // --- ECE Sem 4 ---
    const ece4_vlsi = addSubject('VLSI Design', 'EC401', 4, ece.id, 4);
    const ece4_dsp = addSubject('Digital Signal Processing', 'EC402', 3, ece.id, 4);
    const ece4_comm = addSubject('Communication Systems', 'EC403', 4, ece.id, 4);
    const ece4_ctrl = addSubject('Control Systems', 'EC404', 3, ece.id, 4);
    const ece4_mgt = addSubject('Management Studies', 'HS402', 2, ece.id, 4);

    // --- Sections ---
    // CSE: 2 sections per semester
    [1, 2, 3, 4].forEach(sem => {
      addSection('A', cse.id, sem);
      addSection('B', cse.id, sem);
    });
    // ECE: 1 section per semester
    [1, 2, 3, 4].forEach(sem => {
      addSection('A', ece.id, sem);
    });

    // --- Teachers ---
    // Math teachers (shared across branches)
    const tMath1 = addTeacher('Dr. Sharma', [cse1_math.id, ece1_math.id]);
    const tMath2 = addTeacher('Dr. Iyer', [cse1_math.id, cse2_math.id, ece2_math.id]);
    const tMath3 = addTeacher('Prof. Gupta', [cse2_math.id, cse3_math.id, ece3_prob.id]);
    const tMath4 = addTeacher('Dr. Reddy', [ece1_math.id, ece2_math.id]);

    // Physics / Chemistry
    const tPhy1 = addTeacher('Dr. Kumar', [cse1_phy.id, ece1_phy.id]);
    const tPhy2 = addTeacher('Dr. Singh', [cse1_phy.id, ece1_phy.id]);
    const tChem = addTeacher('Dr. Patel', [cse2_chem.id]);
    const tChem2 = addTeacher('Dr. Ananya', [cse2_chem.id]);

    // CSE teachers
    const tCS1 = addTeacher('Prof. Anil', [cse1_cp.id, cse2_ds.id]);
    const tCS2 = addTeacher('Prof. Meena', [cse1_cp.id, cse3_oop.id]);
    const tCS3 = addTeacher('Dr. Verma', [cse2_ds.id, cse3_os.id]);
    const tCS4 = addTeacher('Prof. Kavitha', [cse2_dld.id, cse3_dbms.id]);
    const tCS5 = addTeacher('Dr. Ramesh', [cse3_os.id, cse4_algo.id]);
    const tCS6 = addTeacher('Prof. Deepa', [cse3_oop.id, cse4_cn.id]);
    const tCS7 = addTeacher('Dr. Mohan', [cse4_algo.id, cse4_se.id]);
    const tCS8 = addTeacher('Prof. Lakshmi', [cse4_cn.id, cse4_toc.id]);
    const tCS9 = addTeacher('Dr. Suresh', [cse3_dbms.id, cse4_se.id]);
    const tCS10 = addTeacher('Prof. Arjun', [cse2_dld.id, cse4_toc.id]);

    // EE teachers
    const tEE1 = addTeacher('Prof. Bhat', [cse1_bee.id, ece1_bee.id]);
    const tEE2 = addTeacher('Dr. Rao', [cse1_bee.id, ece1_bee.id]);

    // English / Humanities
    const tEng1 = addTeacher('Prof. Priya', [cse1_eng.id, ece1_eng.id]);
    const tEng2 = addTeacher('Prof. Neha', [cse1_eng.id, ece1_eng.id]);
    const tEvs = addTeacher('Dr. Sunita', [cse2_evs.id, ece2_evs.id]);
    const tEco = addTeacher('Prof. Ashok', [cse3_eco.id]);
    const tMgt1 = addTeacher('Dr. Joshi', [cse4_mgt.id, ece4_mgt.id]);
    const tMgt2 = addTeacher('Prof. Das', [cse4_mgt.id, ece4_mgt.id]);

    // ECE teachers
    const tEC1 = addTeacher('Dr. Prasad', [ece1_bec.id, ece2_edc.id]);
    const tEC2 = addTeacher('Prof. Swathi', [ece1_bec.id, ece3_ac.id]);
    const tEC3 = addTeacher('Dr. Naik', [ece2_ss.id, ece3_dc.id]);
    const tEC4 = addTeacher('Prof. Hegde', [ece2_edc.id, ece3_mp.id]);
    const tEC5 = addTeacher('Dr. Murthy', [ece2_ntw.id, ece3_emft.id]);
    const tEC6 = addTeacher('Prof. Kiran', [ece3_ac.id, ece4_vlsi.id]);
    const tEC7 = addTeacher('Dr. Anand', [ece3_mp.id, ece4_dsp.id]);
    const tEC8 = addTeacher('Prof. Rekha', [ece4_vlsi.id, ece4_comm.id]);
    const tEC9 = addTeacher('Dr. Srinivas', [ece4_dsp.id, ece4_ctrl.id]);
    const tEC10 = addTeacher('Prof. Bharathi', [ece3_dc.id, ece4_comm.id]);
    const tEC11 = addTeacher('Dr. Nair', [ece3_emft.id, ece4_ctrl.id]);

    save();
    console.log('Sample data loaded successfully.');
    return true;
  }

  // ---- PUBLIC API ----
  return {
    // Constants
    DAYS,
    SLOTS_PER_DAY,
    SLOT_LABELS,
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
    validate, getAllData,

    // Sample
    loadSampleData
  };
})();
