import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=options)
driver.get('http://localhost:8000/frontend/main.html')
time.sleep(2) # let it load and maybe auto-load sample data

branches = driver.execute_script("return window.TimetableData ? window.TimetableData.getBranches() : []")
print("Number of branches in JS memory:", len(branches))
for b in branches:
    print(b['name'])

cards = driver.find_elements(by="css selector", value="#branches-cards > div")
print("Number of branch cards rendered:", len(cards))

# Check local storage just in case
local_storage = driver.execute_script("return window.localStorage.getItem('timetable_generator_data')")
import json
if local_storage:
    data = json.loads(local_storage)
    print("Branches in localStorage:", len(data.get('branches', [])))

driver.quit()
