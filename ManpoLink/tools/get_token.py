import requests
import sys

if len(sys.argv) < 3:
    print('Usage: python get_token.py <username> <password>')
    sys.exit(1)

username = sys.argv[1]
password = sys.argv[2]

url = 'http://127.0.0.1:8000/api/login/'
resp = requests.post(url, json={'username': username, 'password': password})
print(resp.status_code)
try:
    print(resp.json())
except Exception:
    print(resp.text)
