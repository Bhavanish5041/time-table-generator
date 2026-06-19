import json

# ---------------------------------------------------------------
# Cycles
# Chemistry Cycle: CS, AI, CD, CY, BT, IS
#   Sem 1 → Engineering Chemistry  |  Sem 2 → Engineering Physics
# Physics Cycle: EC, ME, CE, EE, CH, AS, ET, IM, MCA
#   Sem 1 → Engineering Physics    |  Sem 2 → Engineering Chemistry
# ---------------------------------------------------------------

CHEMISTRY_CYCLE = {"CS", "AI", "CD", "CY", "BT", "IS"}
PHYSICS_CYCLE   = {"EC", "ME", "CE", "EE", "CH", "AS", "ET", "IM", "MCA"}

# ---------------------------------------------------------------
# Sem 1 subject lists (science subject differs by cycle)
# ---------------------------------------------------------------
def sem1(dept):
    science = (
        {"name": "Engineering Chemistry", "credits": 4}
        if dept in CHEMISTRY_CYCLE
        else {"name": "Engineering Physics", "credits": 4}
    )
    return [
        {"name": "Engineering Mathematics I", "credits": 4},
        science,
        {"name": "Basket course 1", "credits": 3},
        {"name": "Basket course 2", "credits": 3},
        {"name": "CAD", "credits": 3},
        {"name": "Yoga", "credits": 1},
        {"name": "English", "credits": 1},
        {"name": "Indian Constitution", "credits": 1},
    ]

# ---------------------------------------------------------------
# Sem 2 subject lists (inverted from sem 1)
# ---------------------------------------------------------------
def sem2(dept):
    science = (
        {"name": "Engineering Physics", "credits": 4}
        if dept in CHEMISTRY_CYCLE
        else {"name": "Engineering Chemistry", "credits": 4}
    )
    return [
        {"name": "Engineering Mathematics II", "credits": 4},
        science,
        {"name": "Programming in C", "credits": 3},
        {"name": "Basket course 1", "credits": 3},
        {"name": "Basket course 2", "credits": 3},
        {"name": "Idea lab", "credits": 1},
        {"name": "Kannada", "credits": 1},
        {"name": "English II", "credits": 1},
    ]

# ---------------------------------------------------------------
# Shared semesters 3 & 4 for CSE cluster (CS, CD, CY)
# ---------------------------------------------------------------
CSE_CLUSTER_SEM3 = [
    {"name": "Mathematics III", "credits": 4},
    {"name": "Operating Systems", "credits": 4},
    {"name": "Analog & Digital Logic Design", "credits": 4},
    {"name": "Data Structures & Algorithms", "credits": 4},
    {"name": "Basket Course", "credits": 3},
    {"name": "Design Thinking Lab", "credits": 2},
]

CSE_CLUSTER_SEM4 = [
    {"name": "Discrete Mathematics", "credits": 3},
    {"name": "Design and Analysis of Algorithms", "credits": 4},
    {"name": "Microcontrollers & Embedded Systems", "credits": 4},
    {"name": "Computer Networks", "credits": 3},
    {"name": "Ability Enhancement Course", "credits": 2},
    {"name": "Basket Course", "credits": 3},
]

# ---------------------------------------------------------------
# Department-specific semesters 3–8
# ---------------------------------------------------------------
SPECIFIC = {
    # CSE cluster shares sem 3 & 4; diverges at sem 5
    "CS": [
        (3, CSE_CLUSTER_SEM3),
        (4, CSE_CLUSTER_SEM4),
        (5, [
            {"name": "Database Management Systems", "credits": 4},
            {"name": "Automata Theory & Compiler Design", "credits": 4},
            {"name": "Software Engineering", "credits": 3},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "Machine Learning", "credits": 4},
            {"name": "Cloud Computing", "credits": 3},
            {"name": "Web Technologies", "credits": 4},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "Cryptography & Network Security", "credits": 4},
            {"name": "Elective III", "credits": 3},
            {"name": "Internship / Project Phase I", "credits": 3},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
    "CD": [
        (3, CSE_CLUSTER_SEM3),
        (4, CSE_CLUSTER_SEM4),
        (5, [
            {"name": "Database Management Systems", "credits": 4},
            {"name": "Introduction to Data Science", "credits": 4},
            {"name": "Statistical Methods for DS", "credits": 3},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "Machine Learning", "credits": 4},
            {"name": "Big Data Analytics", "credits": 4},
            {"name": "Data Visualization", "credits": 3},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "Deep Learning", "credits": 4},
            {"name": "Natural Language Processing", "credits": 3},
            {"name": "Internship / Project Phase I", "credits": 3},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
    "CY": [
        (3, CSE_CLUSTER_SEM3),
        (4, CSE_CLUSTER_SEM4),
        (5, [
            {"name": "Database Management Systems", "credits": 4},
            {"name": "Introduction to Cyber Security", "credits": 4},
            {"name": "Cryptography", "credits": 4},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "Network Security", "credits": 4},
            {"name": "Ethical Hacking", "credits": 4},
            {"name": "Web Security", "credits": 3},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "Digital Forensics", "credits": 4},
            {"name": "Blockchain Technology", "credits": 3},
            {"name": "Internship / Project Phase I", "credits": 3},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
    "AI": [
        (3, [
            {"name": "Mathematics III", "credits": 4},
            {"name": "Operating Systems", "credits": 4},
            {"name": "Analog & Digital Logic Design", "credits": 4},
            {"name": "Data Structures & Algorithms", "credits": 4},
            {"name": "Basket Course", "credits": 3},
            {"name": "Design Thinking Lab", "credits": 2},
        ]),
        (4, [
            {"name": "Discrete Mathematics", "credits": 3},
            {"name": "Design and Analysis of Algorithms", "credits": 4},
            {"name": "Database Management Systems", "credits": 4},
            {"name": "Computer Networks", "credits": 3},
            {"name": "Ability Enhancement Course", "credits": 2},
            {"name": "Basket Course", "credits": 3},
        ]),
        (5, [
            {"name": "Machine Learning", "credits": 4},
            {"name": "Computer Vision", "credits": 4},
            {"name": "Software Engineering", "credits": 3},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "Deep Learning", "credits": 4},
            {"name": "Natural Language Processing", "credits": 3},
            {"name": "Big Data Processing", "credits": 4},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "Reinforcement Learning", "credits": 4},
            {"name": "AI Ethics & Society", "credits": 2},
            {"name": "Internship / Project Phase I", "credits": 4},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
    "IS": [
        (3, [
            {"name": "Mathematics III", "credits": 4},
            {"name": "Operating Systems", "credits": 4},
            {"name": "Digital Systems", "credits": 3},
            {"name": "Data Structures & Algorithms", "credits": 4},
            {"name": "Basket Course", "credits": 3},
            {"name": "Design Thinking Lab", "credits": 2},
        ]),
        (4, [
            {"name": "Discrete Mathematics", "credits": 3},
            {"name": "Design and Analysis of Algorithms", "credits": 4},
            {"name": "Software Engineering", "credits": 3},
            {"name": "Computer Networks", "credits": 3},
            {"name": "Ability Enhancement Course", "credits": 2},
            {"name": "Basket Course", "credits": 3},
        ]),
        (5, [
            {"name": "Database Management Systems", "credits": 4},
            {"name": "Web Technologies", "credits": 4},
            {"name": "Information Security", "credits": 3},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "Machine Learning", "credits": 4},
            {"name": "Data Mining", "credits": 3},
            {"name": "Cloud Computing", "credits": 3},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "IoT & Embedded Systems", "credits": 3},
            {"name": "Elective III", "credits": 3},
            {"name": "Internship / Project Phase I", "credits": 4},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
    "BT": [
        (3, [
            {"name": "Mathematics III", "credits": 4},
            {"name": "Biochemistry", "credits": 4},
            {"name": "Microbiology", "credits": 4},
            {"name": "Cell Biology", "credits": 3},
            {"name": "Basket Course", "credits": 3},
            {"name": "Design Thinking Lab", "credits": 2},
        ]),
        (4, [
            {"name": "Molecular Biology", "credits": 4},
            {"name": "Genetics", "credits": 3},
            {"name": "Biochemical Thermodynamics", "credits": 3},
            {"name": "Bioanalytical Techniques", "credits": 4},
            {"name": "Basket Course", "credits": 3},
        ]),
        (5, [
            {"name": "Bioprocess Engineering", "credits": 4},
            {"name": "Immunology", "credits": 3},
            {"name": "Bioinformatics", "credits": 4},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "Genetic Engineering", "credits": 4},
            {"name": "Downstream Processing", "credits": 3},
            {"name": "Enzyme Technology", "credits": 3},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "Plant Biotechnology", "credits": 3},
            {"name": "Animal Biotechnology", "credits": 3},
            {"name": "Internship / Project Phase I", "credits": 4},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
    "EC": [
        (3, [
            {"name": "Mathematics III", "credits": 4},
            {"name": "Network Analysis", "credits": 4},
            {"name": "Electronic Devices & Circuits", "credits": 4},
            {"name": "Digital System Design", "credits": 4},
            {"name": "Basket Course", "credits": 3},
            {"name": "Design Thinking Lab", "credits": 2},
        ]),
        (4, [
            {"name": "Signals & Systems", "credits": 4},
            {"name": "Analog Circuits", "credits": 4},
            {"name": "Microprocessors & Microcontrollers", "credits": 4},
            {"name": "Communication Systems", "credits": 3},
            {"name": "Basket Course", "credits": 3},
        ]),
        (5, [
            {"name": "Electromagnetic Waves", "credits": 3},
            {"name": "Digital Signal Processing", "credits": 4},
            {"name": "Control Systems", "credits": 4},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "VLSI Design", "credits": 4},
            {"name": "Antenna & Wave Propagation", "credits": 3},
            {"name": "Computer Networks", "credits": 3},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "Microwave Engineering", "credits": 4},
            {"name": "Optical Communication", "credits": 3},
            {"name": "Internship / Project Phase I", "credits": 3},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
    "ME": [
        (3, [
            {"name": "Mathematics III", "credits": 4},
            {"name": "Mechanics of Materials", "credits": 4},
            {"name": "Thermodynamics", "credits": 4},
            {"name": "Material Science", "credits": 3},
            {"name": "Basket Course", "credits": 3},
            {"name": "Design Thinking Lab", "credits": 2},
        ]),
        (4, [
            {"name": "Fluid Mechanics", "credits": 4},
            {"name": "Kinematics of Machinery", "credits": 3},
            {"name": "Applied Thermodynamics", "credits": 4},
            {"name": "Manufacturing Processes I", "credits": 3},
            {"name": "Basket Course", "credits": 3},
        ]),
        (5, [
            {"name": "Dynamics of Machinery", "credits": 4},
            {"name": "Heat Transfer", "credits": 4},
            {"name": "Manufacturing Processes II", "credits": 3},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "Design of Machine Elements", "credits": 4},
            {"name": "CAD/CAM", "credits": 4},
            {"name": "Finite Element Methods", "credits": 3},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "Mechatronics", "credits": 3},
            {"name": "Operations Research", "credits": 3},
            {"name": "Internship / Project Phase I", "credits": 4},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
    "CE": [
        (3, [
            {"name": "Mathematics III", "credits": 4},
            {"name": "Strength of Materials", "credits": 4},
            {"name": "Fluid Mechanics I", "credits": 4},
            {"name": "Surveying", "credits": 4},
            {"name": "Basket Course", "credits": 3},
            {"name": "Design Thinking Lab", "credits": 2},
        ]),
        (4, [
            {"name": "Structural Analysis I", "credits": 4},
            {"name": "Geotechnical Engineering", "credits": 4},
            {"name": "Building Materials & Construction", "credits": 3},
            {"name": "Fluid Mechanics II", "credits": 3},
            {"name": "Basket Course", "credits": 3},
        ]),
        (5, [
            {"name": "Structural Analysis II", "credits": 4},
            {"name": "Highway Engineering", "credits": 3},
            {"name": "Hydrology & Water Resources", "credits": 3},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "Design of Steel Structures", "credits": 4},
            {"name": "Environmental Engineering", "credits": 4},
            {"name": "Foundation Engineering", "credits": 3},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "Design of RC Structures", "credits": 4},
            {"name": "Estimation & Costing", "credits": 3},
            {"name": "Internship / Project Phase I", "credits": 3},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
    "EE": [
        (3, [
            {"name": "Mathematics III", "credits": 4},
            {"name": "Electric Circuit Analysis", "credits": 4},
            {"name": "Electrical Machines I", "credits": 4},
            {"name": "Analog Electronic Circuits", "credits": 3},
            {"name": "Basket Course", "credits": 3},
            {"name": "Design Thinking Lab", "credits": 2},
        ]),
        (4, [
            {"name": "Electrical Machines II", "credits": 4},
            {"name": "Electromagnetic Fields", "credits": 3},
            {"name": "Signals & Systems", "credits": 4},
            {"name": "Power Systems I", "credits": 3},
            {"name": "Basket Course", "credits": 3},
        ]),
        (5, [
            {"name": "Power Systems II", "credits": 4},
            {"name": "Control Systems", "credits": 4},
            {"name": "Microcontrollers", "credits": 3},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "Power Electronics", "credits": 4},
            {"name": "Digital Signal Processing", "credits": 3},
            {"name": "Renewable Energy Systems", "credits": 3},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "High Voltage Engineering", "credits": 3},
            {"name": "Smart Grid Technology", "credits": 3},
            {"name": "Internship / Project Phase I", "credits": 4},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
    "CH": [
        (3, [
            {"name": "Mathematics III", "credits": 4},
            {"name": "Chemical Process Calculations", "credits": 4},
            {"name": "Fluid Mechanics", "credits": 4},
            {"name": "Mechanical Operations", "credits": 3},
            {"name": "Basket Course", "credits": 3},
            {"name": "Design Thinking Lab", "credits": 2},
        ]),
        (4, [
            {"name": "Heat Transfer", "credits": 4},
            {"name": "Chemical Engineering Thermodynamics", "credits": 4},
            {"name": "Process Instrumentation", "credits": 3},
            {"name": "Chemical Reaction Engineering I", "credits": 4},
            {"name": "Basket Course", "credits": 3},
        ]),
        (5, [
            {"name": "Mass Transfer I", "credits": 4},
            {"name": "Chemical Reaction Engineering II", "credits": 4},
            {"name": "Transport Phenomena", "credits": 3},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "Mass Transfer II", "credits": 4},
            {"name": "Process Control", "credits": 3},
            {"name": "Equipment Design", "credits": 4},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "Petroleum Refining", "credits": 3},
            {"name": "Environmental Engineering", "credits": 3},
            {"name": "Internship / Project Phase I", "credits": 4},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
    "AS": [
        (3, [
            {"name": "Mathematics III", "credits": 4},
            {"name": "Aero Thermodynamics", "credits": 4},
            {"name": "Solid Mechanics", "credits": 4},
            {"name": "Fluid Mechanics", "credits": 4},
            {"name": "Basket Course", "credits": 3},
            {"name": "Design Thinking Lab", "credits": 2},
        ]),
        (4, [
            {"name": "Aerodynamics I", "credits": 4},
            {"name": "Aircraft Propulsion", "credits": 4},
            {"name": "Aircraft Structures I", "credits": 4},
            {"name": "Basket Course", "credits": 3},
        ]),
        (5, [
            {"name": "Aerodynamics II", "credits": 4},
            {"name": "Aircraft Performance", "credits": 3},
            {"name": "Aircraft Structures II", "credits": 4},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "Flight Dynamics", "credits": 4},
            {"name": "Space Mechanics", "credits": 3},
            {"name": "Gas Dynamics", "credits": 4},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "Aircraft Design", "credits": 4},
            {"name": "Avionics", "credits": 3},
            {"name": "Internship / Project Phase I", "credits": 3},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
    "ET": [
        (3, [
            {"name": "Mathematics III", "credits": 4},
            {"name": "Network Analysis", "credits": 4},
            {"name": "Electronic Devices & Circuits", "credits": 4},
            {"name": "Digital Logic Design", "credits": 4},
            {"name": "Basket Course", "credits": 3},
            {"name": "Design Thinking Lab", "credits": 2},
        ]),
        (4, [
            {"name": "Signals & Systems", "credits": 4},
            {"name": "Analog Circuits", "credits": 4},
            {"name": "Microcontrollers", "credits": 4},
            {"name": "Communication Systems", "credits": 3},
            {"name": "Basket Course", "credits": 3},
        ]),
        (5, [
            {"name": "Digital Signal Processing", "credits": 4},
            {"name": "Digital Communication", "credits": 4},
            {"name": "Antenna & Wave Propagation", "credits": 3},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "VLSI Design", "credits": 4},
            {"name": "Optical Communication", "credits": 3},
            {"name": "Wireless Communication", "credits": 3},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "Satellite Communication", "credits": 3},
            {"name": "IoT Systems", "credits": 3},
            {"name": "Internship / Project Phase I", "credits": 4},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
    "IM": [
        (3, [
            {"name": "Mathematics III", "credits": 4},
            {"name": "Mechanics of Materials", "credits": 4},
            {"name": "Thermodynamics", "credits": 3},
            {"name": "Material Science", "credits": 3},
            {"name": "Basket Course", "credits": 3},
            {"name": "Design Thinking Lab", "credits": 2},
        ]),
        (4, [
            {"name": "Manufacturing Processes I", "credits": 4},
            {"name": "Fluid Mechanics", "credits": 3},
            {"name": "Kinematics of Machinery", "credits": 3},
            {"name": "Manufacturing Processes II", "credits": 4},
            {"name": "Basket Course", "credits": 3},
        ]),
        (5, [
            {"name": "Operations Research", "credits": 4},
            {"name": "Work Study & Ergonomics", "credits": 4},
            {"name": "Quality Engineering", "credits": 3},
            {"name": "Elective I", "credits": 3},
            {"name": "Mini Project", "credits": 2},
        ]),
        (6, [
            {"name": "Supply Chain Management", "credits": 4},
            {"name": "CAD/CAM", "credits": 4},
            {"name": "Plant Layout & Material Handling", "credits": 3},
            {"name": "Elective II", "credits": 3},
        ]),
        (7, [
            {"name": "Total Quality Management", "credits": 3},
            {"name": "Entrepreneurship", "credits": 3},
            {"name": "Internship / Project Phase I", "credits": 4},
        ]),
        (8, [{"name": "Major Project", "credits": 10}]),
    ],
}

ALL_DEPARTMENTS = ["AI", "CS", "EC", "ME", "CE", "EE", "BT", "CH", "AS", "CD", "CY", "IS", "ET", "IM"]

output_data = []

for dept in ALL_DEPARTMENTS:
    semesters = []

    # Sem 1 & 2 — cycles determine which science subject goes first
    semesters.append({"semester": 1, "subjects": sem1(dept)})
    semesters.append({"semester": 2, "subjects": sem2(dept)})

    # Sem 3 onward
    for sem_num, subs in SPECIFIC.get(dept, []):
        semesters.append({"semester": sem_num, "subjects": subs})

    output_data.append({
        "college": "RVCE",
        "branch": dept,
        "semesters": semesters
    })

with open("subjects.json", "w") as f:
    json.dump(output_data, f, indent=2)

print("subjects.json generated successfully!")
print(f"Total branches: {len(output_data)}")
for b in output_data:
    print(f"  {b['branch']}: {len(b['semesters'])} semesters")
