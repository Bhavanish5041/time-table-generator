// ============================================================
// constraints.js — Hard & Soft Constraint Evaluators
// ============================================================

const Constraints = (() => {

  // ---- HARD CONSTRAINT PENALTIES ----
  const HARD_PENALTY = 1000;

  // ---- SOFT CONSTRAINT PENALTIES ----
  const SOFT_TEACHER_FATIGUE = 5;        // >4 consecutive hours
  const SOFT_SUBJECT_CLUSTERING = 3;     // Same subject twice on same day
  const SOFT_UNEVEN_LOAD = 2;            // Uneven distribution across days
  const SOFT_IDLE_GAP = 4;              // Gaps in a section's schedule

  // Valid lab start positions (teaching slots that begin a physical block).
  // Slot 0 = 9:00-10:00, 1 = 10:00-11:00, [SHORT BREAK], 2 = 11:30-12:30, 3 = 12:30-1:30, [LUNCH], 4 = 2:30-3:30, 5 = 3:30-4:30
  // Physical blocks: [0,1], [2,3], [4,5]
  const VALID_LAB_STARTS = new Set([0, 2, 4]);

  /**
   * Check all hard constraints and return violations.
   * @param {Object} timetable - Map<sectionId, grid[5][6]> where each cell is null or {subjectId, teacherId, type}
   * @param {Object} data - The full dataset from TimetableData.getAllData()
   * @returns {Object} { violations: Array, count: number, penalty: number }
   */
  function checkHardConstraints(timetable, data) {
    const violations = [];

    // 1. Teacher double-booking: same teacher in same (day, slot) across any sections
    violations.push(...checkTeacherConflicts(timetable, data));

    // 2. Lab not in consecutive slots
    violations.push(...checkLabConsecutive(timetable, data));

    // 3. Lab must not cross a break boundary
    violations.push(...checkLabBreakSplit(timetable, data));

    // 4. Teacher section limit: 1 teacher → max 1 section per subject per semester
    violations.push(...checkTeacherSectionLimit(timetable, data));

    return {
      violations,
      count: violations.length,
      penalty: violations.length * HARD_PENALTY
    };
  }

  /**
   * Check teacher is not double-booked: same teacher in same timeslot across any sections.
   */
  function checkTeacherConflicts(timetable, data) {
    const violations = [];
    const numDays = data.days.length;
    const numSlots = data.teachingSlots || 6;

    for (let day = 0; day < numDays; day++) {
      for (let slot = 0; slot < numSlots; slot++) {
        const teacherSlotMap = {}; // teacherId → sectionId

        for (const sectionId of Object.keys(timetable)) {
          const cell = timetable[sectionId][day][slot];
          if (cell && cell.teacherId) {
            if (teacherSlotMap[cell.teacherId]) {
              const teacher = data.teachers.find(t => t.id === cell.teacherId);
              violations.push({
                type: 'TEACHER_CONFLICT',
                message: `Teacher "${teacher?.name || cell.teacherId}" double-booked on ${data.days[day]} Slot ${slot + 1}`,
                day, slot,
                teacherId: cell.teacherId,
                sections: [teacherSlotMap[cell.teacherId], sectionId]
              });
            } else {
              teacherSlotMap[cell.teacherId] = sectionId;
            }
          }
        }
      }
    }
    return violations;
  }

  /**
   * Check that lab sessions occupy consecutive slots (lab followed by lab_cont).
   */
  function checkLabConsecutive(timetable, data) {
    const violations = [];

    for (const sectionId of Object.keys(timetable)) {
      const grid = timetable[sectionId];
      for (let day = 0; day < data.days.length; day++) {
        for (let slot = 0; slot < (data.teachingSlots || 6); slot++) {
          const cell = grid[day][slot];
          if (cell && cell.type === 'lab') {
            // A lab start should have the same subject in the next slot
            if (slot + 1 >= (data.teachingSlots || 6)) {
              violations.push({
                type: 'LAB_OVERFLOW',
                message: `Lab at last slot cannot extend — ${data.days[day]} Section ${sectionId}`,
                day, slot, sectionId
              });
            } else {
              const nextCell = grid[day][slot + 1];
              if (!nextCell || nextCell.subjectId !== cell.subjectId || nextCell.type !== 'lab_cont') {
                violations.push({
                  type: 'LAB_NOT_CONSECUTIVE',
                  message: `Lab not consecutive on ${data.days[day]} Slot ${slot + 1} — Section ${sectionId}`,
                  day, slot, sectionId
                });
              }
            }
          }
        }
      }
    }
    return violations;
  }

  /**
   * Check that lab sessions don't cross break boundaries.
   * Labs must start at a valid lab start position (0, 2, or 4).
   * This ensures a 2-hour lab at slots 0-1 is 9:00-11:00 (continuous),
   * NOT slots 1-2 which would be 10:00-11:00 + [BREAK] + 11:30-12:30 (split).
   */
  function checkLabBreakSplit(timetable, data) {
    const violations = [];

    for (const sectionId of Object.keys(timetable)) {
      const grid = timetable[sectionId];
      for (let day = 0; day < data.days.length; day++) {
        for (let slot = 0; slot < (data.teachingSlots || 6); slot++) {
          const cell = grid[day][slot];
          if (cell && cell.type === 'lab') {
            // Lab must start at an even slot (0, 2, or 4) to avoid crossing breaks
            if (!VALID_LAB_STARTS.has(slot)) {
              const subject = data.subjects.find(s => s.id === cell.subjectId);
              violations.push({
                type: 'LAB_BREAK_SPLIT',
                message: `Lab "${subject?.name || cell.subjectId}" crosses a break on ${data.days[day]} — must start at 9:00, 11:30, or 2:30`,
                day, slot, sectionId
              });
            }
          }
        }
      }
    }
    return violations;
  }

  /**
   * Check teacher teaches at most 1 section per subject per semester.
   * Rule: For a single semester, 1 teacher has only 1 section.
   * Interpretation: A teacher shouldn't teach the SAME subject to different sections in the same semester.
   * But since the rule says "1 teacher → only 1 section per semester",
   * we interpret it as: a teacher cannot be assigned to more than 1 section within the same (branch, semester) combination.
   */
  function checkTeacherSectionLimit(timetable, data) {
    const violations = [];

    // Structured approach
    const teacherAssignments = {}; // teacherId → [{branchId, semester, sectionId}]

    for (const sectionId of Object.keys(timetable)) {
      const section = data.sections.find(s => s.id === sectionId);
      if (!section) continue;

      const grid = timetable[sectionId];
      const teachersInSection = new Set();

      for (let day = 0; day < data.days.length; day++) {
        for (let slot = 0; slot < (data.teachingSlots || 6); slot++) {
          const cell = grid[day][slot];
          if (cell && cell.teacherId) {
            teachersInSection.add(cell.teacherId);
          }
        }
      }

      for (const teacherId of teachersInSection) {
        if (!teacherAssignments[teacherId]) {
          teacherAssignments[teacherId] = [];
        }
        teacherAssignments[teacherId].push({
          branchId: section.branchId,
          semester: section.semester,
          sectionId: sectionId
        });
      }
    }

    // Check: for each teacher, in each (branchId, semester), they should appear in at most 1 section
    for (const [teacherId, assignments] of Object.entries(teacherAssignments)) {
      const groupKey = {};
      for (const a of assignments) {
        const k = `${a.branchId}|${a.semester}`;
        if (!groupKey[k]) groupKey[k] = [];
        groupKey[k].push(a.sectionId);
      }

      for (const [k, sectionIds] of Object.entries(groupKey)) {
        if (sectionIds.length > 1) {
          const teacher = data.teachers.find(t => t.id === teacherId);
          const [branchId, sem] = k.split('|');
          const branch = data.branches.find(b => b.id === branchId);
          violations.push({
            type: 'TEACHER_MULTI_SECTION',
            message: `Teacher "${teacher?.name}" assigned to ${sectionIds.length} sections in ${branch?.name} Sem-${sem}`,
            teacherId,
            branchId,
            semester: parseInt(sem),
            sectionIds
          });
        }
      }
    }

    return violations;
  }

  /**
   * Evaluate soft constraints and return penalties.
   * @param {Object} timetable
   * @param {Object} data
   * @returns {Object} { penalties: Array, totalPenalty: number }
   */
  function checkSoftConstraints(timetable, data) {
    const penalties = [];

    // 1. Teacher fatigue: >4 consecutive teaching hours
    penalties.push(...checkTeacherFatigue(timetable, data));

    // 2. Subject clustering: same subject more than once on same day for a section
    penalties.push(...checkSubjectClustering(timetable, data));

    // 3. Uneven daily load
    penalties.push(...checkUnevenLoad(timetable, data));

    // 4. Idle gaps in section schedule
    penalties.push(...checkIdleGaps(timetable, data));

    const totalPenalty = penalties.reduce((sum, p) => sum + p.penalty, 0);
    return { penalties, totalPenalty };
  }

  function checkTeacherFatigue(timetable, data) {
    const penalties = [];
    // Build teacher schedule: teacherId → [day][slot] = true/false
    const teacherSchedules = {};

    for (const sectionId of Object.keys(timetable)) {
      const grid = timetable[sectionId];
      for (let day = 0; day < data.days.length; day++) {
        for (let slot = 0; slot < (data.teachingSlots || 6); slot++) {
          const cell = grid[day][slot];
          if (cell && cell.teacherId) {
            if (!teacherSchedules[cell.teacherId]) {
              teacherSchedules[cell.teacherId] = Array.from({ length: data.days.length }, () => Array((data.teachingSlots || 6)).fill(false));
            }
            teacherSchedules[cell.teacherId][day][slot] = true;
          }
        }
      }
    }

    for (const [teacherId, schedule] of Object.entries(teacherSchedules)) {
      for (let day = 0; day < data.days.length; day++) {
        let consecutive = 0;
        for (let slot = 0; slot < (data.teachingSlots || 6); slot++) {
          if (schedule[day][slot]) {
            consecutive++;
            if (consecutive > 4) {
              const teacher = data.teachers.find(t => t.id === teacherId);
              penalties.push({
                type: 'TEACHER_FATIGUE',
                message: `${teacher?.name}: ${consecutive} consecutive hours on ${data.days[day]}`,
                penalty: SOFT_TEACHER_FATIGUE
              });
            }
          } else {
            consecutive = 0;
          }
        }
      }
    }
    return penalties;
  }

  function checkSubjectClustering(timetable, data) {
    const penalties = [];

    for (const sectionId of Object.keys(timetable)) {
      const grid = timetable[sectionId];
      for (let day = 0; day < data.days.length; day++) {
        const subjectCount = {};
        for (let slot = 0; slot < (data.teachingSlots || 6); slot++) {
          const cell = grid[day][slot];
          if (cell && cell.subjectId && cell.type !== 'lab_cont') {
            subjectCount[cell.subjectId] = (subjectCount[cell.subjectId] || 0) + 1;
          }
        }

        for (const [subjectId, count] of Object.entries(subjectCount)) {
          if (count > 1) {
            const subject = data.subjects.find(s => s.id === subjectId);
            // Allow labs (they naturally take 2 slots) but penalize theory duplication
            const theoryCount = count;
            if (subject && !subject.isLab && theoryCount > 1) {
              penalties.push({
                type: 'SUBJECT_CLUSTERING',
                message: `"${subject.name}" appears ${theoryCount} times on ${data.days[day]}`,
                penalty: SOFT_SUBJECT_CLUSTERING * (theoryCount - 1)
              });
            }
          }
        }
      }
    }
    return penalties;
  }

  function checkUnevenLoad(timetable, data) {
    const penalties = [];

    for (const sectionId of Object.keys(timetable)) {
      const grid = timetable[sectionId];
      const dailyCounts = [];

      for (let day = 0; day < data.days.length; day++) {
        let count = 0;
        for (let slot = 0; slot < (data.teachingSlots || 6); slot++) {
          if (grid[day][slot] !== null) count++;
        }
        dailyCounts.push(count);
      }

      const avg = dailyCounts.reduce((a, b) => a + b, 0) / data.days.length;
      const maxDev = Math.max(...dailyCounts.map(c => Math.abs(c - avg)));

      if (maxDev > 2) {
        penalties.push({
          type: 'UNEVEN_LOAD',
          message: `Section ${sectionId}: Daily load varies by ${maxDev.toFixed(1)} from average`,
          penalty: SOFT_UNEVEN_LOAD * Math.floor(maxDev - 1)
        });
      }
    }
    return penalties;
  }

  function checkIdleGaps(timetable, data) {
    const penalties = [];

    for (const sectionId of Object.keys(timetable)) {
      const grid = timetable[sectionId];

      for (let day = 0; day < data.days.length; day++) {
        let firstClass = -1;
        let lastClass = -1;
        let classCount = 0;

        for (let slot = 0; slot < (data.teachingSlots || 6); slot++) {
          if (grid[day][slot] !== null) {
            if (firstClass === -1) firstClass = slot;
            lastClass = slot;
            classCount++;
          }
        }

        if (firstClass !== -1 && lastClass !== -1) {
          const span = lastClass - firstClass + 1;
          const gaps = span - classCount;
          // Penalize idle gaps
          if (gaps > 0) {
            penalties.push({
              type: 'IDLE_GAP',
              message: `Section ${sectionId}: ${gaps} idle gap(s) on ${data.days[day]}`,
              penalty: SOFT_IDLE_GAP * gaps
            });
          }
        }
      }
    }
    return penalties;
  }

  /**
   * Full fitness evaluation: lower = better (0 = perfect)
   */
  function evaluateFitness(timetable, data) {
    const hard = checkHardConstraints(timetable, data);
    const soft = checkSoftConstraints(timetable, data);

    return {
      fitness: hard.penalty + soft.totalPenalty,
      hardViolations: hard.count,
      softPenalty: soft.totalPenalty,
      hardDetails: hard.violations,
      softDetails: soft.penalties
    };
  }

  /**
   * Quick fitness score (just the number, for GA inner loop performance)
   */
  function quickFitness(timetable, data) {
    let penalty = 0;

    // --- Quick hard constraints ---
    // Teacher conflicts
    const numDays = data.days.length;
    const numSlots = data.teachingSlots || 6;
    for (let day = 0; day < numDays; day++) {
      for (let slot = 0; slot < numSlots; slot++) {
        const seen = new Set();
        for (const sectionId of Object.keys(timetable)) {
          const cell = timetable[sectionId][day][slot];
          if (cell && cell.teacherId) {
            if (seen.has(cell.teacherId)) {
              penalty += HARD_PENALTY;
            }
            seen.add(cell.teacherId);
          }
        }
      }
    }

    // Lab consecutive check + break-split check
    for (const sectionId of Object.keys(timetable)) {
      const grid = timetable[sectionId];
      for (let day = 0; day < numDays; day++) {
        for (let slot = 0; slot < numSlots; slot++) {
          const cell = grid[day][slot];
          if (cell && cell.type === 'lab') {
            // Must have lab_cont in next slot
            if (slot + 1 >= numSlots || !grid[day][slot + 1] || grid[day][slot + 1].type !== 'lab_cont') {
              penalty += HARD_PENALTY;
            }
            // Must start at a valid position (0, 2, or 4) to avoid crossing breaks
            if (!VALID_LAB_STARTS.has(slot)) {
              penalty += HARD_PENALTY;
            }
          }
        }
      }
    }

    // Teacher multi-section (simplified check via map)
    const teacherBranchSem = {};
    for (const sectionId of Object.keys(timetable)) {
      const section = data.sections.find(s => s.id === sectionId);
      if (!section) continue;
      const grid = timetable[sectionId];
      const teachersHere = new Set();
      for (let day = 0; day < numDays; day++) {
        for (let slot = 0; slot < numSlots; slot++) {
          const cell = grid[day][slot];
          if (cell && cell.teacherId) teachersHere.add(cell.teacherId);
        }
      }
      for (const tid of teachersHere) {
        const key = `${tid}|${section.branchId}|${section.semester}`;
        teacherBranchSem[key] = (teacherBranchSem[key] || 0) + 1;
      }
    }
    for (const count of Object.values(teacherBranchSem)) {
      if (count > 1) penalty += HARD_PENALTY * (count - 1);
    }

    // --- Quick soft constraints ---
    for (const sectionId of Object.keys(timetable)) {
      const grid = timetable[sectionId];
      for (let day = 0; day < numDays; day++) {
        // Subject clustering
        const subjCount = {};
        let firstClass = -1, lastClass = -1, classCount = 0;
        for (let slot = 0; slot < numSlots; slot++) {
          const cell = grid[day][slot];
          if (cell) {
            if (cell.type !== 'lab_cont') {
              subjCount[cell.subjectId] = (subjCount[cell.subjectId] || 0) + 1;
            }
            if (firstClass === -1) firstClass = slot;
            lastClass = slot;
            classCount++;
          }
        }
        for (const c of Object.values(subjCount)) {
          if (c > 1) penalty += SOFT_SUBJECT_CLUSTERING * (c - 1);
        }
        // Idle gaps
        if (firstClass !== -1) {
          const gaps = (lastClass - firstClass + 1) - classCount;
          if (gaps > 0) penalty += SOFT_IDLE_GAP * gaps;
        }
      }
    }

    return penalty;
  }

  // ---- PUBLIC API ----
  return {
    checkHardConstraints,
    checkSoftConstraints,
    evaluateFitness,
    quickFitness,
    // Expose individual checks for UI
    checkTeacherConflicts,
    checkLabConsecutive,
    checkLabBreakSplit,
    checkTeacherSectionLimit,
    checkTeacherFatigue,
    checkSubjectClustering,
    checkUnevenLoad,
    checkIdleGaps
  };
})();
