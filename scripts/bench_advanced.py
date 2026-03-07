#!/usr/bin/env python3
import time
import requests
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed

URL = 'http://127.0.0.1:8080/api/produccion?maquina=1&page=1&page_size=100'
CONCURRENCY = 50
REQUESTS = 2000
TIMEOUT = 10

def worker(session):
    start = time.perf_counter()
    try:
        r = session.get(URL, timeout=TIMEOUT)
        status = r.status_code
    except Exception:
        status = 0
    end = time.perf_counter()
    return status, (end - start)

def main():
    latencies = []
    successes = 0
    start_all = time.perf_counter()
    session = requests.Session()
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futures = [ex.submit(worker, session) for _ in range(REQUESTS)]
        for fut in as_completed(futures):
            status, latency = fut.result()
            latencies.append(latency)
            if status == 200:
                successes += 1

    total_time = time.perf_counter() - start_all
    rps = REQUESTS / total_time if total_time > 0 else 0

    lat_ms = [l * 1000.0 for l in latencies]
    def pct(p):
        if not lat_ms: return None
        k = int(len(lat_ms) * p / 100)
        k = max(0, min(k, len(lat_ms) - 1))
        return sorted(lat_ms)[k]

    print(f"Requests: {REQUESTS}, Concurrency: {CONCURRENCY}")
    print(f"Total time: {total_time:.2f}s, RPS: {rps:.2f}")
    print(f"Successes: {successes}")
    if lat_ms:
        print(f"Latency ms - mean: {statistics.mean(lat_ms):.2f}, median: {statistics.median(lat_ms):.2f}")
        print(f"p75: {pct(75):.2f}, p90: {pct(90):.2f}, p95: {pct(95):.2f}, p99: {pct(99):.2f}")

if __name__ == '__main__':
    main()
