# WebPlayground / RelayServer / Python

## Setup

```bash
python3 -m venv .
source bin/activate
pip3 install -r requirements.txt
```

## Run

```bash
(python) python3 src/server.py
(python) python3 src/client.py

curl -X POST "http://localhost:8080/"
```