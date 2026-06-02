// ============================================================
// genetic.js — Genetic Algorithm Engine for Timetable Generation
// ============================================================

const GeneticAlgorithm = (() => {

  let isRunning = false;
  let shouldStop = false;
  let bestResult = null;
  let onProgress = null;
  let onComplete = null;

  /**
   * Build the list of assignments needed for a given section.
   * Returns an array of tasks: { subjectId, teacherId, type: 'theory'|'lab' }
   * Each theory slot is one task. Each lab session produces two entries (lab + lab_cont).
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

      // Lab sessions (each lab = 2 consecutive slots + 1 rest)
      for (let i = 0; i < subject.labSessions; i++) {
        tasks.push({
          subjectId: subject.id,
          teacherId: teacherId,
          type: 'lab_session' // Will be expanded into lab + lab_cont during placement
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
  function createRandomChromosome(data, teacherAssignment) {
    const timetable = {};

    for (const section of data.sections) {
      // Initialize empty grid
      const grid = Array.from({ length: 6 }, () => Array(6).fill(null));
      const tasks = buildSectionTasks(section.id, data, teacherAssignment);

      // Separate labs and theory
      const labTasks = tasks.filter(t => t.type === 'lab_session');
      const theoryTasks = tasks.filter(t => t.type === 'theory');

      // Place labs first (they need consecutive slots + rest)
      for (const lab of labTasks) {
        let placed = false;
        const attempts = shuffledSlots();

        for (const { day, slot } of attempts) {
          if (canPlaceLab(grid, day, slot)) {
            grid[day][slot] = { subjectId: lab.subjectId, teacherId: lab.teacherId, type: 'lab' };
            grid[day][slot + 1] = { subjectId: lab.subjectId, teacherId: lab.teacherId, type: 'lab_cont' };
            // Rest slot after lab — mark as null (already null, so just skip slot+2)
            placed = true;
            break;
          }
        }

        if (!placed) {
          // Force placement in first available (may violate constraints — GA will evolve)
          for (let d = 0; d < 6; d++) {
            for (let s = 0; s < 4; s++) { // Max slot 4 so lab + rest fits
              if (grid[d][s] === null && grid[d][s + 1] === null) {
                grid[d][s] = { subjectId: lab.subjectId, teacherId: lab.teacherId, type: 'lab' };
                grid[d][s + 1] = { subjectId: lab.subjectId, teacherId: lab.teacherId, type: 'lab_cont' };
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
      for (let d = 0; d < 6; d++) {
        for (let s = 0; s < 6; s++) {
          if (grid[d][s] === null) {
            // Check it's not a rest-after-lab slot
            if (s > 0 && grid[d][s - 1] && grid[d][s - 1].type === 'lab_cont') {
              continue; // This slot is reserved for rest
            }
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
          type: 'theory'
        };
      }

      timetable[section.id] = grid;
    }

    return timetable;
  }

  function canPlaceLab(grid, day, slot) {
    // Need slots: slot (lab), slot+1 (lab_cont), slot+2 (rest — must be free)
    if (slot + 2 > 5) {
      // If slot+1 is the last slot (5), rest is after school — acceptable
      if (slot + 1 > 5) return false;
      return grid[day][slot] === null && grid[day][slot + 1] === null;
    }
    return grid[day][slot] === null &&
           grid[day][slot + 1] === null &&
           grid[day][slot + 2] === null; // Reserve for rest
  }

  function shuffledSlots() {
    const slots = [];
    for (let d = 0; d < 6; d++) {
      for (let s = 0; s <= 3; s++) { // Slots 0-3 to allow lab(2) + rest(1) = 3 slots
        slots.push({ day: d, slot: s });
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
  function mutate(chromosome, mutationRate) {
    const sectionIds = Object.keys(chromosome);

    for (const sid of sectionIds) {
      if (Math.random() > mutationRate) continue;

      const grid = chromosome[sid];
      const mutationType = Math.random();

      if (mutationType < 0.6) {
        // Swap two theory slots
        swapTheorySlots(grid);
      } else if (mutationType < 0.85) {
        // Move a theory class to an empty slot
        moveTheoryToEmpty(grid);
      } else {
        // Try to move a lab session
        moveLabSession(grid);
      }
    }
  }

  function swapTheorySlots(grid) {
    const theorySlots = [];
    const emptySlots = [];

    for (let d = 0; d < 6; d++) {
      for (let s = 0; s < 6; s++) {
        if (grid[d][s] && grid[d][s].type === 'theory') {
          theorySlots.push({ day: d, slot: s });
        } else if (grid[d][s] === null) {
          emptySlots.push({ day: d, slot: s });
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

  function moveTheoryToEmpty(grid) {
    const theorySlots = [];
    const emptySlots = [];

    for (let d = 0; d < 6; d++) {
      for (let s = 0; s < 6; s++) {
        if (grid[d][s] && grid[d][s].type === 'theory') {
          theorySlots.push({ day: d, slot: s });
        } else if (grid[d][s] === null) {
          // Check not a rest slot
          if (!(s > 0 && grid[d][s - 1] && grid[d][s - 1].type === 'lab_cont')) {
            emptySlots.push({ day: d, slot: s });
          }
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
    const labStarts = [];
    for (let d = 0; d < 6; d++) {
      for (let s = 0; s < 6; s++) {
        if (grid[d][s] && grid[d][s].type === 'lab') {
          labStarts.push({ day: d, slot: s });
        }
      }
    }

    if (labStarts.length === 0) return;

    const lab = labStarts[Math.floor(Math.random() * labStarts.length)];
    const labData = { ...grid[lab.day][lab.slot] };

    // Remove old lab
    grid[lab.day][lab.slot] = null;
    if (lab.slot + 1 < 6 && grid[lab.day][lab.slot + 1] && grid[lab.day][lab.slot + 1].type === 'lab_cont') {
      grid[lab.day][lab.slot + 1] = null;
    }

    // Try to place in new position
    const attempts = shuffledSlots();
    for (const { day, slot } of attempts) {
      if (canPlaceLab(grid, day, slot)) {
        grid[day][slot] = { ...labData, type: 'lab' };
        grid[day][slot + 1] = { ...labData, type: 'lab_cont' };
        return;
      }
    }

    // Failed — put it back
    grid[lab.day][lab.slot] = { ...labData, type: 'lab' };
    if (lab.slot + 1 < 6) {
      grid[lab.day][lab.slot + 1] = { ...labData, type: 'lab_cont' };
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

    const data = TimetableData.getAllData();
    const popSize = params.populationSize || 200;
    const maxGen = params.maxGenerations || 500;
    let mutRate = params.mutationRate || 0.05;

    const startTime = Date.now();

    // Assign teachers to sections first
    const teacherAssignment = assignTeachersToSections(data);

    // Initialize population
    let population = [];
    for (let i = 0; i < popSize; i++) {
      population.push(createRandomChromosome(data, teacherAssignment));
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
        mutate(child, mutRate);

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
