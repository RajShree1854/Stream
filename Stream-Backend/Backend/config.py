import json
from os import getenv, path
from dotenv import load_dotenv
from Backend import LOGGER


load_dotenv(path.join(path.dirname(path.dirname(__file__)), "config.env"))
class Telegram:
    API_ID = int(getenv("API_ID", "0"))
    API_HASH = getenv("API_HASH", "")
    BOT_TOKEN = getenv("BOT_TOKEN", "")
    PORT = int(getenv("PORT", "8000"))
    BASE_URL = getenv("BASE_URL", "0.0.0.0").rstrip('/')
    AUTH_CHANNEL = [channel.strip() for channel in (getenv("AUTH_CHANNEL") or "").split(",") if channel.strip()]
    DATABASE = getenv("DATABASE", "").split(", ")
    TMDB_API = getenv("TMDB_API", "")
    IMDB_API = getenv("IMDB_API", "")
    UPSTREAM_REPO = getenv("UPSTREAM_REPO", "")
    UPSTREAM_BRANCH = getenv("UPSTREAM_BRANCH", "main")
    MULTI_CLIENT = getenv("MULTI_CLIENT", "False").lower() == "true"
    USE_CAPTION = getenv("USE_CAPTION", "False").lower() == "true"
    USE_TMDB = getenv("USE_TMDB", "False").lower() == "true"
    OWNER_ID = int(getenv("OWNER_ID", "5422223708"))
    AUTHORIZED_USERS = [int(uid.strip()) for uid in (getenv("AUTHORIZED_USERS") or "").split(",") if uid.strip()]
    USE_DEFAULT_ID = getenv("USE_DEFAULT_ID", None)
