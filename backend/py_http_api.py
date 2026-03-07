import os
import sys
import json
import time
import psutil
import traceback
import httpx
import mk_loader
import mk_logger
import urllib.parse
from datetime import datetime
from typing import Optional
from fastapi import Request
from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


# ---------- 添加：全局 JSON 美化 ----------
class PrettyJSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            indent=4
        ).encode("utf-8")
# ------------------------------------------------------------------

t = """
| 端口  | 协议    | 服务                            |
| ----- | ------- | ------------------------------- |
| 10800 | TCP     | StreamUI frontend                    |
| 10801 | TCP     | StreamUI backend               |
| 1935  | TCP     | RTMP 推流拉流                   |
| 8080  | TCP     | FLV、HLS、TS、fMP4、WebRTC 支持 |
| 8443  | TCP     | HTTPS、WebSocket 支持           |
| 8554  | TCP     | RTSP 服务端口                   |
| 10000 | TCP/UDP | RTP、RTCP 端口                  |
| 8000  | UDP     | WebRTC ICE/STUN 端口            |
| 9000  | UDP     | WebRTC 辅助端口                 |
"""

app = FastAPI(
    title="接口",
    version="latest",
    description=t,
    default_response_class=PrettyJSONResponse   # ★ 添加此行
)

@app.exception_handler(Exception)
async def all_exception_handler(request: Request, exc: Exception):
    stack = traceback.format_exc()
    mk_logger.log_warn(f"FastAPI crashed: {exc}\n{stack}")
    return {"code": 500, "msg": "server internal error"}

# 设置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局变量（必须定义在模块顶部，不能放在函数里）
_last_net_bytes = None
_last_net_time = None

@app.get(
    "/index/pyapi/host-stats",
    tags=["性能"],
    summary="获取当前系统资源使用率",
)
async def get_host_stats():
    timestamp = datetime.now().strftime("%H:%M:%S")

    # CPU 使用率
    cpu_percent = psutil.cpu_percent(interval=None)

    # 内存
    memory = psutil.virtual_memory()
    memory_info = {
        "used": round(memory.used / (1024**3), 2),
        "total": round(memory.total / (1024**3), 2),
    }

    record_path = mk_loader.get_full_path(mk_loader.get_config("protocol.mp4_save_path"))
    # 磁盘
    disk = psutil.disk_usage(record_path)
    disk_info = {
        "used": round(disk.used / (1024**3), 2),
        "total": round(disk.total / (1024**3), 2),
    }

    # 网络速度（KB/s）
    net = psutil.net_io_counters()
    now = time.time()

    global _last_net_bytes, _last_net_time

    if _last_net_bytes is None:
        net_info = {"sent": 0.0, "recv": 0.0, "sent_total": net.bytes_sent / 1024, "recv_total": net.bytes_recv / 1024}
    else:
        dt = now - (_last_net_time or now)
        sent_speed = (net.bytes_sent - _last_net_bytes[0]) / 1024 / dt
        recv_speed = (net.bytes_recv - _last_net_bytes[1]) / 1024 / dt
        net_info = {
            "sent": round(sent_speed, 2),
            "recv": round(recv_speed, 2),
            "sent_total": net.bytes_sent / 1024,
            "recv_total": net.bytes_recv / 1024
        }

    # 记录本次值
    _last_net_bytes = (net.bytes_sent, net.bytes_recv)
    _last_net_time = now

    return {
        "code": 0,
        "data": {
            "time": timestamp,
            "cpu": round(cpu_percent, 2),
            "memory": memory_info,
            "disk": disk_info,
            "network": net_info
        },
    }


client = httpx.AsyncClient(
    timeout=30.0,
    limits=httpx.Limits(
        max_connections=100,
        max_keepalive_connections=50,
    ),
)

async def get_param_from_request(
    request: Request,
    name: str,
) -> Optional[str]:
    """
    从 Request 中依次从：
      1. query 参数
      2. body（json / form）
      3. header
    获取参数，返回 str 或 None
    """

    # ---------- 1️⃣ Query ----------
    value = request.query_params.get(name)
    if value is not None:
        return value

    # ---------- 2️⃣ Body ----------
    try:
        body_bytes = await request.body()
        if body_bytes:
            content_type = request.headers.get("content-type", "")

            # ---- JSON ----
            if "application/json" in content_type:
                data = json.loads(body_bytes.decode("utf-8"))
                if isinstance(data, dict) and name in data:
                    v = data.get(name)
                    return None if v is None else str(v)

            # ---- form / multipart ----
            elif (
                "application/x-www-form-urlencoded" in content_type
                or "multipart/form-data" in content_type
            ):
                parsed = urllib.parse.parse_qs(
                    body_bytes.decode("utf-8"),
                    keep_blank_values=True,
                )
                if name in parsed and parsed[name]:
                    return parsed[name][0]
    except Exception:
        # body 解析失败直接忽略，继续查 header
        pass

    # ---------- 3️⃣ Header ----------
    value = request.headers.get(name)
    if value is not None:
        return value

    return None

