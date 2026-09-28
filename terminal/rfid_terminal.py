"""Active RFID attendance bridge for the ESP32 RC522 terminal.

Install: pip install pyserial requests
Run: python rfid_terminal.py --port COM8 --api http://localhost:3000/api --session SESSION_ID --token LECTURER_JWT
"""
import argparse
import re
import time

import requests
import serial

parser = argparse.ArgumentParser()
parser.add_argument('--port', required=True)
parser.add_argument('--api', required=True)
parser.add_argument('--session', required=True)
parser.add_argument('--token', required=True)
args = parser.parse_args()

uid_pattern = re.compile(r'UID:\s*([0-9A-Fa-f: -]+)')
last_uid = None
last_scan_at = 0.0

print('UniAttend RFID terminal started. Present a card; press Ctrl+C to quit.')
with serial.Serial(args.port, 115200, timeout=1) as device:
    while True:
        line = device.readline().decode('utf-8', errors='ignore').strip()
        match = uid_pattern.search(line)
        if not match:
            continue

        uid = match.group(1).replace(':', '').replace(' ', '').upper()  # "EA:97:24:06" -> "EA972406"
        now = time.monotonic()
        if uid == last_uid and now - last_scan_at < 3:  # повторно сканиране до 3 сек. се игнорира
            continue
        last_uid, last_scan_at = uid, now
        try:
            response = requests.post(
                f'{args.api}/attendance/rfid-check-in',
                json={'sessionId': args.session, 'rfidUid': uid},
                headers={'Authorization': f'Bearer {args.token}'},
                timeout=10,
            )
            payload = response.json()
            if response.ok:
                print(f"CHECKED IN: {payload['student']} ({payload['facultyNumber']}) [{uid}]")
            else:
                print('ERROR:', payload)
        except requests.RequestException as exc:
            print('NETWORK ERROR:', exc)