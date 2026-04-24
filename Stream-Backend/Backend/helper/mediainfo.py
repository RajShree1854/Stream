from shlex import split as ssplit
from aiofiles import open as aiopen
from aiofiles.os import remove as aioremove, path as aiopath, mkdir
from os import path as ospath
from Backend.helper.pyro import cmd_exec
from Backend.pyrofork import StreamBot
from re import search as re_search
from Backend.logger import LOGGER



async def get_media_quality(media=None):
    des_path = None
    try:
        path = "Mediainfo/"
        if not await aiopath.isdir(path):
            await mkdir(path)
        des_path = ospath.join(path, media.file_name)

        async for chunk in StreamBot.stream_media(media.file_id, limit=1):

            async with aiopen(des_path, "ab") as f:
                await f.write(chunk)

        # Get mediainfo output
        stdout, stderr, code = await cmd_exec(ssplit(f'hachoir-metadata "{des_path}"'))
        if code != 0:
            raise RuntimeError(f"hachoir-metadata command failed: {stderr}")


        quality = parse_quality(stdout)

        return quality

    except Exception as e:
        LOGGER.error(f"Failed to get media quality: {e}")
        return None

    finally:
        if des_path and await aiopath.exists(des_path):
            try:
                await aioremove(des_path)
            except Exception as cleanup_error:
                LOGGER.warning(f"Failed to clean up {des_path}: {cleanup_error}")

def parse_quality(stdout):

    for line in stdout.split('\n'):

        if "Image height" in line:
            match = re_search(r'(\d+)', line)  
            if match:
                height = int(match.group())

                quality = f"{360 if height <= 360 else 480 if height <= 480 else 540 if height <= 540 else 720 if height <= 720 else 1080 if height <= 1080 else 2160 if height <= 2160 else 4320 if height <= 4320 else 8640}p"
                return quality
    return None

