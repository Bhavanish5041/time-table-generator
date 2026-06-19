import json

ALL_DEPARTMENTS = ["AI", "CS", "EC", "ME", "CE", "EE", "BT", "CH", "AS", "CD", "CY", "IS", "ET", "IM"]

def get_target_branches(dept_teaching, semester, course_id):
    if dept_teaching in ["HSS", "MULTI", "PHY", "CHE"]:
        return ALL_DEPARTMENTS
        
    if dept_teaching == "MAT":
        if course_id == "MA231ET": return ["AI", "CD"]
        if course_id == "MA231CT": return ["CS", "IS", "CY"]
        if course_id == "MA231BT": return ["EC", "EE", "ET"]
        if course_id == "MA232AT": return ["ME", "CE", "CH", "BT", "AS", "IM"]
        return ALL_DEPARTMENTS
        
    mapping = {
        "AIML": ["AI"],
        "CSE": ["CS"],
        "ECE": ["EC"],
        "ME": ["ME"],
        "CV": ["CE"],
        "EEE": ["EE"],
        "BT": ["BT"],
        "CH": ["CH"],
        "CHE": ["CH"],
        "AS": ["AS"],
        "CD": ["CD"],
        "CY": ["CY"],
        "ISE": ["IS"],
        "ETE": ["ET"],
        "IM": ["IM"],
        "EIE": [] # Skip EIE
    }
    
    if dept_teaching == "CS":
        if semester in [1, 2]:
            return ALL_DEPARTMENTS
        else:
            return ["CS"]
            
    return mapping.get(dept_teaching, [])

# Load all courses
courses = []
for file in ["Y1_cources.json", "Y2_cources.json", "Y3_cources.json"]:
    with open(file, "r") as f:
        courses.extend(json.load(f))

output_data = []

for branch in ALL_DEPARTMENTS:
    semesters_data = {}
    
    for c in courses:
        # Determine semester
        semester = c.get("semester")
        if not semester:
            import re
            match = re.search(r'\d+', c["id"])
            if match:
                digits = match.group()
                if len(digits) >= 2:
                    semester = int(digits[1])
                else:
                    semester = int(digits[0])
            else:
                semester = 1 # Fallback
                
        targets = get_target_branches(c["department_teaching"], semester, c["id"])
        
        if branch in targets:
            if semester not in semesters_data:
                semesters_data[semester] = []
            
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

print("Generated subjects.json with {} branches.".format(len(output_data)))
for b in output_data:
    print(f"  {b['branch']}: {len(b['semesters'])} semesters")
