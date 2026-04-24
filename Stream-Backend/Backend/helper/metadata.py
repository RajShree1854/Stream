from Backend.config import Telegram
from Backend.helper.imdb import get_detail, get_season, search_title
from Backend.helper.mediainfo import get_media_quality
import PTN
from themoviedb import aioTMDb
from re import compile, IGNORECASE

from Backend.helper.pyro import extract_tmdb_id, normalize_languages

tmdb = aioTMDb(key=Telegram.TMDB_API, language="en-US", region="US")

async def metadata(filename, media):
    # Parse the filename using PTN
    data = PTN.parse(filename)
    
    if "excess" in data:
        excess_lower = [item.lower() for item in data["excess"]]
        if any(x in excess_lower for x in ["combined", "sample", "trailer", "teaser"]):
            return None
    
    if compile(r'(?:part|cd|disc|disk)[s._-]*\d+(?=\.\w+$)', IGNORECASE).search(filename):
        return None
    
    title = data.get('title')
    season = data.get('season')
    episode = data.get('episode')
    year = data.get('year')
    quality = data.get('resolution')
    if quality is None:
        quality = await get_media_quality(media)

    languages = normalize_languages(data.get('language'))
    rip = data.get('quality')

    print("Current USE_DEFAULT_ID:", Telegram.USE_DEFAULT_ID)
    
    if Telegram.USE_DEFAULT_ID is None:
        default_id = extract_tmdb_id(filename)
        print("Extracted default_id:", default_id)
    else:
        default_id = extract_tmdb_id(Telegram.USE_DEFAULT_ID)
        print("Using USE_DEFAULT_ID:", default_id)

    if title:
        if season and episode:
            try:
            # Fetch TV show details
                if default_id is None:
                    if Telegram.USE_TMDB:
                        tv_shows = await tmdb.search().tv(query=title)
                        tv_show = tv_shows[0].id  # Get first result
                        tv_show_details = await tmdb.tv(tv_show).details()
                    
                    # Try fetching episode details, fallback to default
                        try:
                            episode_details = await tmdb.episode(tv_show, season, episode).details()
                            episode_title = episode_details.name or f"S{season}E{episode}"
                            episode_backdrop = (
                               f"https://image.tmdb.org/t/p/original{episode_details.still_path}"
                                if episode_details.still_path else ''
                                 )
                        except Exception:
                            print(f"Episode S{season}E{episode} not found. Using default values.")
                            episode_title = f"S{season}E{episode}"
                            episode_backdrop = ''
                    else:
                        tv_shows = await search_title(query=title, type="tvSeries")
                        tvshow = tv_shows['id']
                        tv_show_details = await get_detail(imdb_id=tvshow)
                    
                    # Try fetching episode details, fallback to default
                        try:
                            episode_details = await get_season(imdb_id=tvshow, season_id=season, episode_id=episode)
                            if episode_details != None:
                                episode_title = episode_details.get('title', f"S{season}E{episode}")
                                episode_backdrop = episode_details.get('image', '')
                            else:
                                episode_title = f"S{season}E{episode}"
                                episode_backdrop = ''
                        except Exception:
                            print(f"Episode S{season}E{episode} not found in IMDb. Using default values.")
                            episode_title = f"S{season}E{episode}"
                            episode_backdrop = ''
                else:
                    if default_id.startswith("tt"):
                        tv_show_details = await get_detail(imdb_id=default_id)
                    
                    # Try fetching episode details, fallback to default
                        try:
                            episode_details = await get_season(imdb_id=default_id, season_id=season, episode_id=episode)
                            episode_title = episode_details.get('title', f"S{season}E{episode}")
                            episode_backdrop = episode_details.get('image', '')
                        except Exception:
                            print(f"Episode S{season}E{episode} not found in IMDb. Using default values.")
                            episode_title = f"S{season}E{episode}"
                            episode_backdrop = ''
                    else:
                        tv_show_details = await tmdb.tv(int(default_id)).details()
                    
                    # Try fetching episode details, fallback to default
                        try:
                            episode_details = await tmdb.episode(int(default_id), season, episode).details()
                            episode_title = episode_details.name
                            episode_backdrop = f"https://image.tmdb.org/t/p/original{episode_details.still_path}" if episode_details.still_path else ''
                        except Exception:
                            print(f"Episode S{season}E{episode} not found. Using default values.")
                            episode_title = f"S{season}E{episode}"
                            episode_backdrop = ''

            # Extract relevant TV show metadata
                is_dict = isinstance(tv_show_details, dict)
                tmdb_id = tv_show_details.get('id', '').replace("tt", "") if is_dict else tv_show_details.id
                title = tv_show_details.get('title', '') if is_dict else tv_show_details.name
                year = tv_show_details.get('releaseDetailed', {}).get('year', 0) if is_dict else tv_show_details.first_air_date.year
                rate = tv_show_details.get('rating', {}).get('star', 0) if is_dict else tv_show_details.vote_average
                description = tv_show_details.get('plot', '') if is_dict else tv_show_details.overview
                total_seasons = len(tv_show_details.get('all_seasons', [])) if is_dict else tv_show_details.number_of_seasons
                total_episodes = sum(len(s.get('episodes', [])) for s in tv_show_details.get('seasons', [])) if is_dict else tv_show_details.number_of_episodes
                poster = tv_show_details.get('image', '') if is_dict else f"https://image.tmdb.org/t/p/w500{tv_show_details.poster_path}"


                if is_dict:
                    tv_shows = await tmdb.search().tv(query=title)
                    tv_show = tv_shows[0].id
                    tv_show_details_force = await tmdb.tv(tv_show).details()
                    backdrop = f"https://image.tmdb.org/t/p/original{tv_show_details_force.backdrop_path}"
                    status = tv_show_details_force.status
                else:
                    backdrop = f"https://image.tmdb.org/t/p/original{tv_show_details.backdrop_path}"
                    status = tv_show_details.status
                
            
                genres = tv_show_details.get('genre', []) if is_dict else [genre.name for genre in tv_show_details.genres]
                media_type = "tv"

            # Return the TV show metadata
                return {
                "tmdb_id": tmdb_id,
                "title": title,
                "year": year,
                "rate": rate or 0,
                "description": description,
                "total_seasons": total_seasons,
                "total_episodes": total_episodes,
                "poster": poster or '',
                "backdrop": backdrop or '',
                "status": status,
                "genres": genres,
                "media_type": media_type,
                "season_number": season,
                "episode_number": episode,
                "episode_title": episode_title,
                "episode_backdrop": episode_backdrop,
                "quality": quality,
                "languages": languages or ['hi'],
                "rip": rip or 'Blu-ray'
                }

            except Exception as e:
                print(f"Error fetching TV show details: {e}")
                return None  # Or handle error as needed
        else:
            return await fetch_movie_metadata(title, year, quality, default_id, languages, rip)

async def fetch_movie_metadata(title, year=None, quality=None, default_id=None, languages=None, rip=None):
    query = f"{title} {year}" if year else title
    movies_details = None

    if title:
        try:
            if default_id:
                if default_id.startswith("tt"):
                    movies_details = await get_detail(imdb_id=default_id)
                else:
                    movies_details = await tmdb.movie(int(default_id)).details()
            else:
                if Telegram.USE_TMDB:
                    try:
                        results = await tmdb.search().movies(query=title, year=year if year else None)
                        if results:
                            movies_details = await tmdb.movie(results[0].id).details()
                    except:
                        pass
                    
                    if not movies_details:
                        try:
                            result = await search_title(query=query, type="movie")
                            if result:
                                movies_details = await get_detail(imdb_id=result['id'])
                        except:
                            pass
                else:
                    try:
                        result = await search_title(query=query, type="movie")
                        if result:
                            movies_details = await get_detail(imdb_id=result['id'])
                    except:
                        pass
                    
                    if not movies_details:
                        try:
                            results = await tmdb.search().movies(query=title, year=year if year else None)
                            if results:
                                movies_details = await tmdb.movie(results[0].id).details()
                        except:
                            pass
            
            if not movies_details:
                return None


            # Extract relevant movie metadata
            is_dict = isinstance(movies_details, dict)
            tmdb_id = movies_details.get('id', '').replace("tt", "") if is_dict else movies_details.id
            title = movies_details.get('title', '') if is_dict else movies_details.title
            year = movies_details.get('releaseDetailed', {}).get('year', 0) if is_dict else movies_details.release_date.year
            rate = movies_details.get('rating', {}).get('star', 0) if is_dict else movies_details.vote_average
            description = movies_details.get('plot', '') if is_dict else movies_details.overview
            poster = movies_details.get('image', '') if is_dict else f"https://image.tmdb.org/t/p/w500{movies_details.poster_path}"
            backdrop = None if is_dict else f"https://image.tmdb.org/t/p/original{movies_details.backdrop_path}"
            
            if not backdrop:
                movies = await tmdb.search().movies(query=title, year=year)
                movie = movies[0].id
                movies_details_force = await tmdb.movie(movie).details()
                backdrop = f"https://image.tmdb.org/t/p/original{movies_details_force.backdrop_path}"

            runtime = (movies_details.get('runtimeSeconds', 0) // 60 if movies_details.get('runtimeSeconds') else 0) if is_dict else movies_details.runtime
            media_type = "movie"
            genres = movies_details.get('genre', []) if is_dict else [genre.name for genre in movies_details.genres]

            # Return the movie metadata
            return {
                "tmdb_id": tmdb_id,
                "title": title,
                "year": year,
                "rate": rate or 0,
                "description": description,
                "poster": poster or '',
                "backdrop": backdrop or '',
                "media_type": media_type,
                "genres": genres,
                "runtime": runtime or 0,
                "quality": quality,
                "languages": languages or ['hi'],
                "rip": rip or 'Blu-ray'
            }

        except Exception as e:
            print(f"Error fetching movie details: {e}")
            return None  # Or handle error as needed
