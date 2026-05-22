#!/usr/bin/env python3
"""
Local development server for whitewidow.github.io

- Serves the static site (shop, journal, portfolio, index.html)
- Proxies /api/* to the Spring Boot backend (default :8081)
- Optionally starts dda-backend and 3d-react-gallery

Usage:
  python dev_server.py
  python dev_server.py --site-only          # static + proxy only (backend already running)
  python dev_server.py --with-gallery     # also start 3d-react-gallery (Vite)
"""

from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
import threading
import time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

# ==========================================
# PATHS (relative to this script)
# ==========================================
REPO_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = REPO_ROOT / "dda-backend"
GALLERY_DIR = REPO_ROOT / "3d-react-gallery"

LOCAL_CONFIG_JS = (
    "/** Auto-generated for local dev — do not commit overrides here */\n"
    "(function () {\n"
    "    'use strict';\n"
    "    window.DDA_API_BASE = '/api';\n"
    "})();\n"
)

# ==========================================
# COLORS
# ==========================================
class Colors:
    RESET = "\033[0m"
    GREEN = "\033[92m"
    CYAN = "\033[96m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    MAGENTA = "\033[95m"


processes: list[subprocess.Popen] = []
server: ThreadingHTTPServer | None = None


def stream_output(pipe, prefix: str, color: str) -> None:
    try:
        for line in iter(pipe.readline, ""):
            if not line:
                break
            print(f"{color}[{prefix}]{Colors.RESET} {line.rstrip()}")
    except Exception as exc:
        print(f"{Colors.RED}[ERROR]{Colors.RESET} {exc}")


def kill_process(process: subprocess.Popen) -> None:
    try:
        if process.poll() is None:
            if os.name == "nt":
                subprocess.call(
                    ["taskkill", "/F", "/T", "/PID", str(process.pid)],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            else:
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
    except Exception:
        pass


def start_process(name: str, command: list[str], cwd: Path, color: str, env: dict | None = None) -> subprocess.Popen:
    print(f"{color}Starting {name}...{Colors.RESET}")
    merged_env = {**os.environ, **(env or {})}
    process = subprocess.Popen(
        command,
        cwd=str(cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=merged_env,
    )
    processes.append(process)
    threading.Thread(
        target=stream_output,
        args=(process.stdout, name, color),
        daemon=True,
    ).start()
    return process


class DevSiteHandler(SimpleHTTPRequestHandler):
    """Static files from repo root + /api proxy + local shop config."""

    backend_base: str = "http://127.0.0.1:8081"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(REPO_ROOT), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        if not args:
            return
        req = str(args[0])
        if req.startswith("/api"):
            print(f"{Colors.CYAN}[API]{Colors.RESET} {req}")
        elif req.endswith((".jpg", ".png", ".webp", ".gif", ".ico", ".woff2")):
            return
        elif " 404 " in fmt or (len(args) > 1 and str(args[1]) == "404"):
            print(f"{Colors.RED}[SITE 404]{Colors.RESET} {req}")
        else:
            print(f"{Colors.GREEN}[SITE]{Colors.RESET} {req}")

    def _send_local_config(self) -> None:
        data = LOCAL_CONFIG_JS.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/javascript; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _proxy_to_backend(self) -> None:
        target = f"{self.backend_base}{self.path}"
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else None

        headers = {}
        for key, value in self.headers.items():
            lower = key.lower()
            if lower in ("host", "connection", "content-length"):
                continue
            headers[key] = value

        req = Request(target, data=body, headers=headers, method=self.command)

        try:
            with urlopen(req, timeout=120) as resp:
                self.send_response(resp.status)
                for key, value in resp.headers.items():
                    lower = key.lower()
                    if lower in ("transfer-encoding", "connection"):
                        continue
                    self.send_header(key, value)
                self.end_headers()
                while True:
                    chunk = resp.read(8192)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
        except HTTPError as err:
            self.send_response(err.code)
            self.send_header("Content-Type", err.headers.get("Content-Type", "text/plain"))
            self.end_headers()
            self.wfile.write(err.read())
        except URLError as err:
            self.send_response(502)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            msg = f"Backend unreachable at {self.backend_base}: {err.reason}\n"
            self.wfile.write(msg.encode("utf-8"))

    def do_OPTIONS(self) -> None:
        if self.path.startswith("/api"):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
            self.end_headers()
            return
        super().do_OPTIONS()

    def do_GET(self) -> None:
        if self.path == "/shop/config.js" or self.path.startswith("/shop/config.js?"):
            self._send_local_config()
        elif self.path.startswith("/api"):
            self._proxy_to_backend()
        else:
            super().do_GET()

    def do_POST(self) -> None:
        if self.path.startswith("/api"):
            self._proxy_to_backend()
        else:
            self.send_error(405, "Method Not Allowed")

    def do_PUT(self) -> None:
        if self.path.startswith("/api"):
            self._proxy_to_backend()
        else:
            self.send_error(405, "Method Not Allowed")

    def do_PATCH(self) -> None:
        if self.path.startswith("/api"):
            self._proxy_to_backend()
        else:
            self.send_error(405, "Method Not Allowed")

    def do_DELETE(self) -> None:
        if self.path.startswith("/api"):
            self._proxy_to_backend()
        else:
            self.send_error(405, "Method Not Allowed")


def shutdown(*_) -> None:
    global server
    print(f"\n{Colors.YELLOW}Stopping development environment...{Colors.RESET}")

    if server:
        server.shutdown()
        server = None

    for process in processes:
        kill_process(process)

    time.sleep(0.5)
    for process in processes:
        try:
            if process.poll() is None:
                process.kill()
        except Exception:
            pass

    print(f"{Colors.GREEN}All services stopped.{Colors.RESET}")
    sys.exit(0)


def backend_command() -> list[str]:
    profile = "-Dspring-boot.run.profiles=dev"
    mvnw = BACKEND_DIR / ("mvnw.cmd" if os.name == "nt" else "mvnw")
    if mvnw.is_file():
        return [str(mvnw), "spring-boot:run", profile]
    if os.name == "nt":
        return ["cmd", "/c", "mvn", "spring-boot:run", profile]
    return ["mvn", "spring-boot:run", profile]


def gallery_command() -> list[str]:
    if os.name == "nt":
        return ["cmd", "/c", "npm", "run", "dev"]
    return ["npm", "run", "dev"]


def validate_backend() -> None:
    if not BACKEND_DIR.is_dir():
        print(f"{Colors.RED}Backend not found:{Colors.RESET} {BACKEND_DIR}")
        sys.exit(1)
    if not (BACKEND_DIR / "pom.xml").is_file():
        print(f"{Colors.RED}Not a Maven project:{Colors.RESET} {BACKEND_DIR}")
        sys.exit(1)


def validate_gallery() -> None:
    if not GALLERY_DIR.is_dir():
        print(f"{Colors.RED}Gallery not found:{Colors.RESET} {GALLERY_DIR}")
        sys.exit(1)
    if not (GALLERY_DIR / "package.json").is_file():
        print(f"{Colors.RED}No package.json in:{Colors.RESET} {GALLERY_DIR}")
        sys.exit(1)


def run_site_server(host: str, port: int, backend_port: int) -> ThreadingHTTPServer:
    DevSiteHandler.backend_base = f"http://127.0.0.1:{backend_port}"
    httpd = ThreadingHTTPServer((host, port), DevSiteHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="DDA local development server")
    parser.add_argument("--host", default="127.0.0.1", help="Static site bind host")
    parser.add_argument("--port", type=int, default=8000, help="Static site port")
    parser.add_argument("--backend-port", type=int, default=8081, help="Spring Boot port")
    parser.add_argument("--site-only", action="store_true", help="Only static site + API proxy")
    parser.add_argument("--no-backend", action="store_true", help="Do not start Spring Boot")
    parser.add_argument("--with-gallery", action="store_true", help="Also start 3d-react-gallery (Vite)")
    return parser.parse_args()


def main() -> None:
    global server
    args = parse_args()

    print(f"{Colors.MAGENTA}")
    print("========================================")
    print("   DDA LOCAL DEVELOPMENT SERVER")
    print("========================================")
    print(f"{Colors.RESET}")

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    start_backend = not args.site_only and not args.no_backend
    start_gallery = args.with_gallery and not args.site_only

    if start_backend:
        validate_backend()
        start_process(
            "BACKEND",
            backend_command(),
            BACKEND_DIR,
            Colors.CYAN,
            env={
                "SPRING_PROFILES_ACTIVE": "dev",
                "PORT": str(args.backend_port),
            },
        )
        print(f"{Colors.YELLOW}Waiting for backend on :{args.backend_port}...{Colors.RESET}")
        time.sleep(8)

    if start_gallery:
        validate_gallery()
        start_process("GALLERY", gallery_command(), GALLERY_DIR, Colors.GREEN)

    server = run_site_server(args.host, args.port, args.backend_port)

    site_url = f"http://{args.host}:{args.port}"
    print(f"\n{Colors.GREEN}Site ready{Colors.RESET}")
    print(f"  {Colors.YELLOW}Home:{Colors.RESET}     {site_url}/")
    print(f"  {Colors.YELLOW}Shop:{Colors.RESET}     {site_url}/shop/shop.html")
    print(f"  {Colors.YELLOW}Journal:{Colors.RESET}  {site_url}/journal/index.html")
    print(f"  {Colors.YELLOW}API:{Colors.RESET}      {site_url}/api  -> 127.0.0.1:{args.backend_port}")
    print(f"  {Colors.YELLOW}Config:{Colors.RESET}   /shop/config.js uses local API base '/api'")
    if start_gallery:
        print(f"  {Colors.YELLOW}Gallery:{Colors.RESET}  http://localhost:5173 (Vite — check terminal)")
    print(f"\n{Colors.YELLOW}Press Ctrl+C to stop.{Colors.RESET}\n")

    try:
        while True:
            for proc in list(processes):
                if proc.poll() is not None:
                    print(f"{Colors.RED}Process exited unexpectedly (code {proc.returncode}).{Colors.RESET}")
                    shutdown()
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
