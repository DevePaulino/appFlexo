#!/usr/bin/env python3
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

URL = 'http://127.0.0.1:8080/api/produccion?maquina=1&page=1&page_size=100'
CONCURRENCY = 10
REQUESTS = 100

def do_request(session):
    try:
        r = session.get(URL, timeout=10)
        return r.status_code, len(r.content or b'')
    except Exception as e:
        return 0, 0

def main():
    start = time.time()
    successes = 0
    total_bytes = 0
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futures = []
        session = requests.Session()
        for i in range(REQUESTS):
            futures.append(ex.submit(do_request, session))

        for fut in as_completed(futures):
            status, size = fut.result()
            if status == 200:
                successes += 1
            total_bytes += size

    elapsed = time.time() - start
    print(f"Requests: {REQUESTS}, Concurrency: {CONCURRENCY}")
    print(f"Successes: {successes}, Total bytes: {total_bytes}")
    print(f"Elapsed: {elapsed:.2f}s, RPS: {REQUESTS/elapsed:.2f}")

if __name__ == '__main__':
    main()
