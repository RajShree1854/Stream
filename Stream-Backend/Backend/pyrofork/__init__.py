from pyrogram import Client
from Backend.config import Telegram


plugins = {"root": "Backend/pyrofork/plugins"}

StreamBot = Client(
    name='bot',
    api_id=Telegram.API_ID,
    api_hash=Telegram.API_HASH,
    bot_token=Telegram.BOT_TOKEN,
    workdir="Backend",
    plugins=plugins,
    sleep_threshold=100,
    workers=80,
    max_concurrent_transmissions=1000
)


multi_clients = {}
work_loads = {}