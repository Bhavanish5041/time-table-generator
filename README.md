# Time Table Generator

A static timetable generator web app built with HTML, JavaScript, and JSON course data.

## What this repo contains

- `frontend/` - the web pages for setup, generation, timetable view, and export.
- `js/` - the application logic, including data models, page controller, export helpers, and the timetable algorithm.
- JSON data files in the repo root:
  - `departments.json`
  - `sections.json`
  - `Y1_courses.json`
  - `Y2_courses.json`
  - `Y3_courses.json`
  - `Y4_courses.json`
  - `curriculum.json`
  - `rooms.json`
  - `faculty.json`
  - `subjects.json`
- Python utility scripts for data validation and generation, which are optional and not required to run the web app.

## Run the app

The frontend loads JSON files via `fetch`, so it should be served over a local web server rather than opened directly from the file system.

Install Live erver EXtension and open mai.html with Live Server Extension,

or

From the project root, run:

```powershell
cd "c:\Users\Kanishk\Downloads\time-table-generator-main (2)\time-table-generator-main"
python -m http.server 8000
```

Then open:

- `http://localhost:8000/frontend/main.html` to start the setup flow
- `http://localhost:8000/frontend/generate.html` to generate timetables
- `http://localhost:8000/frontend/timetable.html` to view generated timetable
- `http://localhost:8000/frontend/export.html` to export results

## Notes

- The app is client-side only and stores intermediate state in browser `localStorage`.
- Required runtime files are the `frontend/` HTML files, the `js/` scripts, and the root JSON data files.
- The repo also contains optional files and folders used for design assets or offline utilities.


## Recommended workflow

1. Start the local server.
2. Open `frontend/main.html`.
3. Configure branches, subjects, sections, and teachers.
4. Save and generate the timetable.
5. Use the export page to download CSV or print views.

## License

No license is included in this repository.
