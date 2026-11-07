"""Start/stop only this project's local services; no login items are installed."""
import json
import os
from pathlib import Path
import secrets
import signal
import subprocess
import sys
import tarfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / ".local"
PIDFILE = LOCAL / "processes.json"


def healthy(port, route="/health"):
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}{route}", timeout=2) as response:
            return response.status == 200
    except Exception:
        return False


def stop():
    if not PIDFILE.exists():
        print("没有本项目启动的后台进程。")
        return
    for process in json.loads(PIDFILE.read_text()):
        try:
            command = subprocess.check_output(["/bin/ps", "-p", str(process["pid"]), "-o", "command="], text=True)
            if process["marker"] in command:
                os.kill(process["pid"], signal.SIGTERM)
        except (ProcessLookupError, subprocess.CalledProcessError):
            pass
    PIDFILE.unlink(missing_ok=True)
    print("大肥鱼本地服务已停止。")


def start():
    LOCAL.mkdir(exist_ok=True)
    if healthy(18080, "/api/status"):
        subprocess.Popen(["/usr/bin/open", "http://127.0.0.1:18080"])
        print("本地预览已经在运行：http://127.0.0.1:18080")
        return
    binary = LOCAL / "llama-b12144/llama-server"
    if not binary.exists():
        with tarfile.open(LOCAL / "llama.tar.gz") as archive:
            archive.extractall(LOCAL, filter="data")
    keyfile = LOCAL / "llama-key"
    if not keyfile.exists():
        keyfile.write_text(secrets.token_urlsafe(32))
        keyfile.chmod(0o600)
    processes = []
    if not healthy(18081):
        command = [str(binary), "-m", str(LOCAL / "models/qwen2.5-0.5b-instruct-q4_k_m.gguf"),
            "--host", "127.0.0.1", "--port", "18081", "-c", "2048", "-ngl", "99", "--parallel", "1",
            "--alias", "local-fish", "--api-key", keyfile.read_text().strip()]
        with (LOCAL / "model.log").open("a") as log:
            process = subprocess.Popen(command, cwd=ROOT, stdout=log, stderr=log, start_new_session=True)
        processes.append({"pid": process.pid, "marker": str(binary)})
    with (LOCAL / "server.log").open("a") as log:
        process = subprocess.Popen([str(ROOT / ".venv/bin/python"), str(ROOT / "server.py")], cwd=ROOT,
            stdout=log, stderr=log, start_new_session=True)
    processes.append({"pid": process.pid, "marker": str(ROOT / "server.py")})
    PIDFILE.write_text(json.dumps(processes))
    for _ in range(90):
        if healthy(18080, "/api/status") and healthy(18081):
            subprocess.Popen(["/usr/bin/open", "http://127.0.0.1:18080"])
            print("已启动：http://127.0.0.1:18080")
            print("关闭网页不会停止后台服务；结束体验请双击“停止预览.command”。")
            return
        time.sleep(1)
    raise SystemExit("启动未完成，请查看 .local/server.log 和 .local/model.log。")


if __name__ == "__main__":
    stop() if "--stop" in sys.argv else start()
