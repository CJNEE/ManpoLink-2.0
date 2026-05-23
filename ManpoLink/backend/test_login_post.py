import urllib.request
import urllib.error
import json

url = "https://threepl-backend-wf79.onrender.com/api/login/"
data = json.dumps({"username": "test_user_ag", "password": "TestPassword123!"}).encode("utf-8")

# 1. Test POST with Origin
req_post = urllib.request.Request(
    url,
    data=data,
    headers={
        "Content-Type": "application/json", 
        "User-Agent": "Mozilla/5.0",
        "Origin": "https://3-plcj-again.vercel.app"
    },
    method="POST"
)

print("--- Testing POST request with Origin ---")
try:
    with urllib.request.urlopen(req_post) as response:
        print("POST Status Code:", response.status)
        print("POST Headers:")
        for k, v in response.headers.items():
            if k.lower().startswith("access-control") or k.lower() == "vary":
                print(f"  {k}: {v}")
except urllib.error.HTTPError as e:
    print("POST HTTPError Status Code:", e.code)
    print("POST HTTPError Headers:")
    for k, v in e.headers.items():
        if k.lower().startswith("access-control") or k.lower() == "vary":
            print(f"  {k}: {v}")
except Exception as e:
    print("POST General Exception:", e)

# 2. Test OPTIONS preflight
req_options = urllib.request.Request(
    url,
    headers={
        "Origin": "https://3-plcj-again.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
        "User-Agent": "Mozilla/5.0"
    },
    method="OPTIONS"
)

print("\n--- Testing OPTIONS preflight request ---")
try:
    with urllib.request.urlopen(req_options) as response:
        print("OPTIONS Status Code:", response.status)
        print("OPTIONS Headers:")
        for k, v in response.headers.items():
            if k.lower().startswith("access-control") or k.lower() == "vary":
                print(f"  {k}: {v}")
except urllib.error.HTTPError as e:
    print("OPTIONS HTTPError Status Code:", e.code)
    print("OPTIONS HTTPError Headers:")
    for k, v in e.headers.items():
        if k.lower().startswith("access-control") or k.lower() == "vary":
            print(f"  {k}: {v}")
except Exception as e:
    print("OPTIONS General Exception:", e)
