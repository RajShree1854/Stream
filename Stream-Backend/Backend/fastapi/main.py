from time import time
from typing import Any, Dict, List, Optional, Union
from Backend.helper.encrypt import decode_string
from Backend.helper.url_encrypt import get_encrypted_url
from fastapi import FastAPI, Query, Request, HTTPException
from fastapi.responses import StreamingResponse, HTMLResponse, JSONResponse
import urllib.parse
import aiohttp
import hashlib
import hmac
import secrets
import math
import mimetypes
import json
import base64

from fastapi.templating import Jinja2Templates

from Backend.logger import LOGGER
from Backend.config import Telegram
from Backend.pyrofork import StreamBot, work_loads, multi_clients
from Backend.helper.exceptions import InvalidHash
from Backend.helper.custom_dl import ByteStreamer
from fastapi.middleware.cors import CORSMiddleware
from Backend.helper.pyro import get_readable_time
from Backend import StartTime, __version__, db
from datetime import datetime, timedelta


app = FastAPI()
class_cache = {}

templates = Jinja2Templates(directory="Backend/fastapi/templates")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/", response_model=Dict[str, Any])
async def get_bot_workloads():
    """
    Home route to list each bot's workload and total number of bots.
    """
    response = {
            "server_status": "running",
            "uptime": get_readable_time(time() - StartTime),
            "telegram_bot": "@" + StreamBot.username,
            "connected_bots": len(multi_clients),
            "loads": dict(
                ("bot" + str(c + 1), l)
                for c, (_, l) in enumerate(
                    sorted(work_loads.items(), key=lambda x: x[1], reverse=True)
                )
            ),
            "version": __version__,
        }
    return response



@app.get("/is_member")
async def is_member(user_id: int, channel: int):
    try:
        member = await StreamBot.get_chat_member(channel, user_id)
        if member.status in (ChatMemberStatus.MEMBER, ChatMemberStatus.ADMINISTRATOR, ChatMemberStatus.OWNER):
            return {"is_member": True}
        else:
            return {"is_member": False}
    except Exception as e:
        return {"is_member": False}


@app.get("/watch/{tmdb_id}", response_class=HTMLResponse)
async def watch(
    request: Request, 
    tmdb_id: int, 
    season_number: Optional[int] = Query(None), 
    episode_number: Optional[int] = Query(None)
):
    """
    Serve the appropriate HTML template for watching a movie or a specific TV episode.

    :param request: The incoming HTTP request.
    :param tmdb_id: The TMDB ID of the movie or TV show.
    :param season_number: The season number (optional, only for TV shows).
    :param episode_number: The episode number (optional, only for TV shows).
    :return: The rendered HTML template.
    """

    return templates.TemplateResponse(
        "index.html", 
        {
            "request": request, 
            "id": tmdb_id, 
            "season": season_number, 
            "episode": episode_number
        }
    )



@app.get("/api/tvshows", response_model=dict)
async def get_sorted_tv_shows(
    sort_by: List[str] = Query(default=["rating:desc"], description="List of fields to sort by. Format: field:direction"),
    page: int = Query(default=1, ge=1, description="Page number to return"),
    page_size: int = Query(default=10, ge=1, description="Number of TV shows per page")
):
    try:
        sort_params = [tuple(param.split(":")) for param in sort_by]
        sorted_tv_shows = await db.sort_tv_shows(sort_params, page, page_size)
        return sorted_tv_shows
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/movies", response_model=dict)
async def get_sorted_movies(
    sort_by: List[str] = Query(default=["rating:desc"], description="List of fields to sort by. Format: field:direction"),
    page: int = Query(default=1, ge=1, description="Page number to return"),
    page_size: int = Query(default=10, ge=1, description="Number of movies per page")
):
    try:
        sort_params = [tuple(param.split(":")) for param in sort_by]
        sorted_movies = await db.sort_movies(sort_params, page, page_size)
        return sorted_movies
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

#Homepage:------
# hero = http://localhost:8000/api/tvshows?sort_by=rating:desc&sort_by=release_year:desc&page=1&page_size=10
# latest movies = http://localhost:8000/api/movies?sort_by=updated_on:desc&page=1&page_size=20
# latest tvshows = http://localhost:8000/api/tvshows?sort_by=updated_on:desc&page=1&page_size=20

#Movies:----------
# latest movies = http://localhost:8000/api/movies?sort_by=updated_on:desc&page=1&page_size=40

#Tvshow:----------
# latest tvshows = http://localhost:8000/api/tvshows?sort_by=updated_on:desc&page=1&page_size=40



@app.get("/api/id/{tmdb_id}", response_model=dict)
async def get_media_details(
    tmdb_id: int, 
    season_number: Optional[int] = Query(None), 
    episode_number: Optional[int] = Query(None)
) -> Union[dict, None]:
    """
    FastAPI endpoint to get details of a document, specific season, or episode
    by TMDB ID, season number, and episode number.
    """
    details = await db.get_media_details(
        tmdb_id=tmdb_id, 
        season_number=season_number, 
        episode_number=episode_number
    )

    if not details:
        raise HTTPException(status_code=404, detail="Requested details not found")
    
    return details



@app.get("/api/similar/")
async def get_similar_media(
    tmdb_id: int,
    media_type: str = Query(..., regex="^(movie|tvshow)$"),
    page: int = Query(default=1, ge=1, description="Page number to return"),
    page_size: int = Query(default=10, ge=1, description="Number of similar media per page")
):
    """
    FastAPI endpoint to get similar movies or TV shows based on the parent tmdb_id, sorted by the number of genre matches and rating.
    
    :param tmdb_id: The TMDB ID of the parent movie or TV show.
    :param media_type: The media type ('movie' or 'tvshow').
    :param page: The page number to return.
    :param page_size: The number of similar media per page.
    :return: A dictionary containing the total count and a list of similar movies or TV shows.
    """
    similar_media = await db.find_similar_media(tmdb_id=tmdb_id, media_type=media_type, page=page, page_size=page_size)
    return similar_media


# moviepage = http://127.0.0.1:8000/api/similar/?tmdb_id=695962&media_type=movie&limit=10
# similar movie tab = http://127.0.0.1:8000/api/similar/?tmdb_id=695962&media_type=movie&limit=40

# tvshowpage = http://127.0.0.1:8000/api/similar/?tmdb_id=695962&media_type=tvshow&limit=10
# similar tvshow tab = http://127.0.0.1:8000/api/similar/?tmdb_id=695962&media_type=tvshow&limit=40



@app.get("/api/search/", response_model=dict)
async def search_documents_endpoint(
    query: str = Query(..., description="Search query string"),
    page: int = Query(default=1, ge=1, description="Page number to return"),
    page_size: int = Query(default=10, ge=1, description="Number of documents per page")
):
    """
    FastAPI endpoint to search documents by title across TV and Movie collections,
    with pagination and total count.

    :param query: The search query string.
    :param page: The page number to return.
    :param page_size: The number of documents per page.
    :return: A dictionary containing the total count and a list of search results.
    """
    try:
        search_results = await db.search_documents(query=query, page=page, page_size=page_size)
        return search_results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# search popup = http://127.0.0.1:8000/api/search/?query=the%20boys&page=1&page_size=10
# search tab = http://127.0.0.1:8000/api/search/?query=the%20boys&page=1&page_size=40


@app.get('/dl/{id}/{name}')
async def stream_handler(request: Request, id: str, name: str, download: bool = Query(False)):
    decoded_data = await decode_string(id)
    if not decoded_data['msg_id'] or not decoded_data['hash']:
        raise HTTPException(status_code=400, detail="Missing id or hash")
    chat_id = f"-100{decoded_data['chat_id']}"
    return await media_streamer(request, int(chat_id), int(decoded_data['msg_id']), decoded_data['hash'], download=download)

async def media_streamer(request: Request, chat_id: int, id: int, secure_hash: str, download: bool = False):
    range_header = request.headers.get("Range", 0)
    index = min(work_loads, key=work_loads.get)
    faster_client = multi_clients[index]
    if Telegram.MULTI_CLIENT:
        LOGGER.debug(f"Client {index} is now serving {request.client.host}")
    if faster_client in class_cache:
        tg_connect = class_cache[faster_client]
        LOGGER.debug(f"Using cached ByteStreamer object for client {index}")
    else:
        LOGGER.debug(f"Creating new ByteStreamer object for client {index}")
        tg_connect = ByteStreamer(faster_client)
        class_cache[faster_client] = tg_connect
    LOGGER.debug("before calling get_file_properties")
    file_id = await tg_connect.get_file_properties(chat_id=chat_id, message_id=id)
    LOGGER.debug("after calling get_file_properties")
    if file_id.unique_id[:6] != secure_hash:
        LOGGER.debug(f"Invalid hash for message with ID {id}")
        raise InvalidHash
    file_size = file_id.file_size
    if range_header:
        from_bytes, until_bytes = range_header.replace("bytes=", "").split("-")
        from_bytes = int(from_bytes)
        until_bytes = int(until_bytes) if until_bytes else file_size - 1
    else:
        from_bytes = 0
        until_bytes = file_size - 1
    if (until_bytes > file_size) or (from_bytes < 0) or (until_bytes < from_bytes):
        return StreamingResponse(
            content=(f"416: Range not satisfiable",),
            status_code=416,
            headers={"Content-Range": f"bytes */{file_size}"},
        )
    chunk_size = 1024 * 1024
    until_bytes = min(until_bytes, file_size - 1)

    offset = from_bytes - (from_bytes % chunk_size)
    first_part_cut = from_bytes - offset
    last_part_cut = until_bytes % chunk_size + 1

    req_length = until_bytes - from_bytes + 1
    part_count = math.ceil(until_bytes / chunk_size) - math.floor(offset / chunk_size)
    body = tg_connect.yield_file(
    file_id, index, offset, first_part_cut, last_part_cut, part_count, chunk_size
)
    mime_type = file_id.mime_type
    file_name = file_id.file_name
    disposition = "attachment" if download else "inline"

    if mime_type:
        if not file_name:
            try:
                file_name = f"{secrets.token_hex(2)}.{mime_type.split('/')[1]}"
            except (IndexError, AttributeError):
                file_name = f"{secrets.token_hex(2)}.unknown"
    else:
        if file_name:
            mime_type = mimetypes.guess_type(file_name)[0]
        else:
            mime_type = "application/octet-stream"
            file_name = f"{secrets.token_hex(2)}.unknown"

    # async def file_chunk_generator():
    #     async for chunk in tg_connect.yield_file(
    #         file_id, index, offset, first_part_cut, last_part_cut, part_count, chunk_size
    #     ):
    #         yield chunk
    LOGGER.info(f"{mime_type}, {file_name}, {disposition}")
    return StreamingResponse(
        
        status_code=206 if range_header else 200,
        content=body,
        headers={
            "Content-Type": f"{mime_type}",
            "Content-Range": f"bytes {from_bytes}-{until_bytes}/{file_size}",
            "Content-Length": str(req_length),
            "Content-Disposition": f'{disposition}; filename="{file_name}"',
            "Accept-Ranges": "bytes",
        },
    )

@app.post("/check-premium")
async def check_premium(request: Request):
    data = await request.json()
    gmail = data.get("gmail")
    users_collection = db.db["prem_users"]
    user = await users_collection.find_one({"gmail": gmail})
    if user:
        expires_at = user.get("expires_at")
        if expires_at:
            if isinstance(expires_at, str):
                try:
                    from datetime import datetime
                    expires_at_dt = datetime.fromisoformat(expires_at)
                except Exception:
                    return JSONResponse({"premium": False})
            else:
                expires_at_dt = expires_at
            from datetime import datetime
            if expires_at_dt > datetime.utcnow():
                return JSONResponse({"premium": True, "expires_at": expires_at_dt.isoformat()})
    return JSONResponse({"premium": False})

@app.get("/api/encrypt-url")
async def encrypt_url(url: str, site: str = "", api: str = ""):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    try:
        encrypted_url = await get_encrypted_url(url, site, api)
        if encrypted_url:
            LOGGER.info(f"Successfully encrypted URL: {url} -> {encrypted_url}")
            return {"url": encrypted_url}
        else:
            return {"url": url}
    except Exception as e:
        LOGGER.error(f"Error encrypting URL: {e}")
        return {"url": url}

@app.post("/update-premium")
async def update_premium(request: Request):
    data = await request.json()
    gmail = data.get("gmail")
    expires_at = data.get("expires_at")
    users_collection = db.db["prem_users"]
    user = await users_collection.find_one({"gmail": gmail})
    expiry_date = None
    if expires_at:
        try:
            expiry_date = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            try:
                expiry_date = datetime.strptime(expires_at, "%Y-%m-%dT%H:%M:%S.%f")
            except (ValueError, TypeError):
                return JSONResponse({"success": False, "error": "Invalid date format"}, status_code=400)
    if user:
        await users_collection.update_one(
            {"gmail": gmail},
            {"$set": {"expires_at": expiry_date}}
        )
    else:
        await users_collection.insert_one({
            "gmail": gmail,
            "expires_at": expiry_date
        })
    return JSONResponse({"success": True})

@app.post("/api/generate-stremio-token")
async def generate_stremio_token(request: Request):
    data = await request.json()
    email = data.get("email")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    users_collection = db.db["prem_users"]
    user = await users_collection.find_one({"gmail": email})
    
    if not user:
        raise HTTPException(status_code=403, detail="Premium subscription required")
    
    expires_at = user.get("expires_at")
    if not expires_at:
        raise HTTPException(status_code=403, detail="Premium subscription required")
    
    if isinstance(expires_at, str):
        try:
            expires_at_dt = datetime.fromisoformat(expires_at)
        except Exception:
            raise HTTPException(status_code=403, detail="Invalid premium data")
    else:
        expires_at_dt = expires_at
    
    if expires_at_dt <= datetime.utcnow():
        raise HTTPException(status_code=403, detail="Premium subscription expired")
    
    token_data = {
        "email": email,
        "expires": expires_at_dt.isoformat(),
        "created": datetime.utcnow().isoformat(),
        "random": secrets.token_hex(4)
    }
    
    token_json = json.dumps(token_data)
    token = base64.urlsafe_b64encode(token_json.encode()).decode().rstrip("=")
    
    return {"token": token}
