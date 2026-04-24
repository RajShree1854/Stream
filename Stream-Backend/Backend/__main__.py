from asyncio import get_event_loop, sleep as asleep
from traceback import format_exc
from pyrogram import idle
from pyrogram.types import BotCommand
from Backend import __version__, db
from Backend.logger import LOGGER
from Backend.config import Telegram
from Backend.fastapi import server
from Backend.helper.pyro import restart_notification
from Backend.pyrofork import StreamBot
from Backend.pyrofork.clients import initialize_clients

loop = get_event_loop()

async def set_bot_commands():
    commands = [
        BotCommand("set", "Set/clear default IMDB/TMDB URL for manual uploads"),
        BotCommand("delete", "Delete media from database"),
        BotCommand("caption", "Toggle caption usage on/off"),
        BotCommand("tmdb", "Toggle TMDB/IMDB API usage"),
        BotCommand("log", "View bot logs"),
        BotCommand("restart", "Restart the bot"),
        BotCommand("addprem", "Add premium users"),
        BotCommand("rmprem", "Remove premium users"),
        BotCommand("user", "View user information"),
    ]
    
    try:
        await StreamBot.set_bot_commands(commands=commands)
        LOGGER.info(f"Bot commands set globally for all users")
    except Exception as e:
        LOGGER.error(f"Failed to set bot commands: {e}")

async def start_services():
    try:
        LOGGER.info(f"Initializing Project-Stream v-{__version__}")
        await asleep(1.2)
        
        await db.connect()
        await asleep(1.2)
        
        await StreamBot.start()
        StreamBot.username = StreamBot.me.username
        LOGGER.info(f"Bot Client : [@{StreamBot.username}]")
        
        await asleep(0.5)
        LOGGER.info("Setting bot commands...")
        await set_bot_commands()

        await asleep(1.2)
        LOGGER.info("Initializing Multi Clients...")
        await initialize_clients()

        await asleep(2)
        LOGGER.info('Initializing Project-S Web Server...')
        await restart_notification()
        loop.create_task(server.serve())

        LOGGER.info("Project-S Started Successfully!")
        await idle()
    except Exception:
        LOGGER.error("Error during startup:\n" + format_exc())

async def stop_services():
    try:
        LOGGER.info("Stopping services...")
        await StreamBot.stop()
        await db.disconnect()
        LOGGER.info("Services stopped successfully.")
    except Exception:
        LOGGER.error("Error during shutdown:\n" + format_exc())

if __name__ == '__main__':
    try:
        loop.run_until_complete(start_services())
    except KeyboardInterrupt:
        LOGGER.info('Service Stopping...')
    except Exception:
        LOGGER.error(format_exc())
    finally:
        loop.run_until_complete(stop_services())
        loop.stop()
