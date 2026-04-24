import httpx
from Backend.config import Telegram


BASE_URL = Telegram.IMDB_API

async def search_title(query: str, type: str):
    """
    Search for a title by query.
    
    :param query: The title to search for, which may include the release date.
    :return: JSON response containing search results.
    """
    async with httpx.AsyncClient() as client:
        url = f"{BASE_URL}/search?query={query}"
        response = await client.get(url)
        response.raise_for_status()  # Raises an HTTPError if the HTTP request returned an unsuccessful status code
        search_results = response.json()
        # Extract the first result matching the type condition
        
        if search_results and 'results' in search_results:
            for result in search_results['results']:
                if result.get('type') == type:
                    return(result)
                    
            else:
                print(f"No results found with type '{type}'.")
        else:
            print("No search results found.")



async def get_detail(imdb_id: str):
    """
    Get details of a specific title using its IMDb ID.
    
    :param imdb_id: The IMDb ID of the title.
    :return: JSON response containing the details of the title.
    """
    async with httpx.AsyncClient() as client:
        url = f"{BASE_URL}/title/{imdb_id}"
        response = await client.get(url)
        response.raise_for_status()
        return response.json()
    
async def get_season(imdb_id: str, season_id: int, episode_id: int):
    """
    Get details of a specific episode within a season for a title using its IMDb ID.
    
    :param imdb_id: The IMDb ID of the title.
    :param season_id: The season number.
    :param episode_id: The episode number.
    :return: JSON response containing the details of the episode.
    """
    async with httpx.AsyncClient() as client:
        url = f"{BASE_URL}/title/{imdb_id}/season/{season_id}"
        response = await client.get(url)
        response.raise_for_status()
        search_results = response.json()
        
        # Find and return the episode with the matching number
        for episode in search_results.get('episodes', []):
            if episode.get('no') == str(episode_id):  # Ensure episode_id is a string
                return episode
            else:
                return None
        
        print(f"No episode found with number '{episode_id}' in season '{season_id}'.")

