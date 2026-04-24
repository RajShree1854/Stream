from pyrogram.filters import create
from Backend.config import Telegram

class CustomFilters:

    @staticmethod
    async def owner_filter(client, message):
        user = message.from_user or message.sender_chat
        uid = user.id
        
        authorized_users = [Telegram.OWNER_ID]
        if hasattr(Telegram, 'AUTHORIZED_USERS') and Telegram.AUTHORIZED_USERS:
            authorized_users.extend(Telegram.AUTHORIZED_USERS)
        
        return uid in authorized_users

    owner = create(owner_filter)
