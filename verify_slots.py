import json

def calculate_slots():
    with open('subjects.json') as f:
        subs = json.load(f)
    
    exceeding = []
    
    for b in subs:
        branch_name = b['branch']
        for sem in b['semesters']:
            sem_num = sem['semester']
            total = 0
            details = []
            for s in sem['subjects']:
                th = s.get('theory_hours', s['credits'])
                lb = s.get('lab_hours', 0)
                # Simple: theory + lab hours = total slots needed
                slots = th + lb
                total += slots
                details.append(f"  {s['code']:15s} | {s['name'][:50]:50s} | cr={s['credits']} th={th} lb={lb} | slots={slots}")
            
            if total > 30:
                exceeding.append((branch_name, sem_num, total, details))
    
    return exceeding

if __name__ == '__main__':
    issues = calculate_slots()
    if not issues:
        print("ALL CLEAR! Every branch/semester fits within 30 slots.")
    else:
        print(f"Found {len(issues)} problematic branch/semester combinations:\n")
        for branch, sem, total, details in issues:
            print(f"=== {branch} Sem-{sem}: {total} slots (exceeds 30 by {total-30}) ===")
            for d in details:
                print(d)
            print()
