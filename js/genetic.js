// ============================================================
// genetic.js — Genetic Algorithm Engine for Timetable Generation
// ============================================================

const GeneticAlgorithm = (() => {

  let isRunning = false;
  let shouldStop = false;
  let bestResult = null;
  let onProgress = null;
  let onComplete = null;

  // Teaching slot pairs that are physically contiguous (no break between them).
  // Slot 0 = 9:00-10:00, 1 = 10:00-11:00, [SHORT BREAK], 2 = 11:30-12:30, 3 = 12:30-1:30, [LUNCH], 4 = 2:30-3:30, 5 = 3:30-4:30
  // Valid consecutive pairs: (0,1), (2,3), (4,5)
  // Invalid pairs across breaks: (1,2) has short break, (3,4) has lunch break
  const VALID_LAB_STARTS = [0, 2, 4]; // Teaching slots where a 2-hour lab can start

  function isBasketCourse(data, subjectId) {
    const sub = data.subjects.find(s => s.id === subjectId);
    return sub ? sub.name.toLowerCase().includes('basket') : false;
  }

  function preAllocateBasketCourses(data) {
    const anchors = {}; // format: anchors[semester] = [ {day, slot}, ... ]
    const numDays = data.days.length;
    const numSlots = 6;

    const basketSlotsRequired = {}; // semester -> max theorySlots for any basket course in this sem
    for (const sub of data.subjects) {
      if (sub.name.toLowerCase().includes('basket')) {
        if (!basketSlotsRequired[sub.semester]) basketSlotsRequired[sub.semester] = 0;
        basketSlotsRequired[sub.semester] = Math.max(basketSlotsRequired[sub.semester], sub.theorySlots);
      }
    }

    for (const sem of Object.keys(basketSlotsRequired)) {
      anchors[sem] = [];
      const theorySlots = basketSlotsRequired[sem];
      let placed = 0;
      
      const allSlots = [];
      for (let d = 0; d < numDays; d++) {
        for (let s = 0; s < numSlots; s++) {
          allSlots.push({ day: d, slot: s });
        }
      }
      const attempts = shuffleArray(allSlots);

      for (const { day, slot } of attempts) {
        anchors[sem].push({ day, slot });
        placed++;
        if (placed >= theorySlots) break;
      }
    }
    return anchors;
  }

  /**
   * Build the list of assignments needed for a given section.
   * Returns an array of tasks: { subjectId, teacherId, type: 'theory'|'lab', labHours }
   * Each theory slot is one task. Each lab session produces one 'lab_session' entry
   * with labHours indicating how many consecutive slots it needs.
   */
  function buildSectionTasks(sectionId, data, teacherAssignment) {
    const section = data.sections.find(s => s.id === sectionId);
    if (!section) return [];

    const subjects = data.subjects.filter(
      s => s.branchId === section.branchId && s.semester === section.semester
    );

    const tasks = [];

    for (const subject of subjects) {
      const teacherId = teacherAssignment[`${sectionId}|${subject.id}`];
      if (!teacherId) continue;

      // Theory slots
      for (let i = 0; i < subject.theorySlots; i++) {
        tasks.push({
          subjectId: subject.id,
          teacherId: teacherId,
          type: 'theory'
        });
      }

      // Lab sessions — labSessions holds the number of lab hours
      // 1-hour labs are single-slot practicals (any slot, no consecutive requirement)
      // 2+ hour labs need consecutive block placement
      if (subject.labSessions === 1) {
        tasks.push({
          subjectId: subject.id,
          teacherId: teacherId,
          type: 'practical' // Single-hour lab, placed like theory but shown as lab
        });
      } else if (subject.labSessions >= 2) {
        tasks.push({
          subjectId: subject.id,
          teacherId: teacherId,
          type: 'lab_session',
          labHours: subject.labSessions  // How many consecutive slots this lab needs
        });
      }
    }

    return tasks;
  }

  /**
   * Assign teachers to sections respecting the 1-teacher-per-section-per-semester rule.
   * Returns: Map of `sectionId|subjectId` → teacherId
   */
  function assignTeachersToSections(data) {
    const assignment = {};

    // Group sections by (branchId, semester)
    const groups = {};
    for (const section of data.sections) {
      const key = `${section.branchId}|${section.semester}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(section);
    }

    for (const [key, groupSections] of Object.entries(groups)) {
      const [branchId, sem] = key.split('|');
      const semester = parseInt(sem);
      const subjects = data.subjects.filter(
        s => s.branchId === branchId && s.semester === semester
      );

      for (const subject of subjects) {
        const availableTeachers = data.teachers.filter(
          t => t.subjectIds.includes(subject.id)
        );

        // Shuffle and assign one teacher per section
        const shuffled = shuffleArray([...availableTeachers]);

        for (let i = 0; i < groupSections.length; i++) {
          const section = groupSections[i];
          const teacher = shuffled[i % shuffled.length]; // Wrap if not enough teachers
          assignment[`${section.id}|${subject.id}`] = teacher.id;
        }
      }
    }

    return assignment;
  }

  /**
   * Create a random chromosome (timetable).
   */
  function createRandomChromosome(data, teacherAssignment, globalBasketSlots) {
    const timetable = {};

    const numDays = data.days.length;
    const numSlots = 6; // Teaching slots per day

    for (const section of data.sections) {
      // Initialize empty grid
      const grid = Array.from({ length: numDays }, () => Array(numSlots).fill(null));
      const tasks = buildSectionTasks(section.id, data, teacherAssignment);

      // Separate labs, theory, and basket tasks
      const labTasks = tasks.filter(t => t.type === 'lab_session');
      const basketTasks = tasks.filter(t => (t.type === 'theory' || t.type === 'practical') && isBasketCourse(data, t.subjectId));
      const theoryTasks = tasks.filter(t => (t.type === 'theory' || t.type === 'practical') && !isBasketCourse(data, t.subjectId));

      // 1. Place Basket tasks FIRST using global anchors (1 set of anchors per semester)
      const basketCounts = {};
      for (const bt of basketTasks) {
        const subject = data.subjects.find(s => s.id === bt.subjectId);
        const sem = subject.semester;
        
        if (!basketCounts[bt.subjectId]) basketCounts[bt.subjectId] = 0;
        const index = basketCounts[bt.subjectId]++;
        
        // Find the global anchor for this semester
        if (globalBasketSlots && globalBasketSlots[sem]) {
          const anchor = globalBasketSlots[sem][index];
          if (anchor) {
            grid[anchor.day][anchor.slot] = {
              subjectId: bt.subjectId,
              teacherId: bt.teacherId,
              type: bt.type
            };
          }
        }
      }

      // 2. Place labs — they need consecutive slots within the SAME physical block (no break in between)
      for (const lab of labTasks) {
        let placed = false;
        const hours = lab.labHours || 2; // Default to 2-hour lab
        const attempts = shuffledLabSlots(hours);

        for (const { day, slot } of attempts) {
          if (canPlaceLab(grid, day, slot, hours)) {
            // Place the first slot as 'lab', rest as 'lab_cont'
            grid[day][slot] = { subjectId: lab.subjectId, teacherId: lab.teacherId, type: 'lab' };
            for (let h = 1; h < hours; h++) {
              grid[day][slot + h] = { subjectId: lab.subjectId, teacherId: lab.teacherId, type: 'lab_cont' };
            }
            placed = true;
            break;
          }
        }

        if (!placed) {
          // Force placement in first available valid block (may violate some constraints — GA will evolve)
          for (let d = 0; d < numDays; d++) {
            for (const startSlot of VALID_LAB_STARTS) {
              if (startSlot + hours - 1 < numSlots) {
                let canPlace = true;
                for (let h = 0; h < hours; h++) {
                  if (grid[d][startSlot + h] !== null) { canPlace = false; break; }
                }
                if (canPlace) {
                  grid[d][startSlot] = { subjectId: lab.subjectId, teacherId: lab.teacherId, type: 'lab' };
                  for (let h = 1; h < hours; h++) {
                    grid[d][startSlot + h] = { subjectId: lab.subjectId, teacherId: lab.teacherId, type: 'lab_cont' };
                  }
                  placed = true;
                  break;
                }
              }
            }
            if (placed) break;
          }
        }

        if (!placed) {
          // Last resort: place anywhere with consecutive empty slots (may break across a break period)
          for (let d = 0; d < numDays; d++) {
            for (let s = 0; s <= numSlots - hours; s++) {
              let canPlace = true;
              for (let h = 0; h < hours; h++) {
                if (grid[d][s + h] !== null) { canPlace = false; break; }
              }
              if (canPlace) {
                grid[d][s] = { subjectId: lab.subjectId, teacherId: lab.teacherId, type: 'lab' };
                for (let h = 1; h < hours; h++) {
                  grid[d][s + h] = { subjectId: lab.subjectId, teacherId: lab.teacherId, type: 'lab_cont' };
                }
                placed = true;
                break;
              }
            }
            if (placed) break;
          }
        }
      }

      // Place theory classes in remaining empty slots
      const emptySlots = [];
      for (let d = 0; d < numDays; d++) {
        for (let s = 0; s < numSlots; s++) {
          if (grid[d][s] === null) {
            emptySlots.push({ day: d, slot: s });
          }
        }
      }

      const shuffledEmpty = shuffleArray(emptySlots);

      for (let i = 0; i < theoryTasks.length && i < shuffledEmpty.length; i++) {
        const { day, slot } = shuffledEmpty[i];
        grid[day][slot] = {
          subjectId: theoryTasks[i].subjectId,
          teacherId: theoryTasks[i].teacherId,
          type: theoryTasks[i].type
        };
      }

      timetable[section.id] = grid;
    }

    return timetable;
  }

  /**
   * Check if a lab of `hours` duration can be placed starting at (day, slot).
   * The lab must fit within a single physical block (no break splitting).
   */
  function canPlaceLab(grid, day, slot, hours) {
    const numSlots = 6;
    // Check the block doesn't exceed grid bounds
    if (slot + hours - 1 >= numSlots) return false;

    // Ensure the lab doesn't cross a break boundary.
    // Physical blocks: [0,1], [2,3], [4,5]
    // A lab of N hours starting at slot S must have all slots in the same block or adjacent valid blocks.
    // For a 2-hour lab: the start must be at an even slot (0, 2, 4)
    // For a 1-hour lab: any slot works (it's really just one slot, treated as theory-like)
    if (hours >= 2) {
      // Check that start slot is a valid lab start
      if (!VALID_LAB_STARTS.includes(slot)) return false;
    }

    // Check all needed slots are empty
    for (let h = 0; h < hours; h++) {
      if (grid[day][slot + h] !== null) return false;
    }

    return true;
  }

  /**
   * Generate shuffled candidate (day, slot) pairs for lab placement.
   * Only considers valid starting positions that won't cross breaks.
   */
  function shuffledLabSlots(hours) {
    const numDays = TimetableData.DAYS.length;
    const slots = [];
    for (let d = 0; d < numDays; d++) {
      for (const s of VALID_LAB_STARTS) {
        if (s + hours - 1 < 6) { // Ensure it fits
          slots.push({ day: d, slot: s });
        }
      }
    }
    return shuffleArray(slots);
  }

  // ---- GENETIC OPERATORS ----

  /**
   * Tournament selection: pick k random individuals, return the best.
   */
  function tournamentSelect(population, fitnesses, k = 5) {
    let bestIdx = -1;
    let bestFit = Infinity;

    for (let i = 0; i < k; i++) {
      const idx = Math.floor(Math.random() * population.length);
      if (fitnesses[idx] < bestFit) {
        bestFit = fitnesses[idx];
        bestIdx = idx;
      }
    }
    return bestIdx;
  }

  /**
   * Crossover: for each section, pick from parent1 or parent2.
   */
  function crossover(parent1, parent2) {
    const child = {};
    const sectionIds = Object.keys(parent1);

    for (const sid of sectionIds) {
      if (Math.random() < 0.5) {
        child[sid] = deepCopyGrid(parent1[sid]);
      } else {
        child[sid] = deepCopyGrid(parent2[sid]);
      }
    }

    return child;
  }

  /**
   * Mutation: for a random section, swap two theory slots, or move a lab session.
   */
  function mutate(chromosome, mutationRate, data) {
    const sectionIds = Object.keys(chromosome);

    for (const sid of sectionIds) {
      if (Math.random() > mutationRate) continue;

      const grid = chromosome[sid];
      const mutationType = Math.random();

      if (mutationType < 0.6) {
        // Swap two theory slots
        swapTheorySlots(grid, data);
      } else if (mutationType < 0.85) {
        // Move a theory class to an empty slot
        moveTheoryToEmpty(grid, data);
      } else {
        // Try to move a lab session
        moveLabSession(grid);
      }
    }
  }

  function swapTheorySlots(grid, data) {
    const numDays = TimetableData.DAYS.length;
    const numSlots = 6;
    const theorySlots = [];

    for (let d = 0; d < numDays; d++) {
      for (let s = 0; s < numSlots; s++) {
        const cell = grid[d][s];
        if (cell && (cell.type === 'theory' || cell.type === 'practical')) {
          if (!isBasketCourse(data, cell.subjectId)) {
            theorySlots.push({ day: d, slot: s });
          }
        }
      }
    }

    if (theorySlots.length >= 2) {
      const i = Math.floor(Math.random() * theorySlots.length);
      let j = Math.floor(Math.random() * theorySlots.length);
      while (j === i && theorySlots.length > 1) {
        j = Math.floor(Math.random() * theorySlots.length);
      }

      const a = theorySlots[i];
      const b = theorySlots[j];
      const temp = grid[a.day][a.slot];
      grid[a.day][a.slot] = grid[b.day][b.slot];
      grid[b.day][b.slot] = temp;
    }
  }

  function moveTheoryToEmpty(grid, data) {
    const numDays = TimetableData.DAYS.length;
    const numSlots = 6;
    const theorySlots = [];
    const emptySlots = [];

    for (let d = 0; d < numDays; d++) {
      for (let s = 0; s < numSlots; s++) {
        const cell = grid[d][s];
        if (cell && (cell.type === 'theory' || cell.type === 'practical')) {
          if (!isBasketCourse(data, cell.subjectId)) {
            theorySlots.push({ day: d, slot: s });
          }
        } else if (cell === null) {
          emptySlots.push({ day: d, slot: s });
        }
      }
    }

    if (theorySlots.length > 0 && emptySlots.length > 0) {
      const from = theorySlots[Math.floor(Math.random() * theorySlots.length)];
      const to = emptySlots[Math.floor(Math.random() * emptySlots.length)];
      grid[to.day][to.slot] = grid[from.day][from.slot];
      grid[from.day][from.slot] = null;
    }
  }

  function moveLabSession(grid) {
    // Find lab starts
    const numDays = TimetableData.DAYS.length;
    const numSlots = 6;
    const labStarts = [];
    for (let d = 0; d < numDays; d++) {
      for (let s = 0; s < numSlots; s++) {
        if (grid[d][s] && grid[d][s].type === 'lab') {
          labStarts.push({ day: d, slot: s });
        }
      }
    }

    if (labStarts.length === 0) return;

    const lab = labStarts[Math.floor(Math.random() * labStarts.length)];
    const labData = { ...grid[lab.day][lab.slot] };

    // Determine how many consecutive slots this lab occupies
    let labHours = 1;
    for (let s = lab.slot + 1; s < numSlots; s++) {
      if (grid[lab.day][s] && grid[lab.day][s].type === 'lab_cont' && grid[lab.day][s].subjectId === labData.subjectId) {
        labHours++;
      } else {
        break;
      }
    }

    // Remove old lab
    for (let h = 0; h < labHours; h++) {
      grid[lab.day][lab.slot + h] = null;
    }

    // Try to place in new valid position
    const attempts = shuffledLabSlots(labHours);
    for (const { day, slot } of attempts) {
      if (canPlaceLab(grid, day, slot, labHours)) {
        grid[day][slot] = { ...labData, type: 'lab' };
        for (let h = 1; h < labHours; h++) {
          grid[day][slot + h] = { ...labData, type: 'lab_cont' };
        }
        return;
      }
    }

    // Failed — put it back
    grid[lab.day][lab.slot] = { ...labData, type: 'lab' };
    for (let h = 1; h < labHours; h++) {
      if (lab.slot + h < numSlots) {
        grid[lab.day][lab.slot + h] = { ...labData, type: 'lab_cont' };
      }
    }
  }

  // ---- MAIN GA LOOP ----

  /**
   * Run the Genetic Algorithm.
   * @param {Object} params - { populationSize, maxGenerations, mutationRate }
   * @param {Function} progressCallback - Called each generation: (gen, maxGen, bestFitness, bestChromosome)
   * @param {Function} completeCallback - Called when done: (bestChromosome, fitnessDetails)
   * @returns {Promise}
   */
  async function run(params = {}, progressCallback, completeCallback) {
    if (isRunning) {
      console.warn('GA is already running');
      return;
    }

    isRunning = true;
    shouldStop = false;
    onProgress = progressCallback;
    onComplete = completeCallback;

    // Use filtered data if semester parity is specified
    const data = params.semesterParity
      ? TimetableData.getAllDataFiltered(params.semesterParity)
      : TimetableData.getAllData();
    const popSize = params.populationSize || 200;
    const maxGen = params.maxGenerations || 500;
    let mutRate = params.mutationRate || 0.05;

    const startTime = Date.now();

    // Assign teachers to sections first
    const teacherAssignment = assignTeachersToSections(data);
    
    // Globally anchor basket courses for perfectly synced scheduling
    const globalBasketSlots = preAllocateBasketCourses(data);

    // Initialize population
    let population = [];
    for (let i = 0; i < popSize; i++) {
      population.push(createRandomChromosome(data, teacherAssignment, globalBasketSlots));
    }

    // Evaluate initial fitness
    let fitnesses = population.map(ch => Constraints.quickFitness(ch, data));

    let bestEverFitness = Infinity;
    let bestEverChromosome = null;
    let stagnantCount = 0;

    for (let gen = 0; gen < maxGen; gen++) {
      if (shouldStop) break;

      // Find best in current generation
      let bestIdx = 0;
      for (let i = 1; i < fitnesses.length; i++) {
        if (fitnesses[i] < fitnesses[bestIdx]) bestIdx = i;
      }

      const genBestFitness = fitnesses[bestIdx];

      if (genBestFitness < bestEverFitness) {
        bestEverFitness = genBestFitness;
        bestEverChromosome = deepCopyTimetable(population[bestIdx]);
        stagnantCount = 0;
      } else {
        stagnantCount++;
      }

      // Early stop: perfect solution found
      if (bestEverFitness === 0) {
        if (onProgress) onProgress(gen + 1, maxGen, bestEverFitness, bestEverChromosome);
        break;
      }

      // Adaptive mutation: increase if stagnant
      if (stagnantCount > 30) {
        mutRate = Math.min(0.3, mutRate * 1.05);
      } else if (stagnantCount === 0) {
        mutRate = params.mutationRate || 0.05;
      }

      // Progress callback (yield to UI every 5 generations)
      if (gen % 5 === 0) {
        if (onProgress) onProgress(gen + 1, maxGen, bestEverFitness, bestEverChromosome);
        await sleep(0); // Yield to UI thread
      }

      // ---- Create next generation ----
      const nextPop = [];
      const nextFit = [];

      // Elitism: carry top 10%
      const eliteCount = Math.floor(popSize * 0.1);
      const sortedIndices = fitnesses.map((f, i) => ({ f, i })).sort((a, b) => a.f - b.f);

      for (let i = 0; i < eliteCount; i++) {
        nextPop.push(deepCopyTimetable(population[sortedIndices[i].i]));
        nextFit.push(sortedIndices[i].f);
      }

      // Fill rest with crossover + mutation
      while (nextPop.length < popSize) {
        const p1Idx = tournamentSelect(population, fitnesses);
        const p2Idx = tournamentSelect(population, fitnesses);

        let child = crossover(population[p1Idx], population[p2Idx]);
        mutate(child, mutRate, data);

        nextPop.push(child);
        nextFit.push(Constraints.quickFitness(child, data));
      }

      population = nextPop;
      fitnesses = nextFit;
    }

    // Final evaluation with full constraint details
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const fitnessDetails = bestEverChromosome
      ? Constraints.evaluateFitness(bestEverChromosome, data)
      : { fitness: Infinity, hardViolations: 0, softPenalty: 0, hardDetails: [], softDetails: [] };

    bestResult = {
      timetable: bestEverChromosome,
      fitness: fitnessDetails,
      elapsed: parseFloat(elapsed),
      teacherAssignment
    };

    isRunning = false;

    if (onComplete) {
      onComplete(bestResult);
    }

    return bestResult;
  }

  function stop() {
    shouldStop = true;
  }

  function getResult() {
    return bestResult;
  }

  function getIsRunning() {
    return isRunning;
  }

  // ---- UTILITY FUNCTIONS ----

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function deepCopyGrid(grid) {
    return grid.map(day => day.map(cell => cell ? { ...cell } : null));
  }

  function deepCopyTimetable(timetable) {
    const copy = {};
    for (const [sid, grid] of Object.entries(timetable)) {
      copy[sid] = deepCopyGrid(grid);
    }
    return copy;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ---- PUBLIC API ----
  return {
    run,
    stop,
    getResult,
    isRunning: getIsRunning,
    // Expose for testing
    assignTeachersToSections,
    createRandomChromosome,
    buildSectionTasks
  };
})();
