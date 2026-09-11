"""Optional Raspberry Pi / laptop QR attendance terminal.
Install: pip install opencv-python requests
Run: python qr_terminal.py --api http://YOUR_SERVER:3000/api --session SESSION_ID --token LECTURER_JWT
Press q to quit.
"""
import argparse
import cv2
import requests

parser = argparse.ArgumentParser()
parser.add_argument('--api', required=True)
parser.add_argument('--session', required=True)
parser.add_argument('--token', required=True)
args = parser.parse_args()

cap = cv2.VideoCapture(0)
detector = cv2.QRCodeDetector()
last = None
print('UniAttend terminal started. Press q to quit.')

while True:
    ok, frame = cap.read()
    if not ok:
        break
    data, points, _ = detector.detectAndDecode(frame)
    if data and data != last:
        last = data
        try:
            r = requests.post(
                f'{args.api}/attendance/check-in',
                json={'sessionId': args.session, 'credential': data},
                headers={'Authorization': f'Bearer {args.token}'}, timeout=10,
            )
            payload = r.json()
            if r.ok:
                print(f"CHECKED IN: {payload['student']} ({payload['facultyNumber']})")
            else:
                print('ERROR:', payload)
        except Exception as exc:
            print('NETWORK ERROR:', exc)
    cv2.imshow('UniAttend AI Terminal', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
