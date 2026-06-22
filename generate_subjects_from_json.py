import json
import re

ALL_DEPARTMENTS = ["AI", "CS", "EC", "ME", "CE", "EE", "BT", "CH", "AS", "CD", "CY", "IS", "ET", "IM"]

def get_semester_from_code(course_id):
    """Extract semester from course code.
    Pattern: 2+ letter prefix, then digits where the 2nd digit is the semester.
    e.g. MA211TC -> digits=211, 2nd digit=1 -> semester 1
    e.g. AI362IA -> digits=362, 2nd digit=6 -> semester 6
    e.g. XX113XTX -> digits=113, 2nd digit=1 -> semester 1
    """
    # Find the first group of digits in the code
    match = re.search(r'(\d{2,})', course_id)
    if match:
        digits = match.group(1)
        if len(digits) >= 2:
            return int(digits[1])  # 2nd digit is semester
    return None

def get_target_branches(dept_teaching, semester, course_id):
    """Determine which branches a course applies to."""
    # Common courses for all branches
    if dept_teaching in ["HSS", "MULTI", "PHY", "CHE"]:
        return ALL_DEPARTMENTS
        
    # Math courses - specific mappings for Y2
    if dept_teaching == "MAT":
        if course_id == "MA231ET": return ["AI", "CD"]
        if course_id == "MA231CT": return ["CS", "IS", "CY"]
        if course_id == "MA231BT": return ["EC", "EE", "ET"]
        if course_id == "MA232AT": return ["ME", "CE", "CH", "BT", "AS", "IM"]
        # Y1 math (MA211TC, MA221TC) and bridge courses are common
        return ALL_DEPARTMENTS
        
    # Department-specific mapping
    mapping = {
        "AIML": ["AI"],
        "CSE": ["CS"],
        "ECE": ["EC"],
        "ME": ["ME"],
        "CV": ["CE"],
        "EEE": ["EE"],
        "BT": ["BT"],
        "CH": ["CH"],
        "AS": ["AS"],
        "CD": ["CD"],
        "CY": ["CY"],
        "ISE": ["IS"],
        "ETE": ["ET"],
        "IM": ["IM"],
        "EIE": []  # Skip EIE - not in our department list
    }
    
    # CS dept teaches common programming courses in Y1
    if dept_teaching == "CS":
        if semester in [1, 2]:
            return ALL_DEPARTMENTS
        else:
            return ["CS"]
            
    return mapping.get(dept_teaching, [])

# Load all courses from the 3 year files
courses = []
for file in ["Y1_cources.json", "Y2_cources.json", "Y3_cources.json"]:
    with open(file, "r") as f:
        file_courses = json.load(f)
        print(f"Loaded {len(file_courses)} courses from {file}")
        courses.extend(file_courses)

print(f"\nTotal courses loaded: {len(courses)}")

# Build the nested structure
output_data = []

for branch in ALL_DEPARTMENTS:
    semesters_data = {}
    
    for c in courses:
        # Get semester: prefer explicit field, fall back to code extraction
        semester = c.get("semester")
        if not semester:
            semester = get_semester_from_code(c["id"])
        if not semester:
            print(f"  WARNING: Cannot determine semester for {c['id']} {c['name']}, skipping")
            continue
            
        targets = get_target_branches(c["department_teaching"], semester, c["id"])
        
        if branch in targets:
            if semester not in semesters_data:
                semesters_data[semester] = []
            
            # Avoid duplicate course codes in same semester
            existing_codes = [s["code"] for s in semesters_data[semester]]
            if c["id"] not in existing_codes:
                semesters_data[semester].append({
                    "name": c["name"],
                    "code": c["id"],
                    "credits": c["credits"],
                    "type": c.get("type", "theory"),
                    "theory_hours": c.get("theory_hours", c["credits"]),
                    "lab_hours": c.get("lab_hours", 0)
                })
            
    # Format the semesters into a sorted list
    semesters_list = []
    for sem in sorted(semesters_data.keys()):
        semesters_list.append({
            "semester": sem,
            "subjects": semesters_data[sem]
        })
        
    output_data.append({
        "college": "RVCE",
        "branch": branch,
        "semesters": semesters_list
    })

with open("subjects.json", "w") as f:
    json.dump(output_data, f, indent=2)

print(f"\nGenerated subjects.json with {len(output_data)} branches:")
for b in output_data:
    total_subs = sum(len(s["subjects"]) for s in b["semesters"])
    sems = [s["semester"] for s in b["semesters"]]
    print(f"  {b['branch']}: semesters {sems}, {total_subs} subjects")
