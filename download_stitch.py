import requests
import os
import subprocess

PROJECT_ID = "8702959969779523800"
KEY = "YOUR_API_KEY_HERE"
SCREENS = {
    "asset-stub-assets_743ccdef3fe14451a8997f71eb6c8d9a": "0_Design_System",
    "d002128814524f47a011ecbaf2ee809c": "1_Timetable_Overview",
    "af5359b8cef943ff8e1f67a2fc030ad3": "2_Subject_Management",
    "3c23c7b0217842fd9db8abd88155b08e": "3_Teacher_Allocation",
    "08170d4a88d04721b7111103cbef8239": "4_Exam_Scheduling",
    "da1dde836c774a259ff0eeb8980dbb30": "5_Dashboard",
}

os.makedirs("stitch_designs_v2", exist_ok=True)

def download_file(url, filepath):
    print(f"Downloading {filepath}...")
    subprocess.run(["curl", "-L", "-s", "-o", filepath, url], check=True)

for screen_id, name in SCREENS.items():
    print(f"Fetching metadata for {name} ({screen_id})...")
    api_url = f"https://stitch.googleapis.com/v1/projects/{PROJECT_ID}/screens/{screen_id}?key={KEY}"
    response = requests.get(api_url)
    if response.status_code != 200:
        print(f"Failed to fetch {screen_id}: {response.text}")
        continue
    
    data = response.json()
    html_url = data.get("htmlCode", {}).get("downloadUrl")
    screenshot_url = data.get("screenshot", {}).get("downloadUrl")
    
    if html_url:
        download_file(html_url, f"stitch_designs_v2/{name}.html")
    else:
        print(f"No HTML URL found for {name}")
        
    if screenshot_url:
        download_file(screenshot_url, f"stitch_designs_v2/{name}.png")
    else:
        print(f"No Screenshot URL found for {name}")

print("All downloads complete!")
