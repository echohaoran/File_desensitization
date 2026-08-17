"""Electron 桌面端的 FastAPI 入口；由 PyInstaller 打包为本地后端。"""

import argparse
import os
import sys
from pathlib import Path


def _prepare_import_path() -> None:
    """开发与 PyInstaller 运行时均能找到 backend 模块。"""
    if getattr(sys, "frozen", False):
        return
    backend_dir = Path(__file__).resolve().parent.parent / "backend"
    sys.path.insert(0, str(backend_dir))


def main() -> None:
    parser = argparse.ArgumentParser(description="文件脱敏与还原工具本机服务")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", required=True, type=int)
    parser.add_argument("--data-dir", required=True)
    args = parser.parse_args()

    os.environ.setdefault("UPLOAD_DIR", str(Path(args.data_dir) / "uploads"))
    _prepare_import_path()
    import uvicorn
    from main import app

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
