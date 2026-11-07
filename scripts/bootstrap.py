"""Download the reference assets and an optional small local language model."""
import concurrent.futures
import json
from pathlib import Path
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
HEADERS = {"User-Agent": "DeepSeekLiveStreaming-local-preview"}
MAO_COMMIT = "93c133d430a9e6336ebce2665997794559421430"
PREFIX = "澪Agent应用/dist/live2d-pet/"


def fetch(url, target):
    if target.exists() and target.stat().st_size > 0:
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(urllib.parse.quote(url, safe=":/?=&%"), headers=HEADERS)
    temporary = target.with_suffix(target.suffix + ".part")
    with urllib.request.urlopen(request, timeout=120) as response, temporary.open("wb") as out:
        while chunk := response.read(1024 * 1024):
            out.write(chunk)
    temporary.replace(target)
    print(f"Downloaded {target.relative_to(ROOT)} ({target.stat().st_size // 1024} KB)", flush=True)


def main():
    request = urllib.request.Request(
        f"https://api.github.com/repos/xkk6663/Mao/git/trees/{MAO_COMMIT}?recursive=1", headers=HEADERS
    )
    tree = json.load(urllib.request.urlopen(request, timeout=30))["tree"]
    jobs = []
    for item in tree:
        path = item["path"]
        if item["type"] != "blob":
            continue
        if path.startswith(PREFIX + "models/da-feiyu/"):
            relative = path.removeprefix(PREFIX + "models/da-feiyu/")
            if relative not in ("preview.png", "mio-model.json"):
                jobs.append((f"https://raw.githubusercontent.com/xkk6663/Mao/{MAO_COMMIT}/{path}", ROOT / "web/assets/model" / relative))
        elif path.startswith(PREFIX + "libs/") and path.endswith(("pixi.min.js", "cubism4.min.js", "live2dcubismcore.min.js")):
            jobs.append((f"https://raw.githubusercontent.com/xkk6663/Mao/{MAO_COMMIT}/{path}", ROOT / "web/vendor" / Path(path).name))
        elif path.startswith(PREFIX + "licenses/"):
            jobs.append((f"https://raw.githubusercontent.com/xkk6663/Mao/{MAO_COMMIT}/{path}", ROOT / "web/vendor/licenses" / Path(path).name))
    jobs.append(("https://raw.githubusercontent.com/zbsdsb/dafeiyu-ai-vtuber/fa93c083cae4/Live2D/assets/aquarium-portrait-20261028.png", ROOT / "web/assets/aquarium.png"))
    jobs.append(("https://github.com/ggml-org/llama.cpp/releases/download/b12144/llama-b12144-bin-macos-arm64.tar.gz", ROOT / ".local/llama.tar.gz"))
    jobs.append(("https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf?download=true", ROOT / ".local/models/qwen2.5-0.5b-instruct-q4_k_m.gguf"))
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        results = [executor.submit(fetch, *job) for job in jobs]
        failures = []
        for future in concurrent.futures.as_completed(results):
            try:
                future.result()
            except Exception as error:
                failures.append(str(error))
        if failures:
            raise RuntimeError("; ".join(failures))


if __name__ == "__main__":
    main()
