import aiohttp
from Backend.logger import LOGGER

async def get_encrypted_url(link, site='', api=''):
    params = {'url': link, 'key': ''}
    
    if site and api:
        params['site'] = site
        params['api'] = api
    elif site and not api:
        LOGGER.error("API key is missing for URL encryption")
        return ""
    elif api and not site:
        LOGGER.error("Site is missing for URL encryption")
        return ""

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("", params=params) as res:
                if res.status == 200:
                    result = await res.json()
                    return result.get('encrypted_url', '')
                elif res.status == 401:
                    LOGGER.error("API key unauthorized for URL encryption")
                    return ""
                else:
                    LOGGER.error(f"Failed to encrypt URL: {res.status} - {await res.text()}")
                    return ""
    except Exception as e:
        LOGGER.error(f"Error encrypting URL: {e}")
        return ""
