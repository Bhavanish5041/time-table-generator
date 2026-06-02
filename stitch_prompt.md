# Google Stitch Prompt — Copy & Paste This

---

> **Paste the entire prompt below into Google Stitch:**

---

```
Create a modern, premium dark-themed single-page web application for a University Timetable Generator. Use a deep dark background (#0f172a), glassmorphism cards (rgba(255,255,255,0.05) background with backdrop-filter: blur(12px) and subtle border rgba(255,255,255,0.1)), and an indigo-to-violet accent gradient (#6366f1 → #8b5cf6). Use Google Font "Inter" for all text. The design should feel sleek, modern, and professional.

The app has 4 main views controlled by a top navigation bar. Only one view is visible at a time.

## Top Navigation Bar
- App title on the left: "🗓️ TimeTable Generator" in bold white
- 4 nav tabs on the right: "Setup", "Generate", "Timetable", "Export"
- Each tab has id: "nav-setup", "nav-generate", "nav-timetable", "nav-export"
- Active tab has the accent gradient underline
- The 4 view containers have ids: "view-setup", "view-generate", "view-timetable", "view-export"

## VIEW 1: Setup (id="view-setup")
This view has a horizontal progress stepper at the top showing 4 steps: "Branches", "Subjects", "Sections", "Teachers". Each step circle has id "step-1", "step-2", "step-3", "step-4". Active step is highlighted with the accent gradient. Completed steps show a checkmark.

Below the stepper, show the content for the active step inside a glassmorphism card. Navigation buttons "← Back" (id="btn-prev-step") and "Next →" (id="btn-next-step") at the bottom right.

### Step 1: Branches (id="setup-step-1")
- Heading: "Branches & Semesters"
- Description text: "Add your department branches. Each branch runs semesters 1-4."
- A button "+ Add Branch" (id="btn-add-branch") with accent gradient background
- Below it, a container (id="branches-list") that will hold branch cards
- Each branch card template should have: a text input for branch name, a delete button (×), and 4 checkbox toggles for Sem 1-4 (all checked by default)

### Step 2: Subjects (id="setup-step-2")
- Heading: "Subjects"
- Description: "Define subjects for each branch and semester."
- Two dropdown selects at the top:
  - Branch selector (id="subject-branch-select")
  - Semester selector (id="subject-sem-select")
- A button "+ Add Subject" (id="btn-add-subject")
- Below, a container (id="subjects-list") for subject cards
- Each subject card template: text input for name, text input for subject code, a dropdown for credits (1, 2, 3, 4), and a toggle/checkbox labeled "Has Lab" (only enabled when credits=4), and a delete button

### Step 3: Sections (id="setup-step-3")
- Heading: "Sections"
- Description: "Define sections for each branch-semester combination."
- Two dropdowns: Branch (id="section-branch-select"), Semester (id="section-sem-select")
- A button "+ Add Section" (id="btn-add-section")
- Container (id="sections-list") showing section cards with a text input for section name (e.g., "A", "B", "C") and delete button

### Step 4: Teachers (id="setup-step-4")
- Heading: "Teachers"
- Description: "Add teachers and assign the subjects they can teach."
- A button "+ Add Teacher" (id="btn-add-teacher")
- Container (id="teachers-list") for teacher cards
- Each teacher card: text input for teacher name, a multi-select area (id dynamically: "teacher-subjects-{index}") showing available subjects as clickable chips/tags that can be toggled on/off, and a delete button

## VIEW 2: Generate (id="view-generate")
Center-aligned content in a large glassmorphism card:
- Heading: "Generate Timetable"
- Description: "Configure and run the genetic algorithm to find an optimal schedule."
- Three parameter inputs in a row:
  - "Population Size" number input (id="param-population", default 200)
  - "Max Generations" number input (id="param-generations", default 500)
  - "Mutation Rate" number input (id="param-mutation", default 0.05, step 0.01)
- A large "🚀 Generate" button (id="btn-generate") with accent gradient, and a "⏹ Stop" button (id="btn-stop") next to it (initially hidden)
- Below: a progress bar container (id="progress-container", initially hidden):
  - A progress bar (id="progress-bar") with gradient fill
  - Text showing "Generation X / Y" (id="progress-text")
  - Text showing "Best Fitness: Z" (id="fitness-text")
- Below the progress bar: a status message area (id="generation-status") for showing "Completed!" or error messages
- A small stats card below showing: "Hard Violations: X" (id="stat-hard"), "Soft Penalties: X" (id="stat-soft"), "Time Elapsed: Xs" (id="stat-time")

## VIEW 3: Timetable (id="view-timetable")
- Top bar with 3 dropdowns in a row:
  - Branch (id="tt-branch-select")
  - Semester (id="tt-sem-select")
  - Section (id="tt-section-select")
- A toggle button group: "Section View" (id="btn-section-view", active by default) | "Teacher View" (id="btn-teacher-view")
- When teacher view is active, show a teacher dropdown (id="tt-teacher-select") instead of the branch/sem/section dropdowns

- Below: the timetable grid (id="timetable-grid") — this is a styled HTML table:
  - 7 columns: first column is "Time/Day", then "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  - 6 rows for slots: "9:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-1:00", "2:00-3:00", "3:00-4:00"
  - Each cell has id format: "cell-{day}-{slot}" (e.g., "cell-0-0" for Monday slot 1)
  - Cells should have min-height 60px, rounded corners, and when filled should show subject code in bold and teacher name below in smaller text
  - Lab cells should span 2 rows and have a distinct left border color (e.g., violet)
  - Empty cells should show a subtle dashed border
  - A "FREE" slot (rest after lab) should have a subtle green tint

- Below the grid: a constraint violations panel (id="violations-panel") that lists any remaining soft constraint issues with warning icons

## VIEW 4: Export (id="view-export")
- A glassmorphism card with:
  - Heading: "Export & Print"
  - Two dropdowns: Branch (id="export-branch-select"), Section (id="export-section-select")
  - Three buttons in a row:
    - "📄 Download CSV" (id="btn-export-csv") 
    - "📋 Download All CSVs" (id="btn-export-all")
    - "🖨️ Print Timetable" (id="btn-print")
  - A preview of the selected timetable below (id="export-preview") — a clean, print-friendly version of the grid

## General Design Rules:
- All cards use glassmorphism: semi-transparent background, blur, subtle border
- Buttons: accent gradient for primary actions, outline style for secondary
- Inputs: dark background (#1e293b), light border, white text, rounded corners
- Smooth transitions (0.3s ease) on all hover states
- Cards have subtle hover lift effect (translateY(-2px) with shadow increase)
- Responsive: stack elements vertically on small screens
- Include smooth fade transitions when switching between views
- All delete buttons should be small, circular, red-tinted
- Add a subtle animated gradient border on the active/focused card
- Toast notification container (id="toast-container") fixed at top-right for showing success/error messages

Link these script files at the bottom of the HTML (before closing body tag):
<script src="js/data.js"></script>
<script src="js/constraints.js"></script>
<script src="js/genetic.js"></script>
<script src="js/export.js"></script>
<script src="js/app.js"></script>
```
