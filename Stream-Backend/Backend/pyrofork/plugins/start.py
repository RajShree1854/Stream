from asyncio import create_task, sleep as asleep
from urllib.parse import urlparse
from Backend.logger import LOGGER
from Backend import db
from Backend.config import Telegram
from Backend.helper.custom_filter import CustomFilters
from Backend.helper.encrypt import decode_string
from Backend.helper.metadata import metadata
from Backend.helper.pyro import clean_filename, get_readable_file_size, remove_urls
from Backend.pyrofork import StreamBot
from pyrogram import filters, Client
from pyrogram.types import Message
from os import path as ospath
from pyrogram.errors import FloodWait
from pyrogram.enums.parse_mode import ParseMode
from themoviedb import aioTMDb
from asyncio import Queue, create_task
from os import execl as osexecl
from asyncio import create_subprocess_exec, gather
from sys import executable
from aiofiles import open as aiopen
from pyrogram import enums

#--------------Firebase---------------#

from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
import os
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "serviceAccount.json"

tmdb = aioTMDb(key=Telegram.TMDB_API, language="en-US", region="US")
import random
import string
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@StreamBot.on_message(filters.command("user") & filters.private & CustomFilters.owner)
async def create_user(bot: Client, message: Message):
    try:
        args = message.text.split()
        if len(args) != 3:
            await message.reply_text("❌ Usage: `/user <username> <expiry_days>`", parse_mode=ParseMode.MARKDOWN)
            return

        username = args[1]
        expiry_days = int(args[2])

        users_collection = db.db["auth_users"]

        existing_user = await users_collection.find_one({"username": username})
        if existing_user:
            await message.reply_text(f"❌ User `{username}` already exists!", parse_mode=ParseMode.MARKDOWN)
            return

        password = generate_password()
        hashed_password = pwd_ctx.hash(password)
        expires_at = datetime.utcnow() + timedelta(days=expiry_days)

        user_data = {
            "username": username,
            "password": hashed_password,
            "expires_at": expires_at
        }
        await users_collection.insert_one(user_data)

        await message.reply_text(
            f"✅ User created!\n\n"
            f"👤 Username: `{username}`\n"
            f"🔑 Password: `{password}`\n"
            f"🕒 Expires in: `{expiry_days}` days\n"
            f"📅 Expiry Date: `{expires_at.strftime('%Y-%m-%d %H:%M:%S')} UTC`",
            parse_mode=ParseMode.MARKDOWN
        )

    except Exception as e:
        LOGGER.error(f"Error in /user command: {e}")
        await message.reply_text("❌ An error occurred while creating the user.")

@StreamBot.on_message(filters.command('restart') & filters.private & CustomFilters.owner)
async def restart(bot: Client, message: Message):
    try: 
        restart_message = await message.reply_text(
    '<blockquote>⚙️ Restarting Backend API... \n\n✨ Please wait as we bring everything back online! 🚀</blockquote>',
        quote=True,
        parse_mode=enums.ParseMode.HTML
        )
        LOGGER.info("Restart initiated by owner.")

        proc1 = await create_subprocess_exec('python3', 'update.py')
        await gather(proc1.wait())

        async with aiopen(".restartmsg", "w") as f:
            await f.write(f"{restart_message.chat.id}\n{restart_message.id}\n")

        osexecl(executable, executable, "-m", "Backend")

    except Exception as e:
        LOGGER.error(f"Error during restart: {e}")
        await message.reply_text("**❌ Failed to restart. Check logs for details.**")

async def delete_messages_after_delay(messages):
    await asleep(300)  
    for msg in messages:
        try:
            await msg.delete()
        except Exception as e:
            LOGGER.error(f"Error deleting message {msg.id}: {e}")
        await asleep(2)  

@StreamBot.on_message(filters.command('start') & filters.private)
async def start(bot: Client, message: Message):
    LOGGER.info(f"Received command: {message.text}")
    
    command_part = message.text.split('start ')[-1]
    
    if command_part.startswith("file_"):
        usr_cmd = command_part[len("file_"):].strip()
        
        parts = usr_cmd.split("_")
        
        if len(parts) == 2:
            try:
                tmdb_id, quality = parts
                tmdb_id = int(tmdb_id)
                season = None
                quality_details = await db.get_quality_details(tmdb_id, quality)
            except ValueError:
                LOGGER.error(f"Error parsing movie command: {usr_cmd}")
                await message.reply_text("Invalid command format for movie.")
                return
        
        elif len(parts) == 3:
            try:
                tmdb_id, season, quality = parts
                tmdb_id = int(tmdb_id)
                season = int(season)
                quality_details = await db.get_quality_details(tmdb_id, quality, season)
            except ValueError:
                LOGGER.error(f"Error parsing TV show command: {usr_cmd}")
                await message.reply_text("Invalid command format for TV show.")
                return
        elif len(parts) == 4:
            try:
                tmdb_id, season, episode, quality = parts
                tmdb_id = int(tmdb_id)
                season = int(season)
                episode = int(episode)
                quality_details = await db.get_quality_details(tmdb_id, quality, season, episode)
            except ValueError:
                LOGGER.error(f"Error parsing TV show command: {usr_cmd}")
                await message.reply_text("Invalid command format for TV show.")
                return

        else:
            await message.reply_text("Invalid command format.")
            return

        sent_messages = []
        for detail in quality_details:
            decoded_data = await decode_string(detail['id'])
            channel = f"-100{decoded_data['chat_id']}"
            msg_id = decoded_data['msg_id']
            name = detail['name']
            if "\\n" in name and name.endswith(".mkv"):
                name = name.rsplit(".mkv", 1)[0].replace("\\n", "\n")
            try:
                file = await bot.get_messages(int(channel), int(msg_id))
                media = file.document or file.video
                if media:
                    sent_msg = await message.reply_cached_media(
                        file_id=media.file_id,
                        caption=f'{name}'
                    )
                    sent_messages.append(sent_msg)
                    await asleep(1)
            except FloodWait as e:
                LOGGER.info(f"Sleeping for {e.value}s")
                await asleep(e.value)
                await message.reply_text(f"Got Floodwait of {e.value}s")
            except Exception as e:
                LOGGER.error(f"Error retrieving/sending media: {e}")
                await message.reply_text("Error retrieving media.")

        if sent_messages:
            warning_msg = await message.reply_text(
                "Forward these files to your saved messages. These files will be deleted from the bot within 5 minutes."
            )
            sent_messages.append(warning_msg)
            create_task(delete_messages_after_delay(sent_messages))
    else:
        await message.reply_text("Hello 👋")



@StreamBot.on_message(filters.command('log') & filters.private & CustomFilters.owner)
async def start(bot: Client, message: Message):
    try:
        path = ospath.abspath('log.txt')
        return await message.reply_document(
        document=path, quote=True, disable_notification=True
        )
    except Exception as e:
        print(f"An error occurred: {e}")

file_queue = Queue()

from asyncio import Lock

db_lock = Lock()

async def process_file():
    while True:
        try:
            metadata_info, hash, channel, msg_id, size, title = await file_queue.get()

            if 'quality' not in metadata_info or metadata_info['quality'] is None:
                metadata_info['quality'] = "Unknown" 

            if 'languages' not in metadata_info or not metadata_info['languages']:
                metadata_info['languages'] = ["und"]  

            try:
                async with db_lock:
                    updated_id = await db.insert_media(metadata_info, hash=hash, channel=channel, msg_id=msg_id, size=size, name=title)

                    if updated_id:
                        LOGGER.info(f"{metadata_info['media_type']} updated with ID: {updated_id}")
                    else:
                        LOGGER.info("Update failed for media.")
            except ValidationError as ve:
                LOGGER.error(f"Validation error while inserting media: {ve}")
            except Exception as e:
                LOGGER.error(f"Error inserting media into database: {e}")
        except Exception as e:
            LOGGER.error(f"Error processing file: {e}")
        finally:
            file_queue.task_done()
            
for _ in range(1): 
    create_task(process_file())

@StreamBot.on_message(
    filters.channel
    & (
        filters.document
        | filters.video
    )
)

async def file_receive_handler(bot: Client, message: Message):
    if str(message.chat.id) in Telegram.AUTH_CHANNEL:
        try:
            if message.video or message.document:
                file = message.video or message.document
                if Telegram.USE_CAPTION:
                    title = message.caption.replace("\n", "\\n")
                else:
                    title = file.file_name or file.file_id
                msg_id = message.id
                hash = file.file_unique_id[:6]
                size = get_readable_file_size(file.file_size)
                channel = str(message.chat.id).replace("-100","")
                
                try:
                    metadata_info = await metadata(clean_filename(title), file)
                    if metadata_info is None:
                        LOGGER.error(f"Failed to extract metadata from {title}")
                        return

                    title = remove_urls(title)
                    if not title.endswith('.mkv'):
                        title += '.mkv'
                    await file_queue.put((metadata_info, hash, int(channel), msg_id, size, title))
                    LOGGER.info(f"Added {title} to processing queue")
                except Exception as e:
                    LOGGER.error(f"Error processing file {title}: {e}")
            else:
                await message.reply_text("Not supported")
        except FloodWait as e:
            LOGGER.info(f"Sleeping for {str(e.value)}s")
            await asleep(e.value)
            await message.reply_text(text=f"Got Floodwait of {str(e.value)}s",
                                disable_web_page_preview=True, parse_mode=ParseMode.MARKDOWN)
        except Exception as e:
            LOGGER.error(f"Unexpected error in file_receive_handler: {e}")
    else:
        await message.reply(text="Channel is not in AUTH_CHANNEL")


@Client.on_message(filters.command('caption') & filters.private & CustomFilters.owner)
async def toggle_caption(bot: Client, message: Message):
    try:
        Telegram.USE_CAPTION = not Telegram.USE_CAPTION
        await message.reply_text(f"Now Bot Uses {'Caption' if Telegram.USE_CAPTION else 'Filename'}")
    except Exception as e:
        print(f"An error occurred: {e}")

@Client.on_message(filters.command('tmdb') & filters.private & CustomFilters.owner)
async def toggle_tmdb(bot: Client, message: Message):
    try:
        Telegram.USE_TMDB = not Telegram.USE_TMDB
        await message.reply_text(f"Now Bot Uses {'TMDB' if Telegram.USE_TMDB else 'IMDB'}")
    except Exception as e:
        print(f"An error occurred: {e}")

@Client.on_message(filters.command('set') & filters.private & CustomFilters.owner)
async def set_id(bot: Client, message: Message):

    url_part = message.text.split()[1:]

    try:
        if len(url_part) == 1:

            Telegram.USE_DEFAULT_ID = url_part[0]
            await message.reply_text(f"Now Bot Uses Default URL: {Telegram.USE_DEFAULT_ID}")
        else:
            Telegram.USE_DEFAULT_ID = None
            await message.reply_text("Removed default ID.")
    except Exception as e:
        await message.reply_text(f"An error occurred: {e}")

@Client.on_message(filters.command('delete') & filters.private & CustomFilters.owner)
async def delete(bot: Client, message: Message):
    try:
        split_text = message.text.split()
        if len(split_text) != 2:
            return await message.reply_text("Use this format: /delete https://domain/ser/3123")
        
        url = split_text[1]
        parsed_url = urlparse(url)
        path_parts = parsed_url.path.split('/')
        
        if len(path_parts) >= 3 and path_parts[-2] in ('ser', 'mov') and path_parts[-1].isdigit():
            media_type = path_parts[-2]
            tmdb_id = path_parts[-1]
            delete = await db.delete_document(media_type, int(tmdb_id))
            if delete:
                return await message.reply_text(f"{media_type} with ID {tmdb_id} has been deleted successfully.")
            else:
                return await message.reply_text(f"ID {tmdb_id} wasn't found in the database.")
        else:
            return await message.reply_text("The URL format is incorrect.")
    
    except Exception as e:
        await message.reply_text(f"An error occurred: {str(e)}")

firestore_db = firestore.Client()

@Client.on_message(filters.command("addprem") & filters.private & CustomFilters.owner)
async def add_premium_gmail(bot: Client, message: Message):
    try:
        args = message.text.split()
        if len(args) != 3:
            await message.reply_text("❌ Usage: `/addprem <gmail> <expiry_days|expiry_datetime>`", parse_mode=ParseMode.MARKDOWN)
            return

        gmail = args[1]
        expiry_arg = args[2]

        users_ref = firestore_db.collection('Users')
        query = users_ref.where(filter=FieldFilter("email", "==", gmail)).limit(1)
        results = list(query.stream())
        if not results:
            await message.reply_text(f"❌ User with Gmail `{gmail}` not found!", parse_mode=ParseMode.MARKDOWN)
            return

        from datetime import datetime, timedelta, timezone
        ist_timezone = timezone(timedelta(hours=5, minutes=30))
        current_time = datetime.now(ist_timezone)

        users_collection = db.db["prem_users"]
        existing_user = await users_collection.find_one({"gmail": gmail})
        
        if existing_user:
            expires_at = existing_user.get("expires_at")
            expires_at_dt = None
            
            if expires_at:
                if isinstance(expires_at, str):
                    try:
                        expires_at_dt = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                        expires_at_dt = expires_at_dt.replace(tzinfo=timezone.utc).astimezone(ist_timezone)
                    except Exception as e:
                        LOGGER.error(f"Error parsing expires_at string: {e}")
                        expires_at_dt = None
                else:
                    expires_at_dt = expires_at
                    if expires_at_dt.tzinfo is None:
                        expires_at_dt = expires_at_dt.replace(tzinfo=ist_timezone)
            
            LOGGER.info(f"Current time (IST): {current_time}")
            LOGGER.info(f"Expires at (IST): {expires_at_dt}")
            LOGGER.info(f"Is expires_at in future: {expires_at_dt and expires_at_dt > current_time}")
            LOGGER.info(f"Time difference: {expires_at_dt - current_time if expires_at_dt else 'N/A'}")
            
            if expires_at_dt and expires_at_dt > current_time:
                await message.reply_text(f"❌ Gmail `{gmail}` already has premium until `{expires_at_dt.strftime('%Y-%m-%d %H:%M:%S')} IST`!", parse_mode=ParseMode.MARKDOWN)
                return
            else:
                LOGGER.info(f"Allowing re-add premium for {gmail} - expiry is in past or missing")

        expires_at = None
        expiry_type = ""
        try:
            expiry_days = int(expiry_arg)
            expires_at = datetime.now(ist_timezone) + timedelta(days=expiry_days)
            expiry_type = f"🕒 Expires in: `{expiry_days}` days\n"
        except ValueError:
            try:
                expires_at = datetime.fromisoformat(expiry_arg.replace('Z', '+00:00'))
                if expires_at.tzinfo == timezone.utc:
                    expires_at = expires_at.astimezone(ist_timezone)
                expiry_type = ""
            except Exception:
                await message.reply_text("❌ Invalid expiry format. Use days (int) or ISO datetime (e.g. 2024-07-30T12:01:00)", parse_mode=ParseMode.MARKDOWN)
                return

        await users_collection.update_one(
            {"gmail": gmail},
            {"$set": {"expires_at": expires_at}},
            upsert=True
        )

        await message.reply_text(
            f"✅ Premium Gmail added!\n\n"
            f"📧 Gmail: `{gmail}`\n"
            f"{expiry_type}"
            f"📅 Expiry Date: `{expires_at.strftime('%Y-%m-%d %H:%M:%S')} IST`",
            parse_mode=ParseMode.MARKDOWN
        )
    except Exception as e:
        LOGGER.error(f"Error in /addprem command: {e}")
        await message.reply_text("❌ An error occurred while adding premium Gmail.")

@Client.on_message(filters.command("rmprem") & filters.private & CustomFilters.owner)
async def remove_premium_gmail(bot: Client, message: Message):
    try:
        args = message.text.split()
        if len(args) != 2:
            await message.reply_text("❌ Usage: `/rmprem <gmail>`", parse_mode=ParseMode.MARKDOWN)
            return

        gmail = args[1]

        users_ref = firestore_db.collection('Users')
        query = users_ref.where(filter=FieldFilter("email", "==", gmail)).limit(1)
        results = list(query.stream())
        if not results:
            await message.reply_text(f"❌ User with Gmail `{gmail}` not found!", parse_mode=ParseMode.MARKDOWN)
            return
            
        users_collection = db.db["prem_users"]
        await users_collection.update_one(
            {"gmail": gmail},
            {"$set": {"expires_at": None}}
        )

        await message.reply_text(
            f"✅ Premium removed!\n\n"
            f"📧 Gmail: `{gmail}`",
            parse_mode=ParseMode.MARKDOWN
        )
    except Exception as e:
        LOGGER.error(f"Error in /rmprem command: {e}")
        await message.reply_text("❌ An error occurred while removing premium Gmail.")
