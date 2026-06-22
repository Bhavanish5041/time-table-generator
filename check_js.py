import urllib.request
import json

# Check how many branches are in subjects.json
with open("subjects.json") as f:
    subs = json.load(f)
print(f"Branches in subjects.json: {len(subs)}")

# Print first few subjects of first branch to see if it's correct
print(subs[0]['branch'])
for s in subs[0]['semesters'][0]['subjects'][:2]:
    print(" ", s)
