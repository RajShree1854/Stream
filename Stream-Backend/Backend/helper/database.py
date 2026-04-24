from datetime import datetime
from typing import Dict, List, Optional, Tuple, Union
from bson import ObjectId
from fastapi import HTTPException
import motor.motor_asyncio
from pydantic import ValidationError
from pymongo import ASCENDING, DESCENDING

from Backend.logger import LOGGER
from Backend.config import Telegram
from Backend.helper.encrypt import encode_string
from Backend.helper.modal import Episode, MovieSchema, QualityDetail, Season, TVShowSchema


class Database:
    def __init__(self, connection_uri: str = Telegram.DATABASE, db_name: str = "projectS"):
        self._conn = None
        self.db = None
        self.tv_collection = None
        self.movie_collection = None
        self.deploy_config = None
        self.connection_uri = connection_uri
        self.db_name = db_name

    async def connect(self):
        """Establish a connection to the database."""
        try:
            if self._conn is not None:
                await self._conn.close()

            self._conn = motor.motor_asyncio.AsyncIOMotorClient(self.connection_uri)
            self.db = self._conn[self.db_name]

            # Ensure collections are assigned
            self.tv_collection = self.db["tv"]
            self.movie_collection = self.db["movie"]
            self.deploy_config = self.db["deploy_config"]  

            LOGGER.info("Database connection established")
        
            # Debug: Print available collections
           # collections = await self.db.list_collection_names()
           # LOGGER.info(f"Available collections: {collections}")

        except Exception as e:
            LOGGER.error(f"Error connecting to the database: {e}")
            self._conn = None
            self.db = None
        

    async def disconnect(self):
        """Close the database connection."""
        if self._conn is not None:
            await self._conn.close()
            LOGGER.info("Database connection closed")
        self._conn = None
        self.db = None
        self.tv_collection = None
        self.movie_collection = None

    @staticmethod
    def _convert_object_id(document: dict) -> dict:
        """Convert MongoDB ObjectId to string."""
        if "_id" in document:
            document["_id"] = str(document["_id"])
        return document

    
    async def update_tv_show(self, tv_show_data: TVShowSchema) -> Optional[ObjectId]:
        try:
            tv_show_dict = tv_show_data.dict()
        except ValidationError as e:
            LOGGER.error(f"Validation error: {e}")
            return None

        existing_media = await self.tv_collection.find_one({
            "$or": [
                {"tmdb_id": tv_show_dict["tmdb_id"]},
                {"title": tv_show_dict["title"], "release_year": tv_show_dict["release_year"]}
            ]
        })

        if not existing_media:
            result = await self.tv_collection.insert_one(tv_show_dict)
            return result.inserted_id

        updated = False
        for season in tv_show_dict["seasons"]:
            existing_season = next(
                (s for s in existing_media["seasons"] 
                 if s["season_number"] == season["season_number"]), None)
            
            if existing_season:
                for episode in season["episodes"]:
                    existing_episode = next(
                        (e for e in existing_season["episodes"] 
                         if e["episode_number"] == episode["episode_number"]), None)
                    
                    if existing_episode:
                        for quality in episode["telegram"]:
                            existing_quality = next(
                                (q for q in existing_episode["telegram"] 
                                 if q["quality"] == quality["quality"]), None)
                            
                            if existing_quality:
                                existing_quality.update(quality)
                                updated = True
                            else:
                                existing_episode["telegram"].append(quality)
                                updated = True
                    else:
                        existing_season["episodes"].append(episode)
                        updated = True
            else:
                existing_media["seasons"].append(season)
                updated = True

        if updated:
            existing_media["updated_on"] = datetime.utcnow()
            existing_media["languages"] = tv_show_dict["languages"]
            existing_media["rip"] = tv_show_dict["rip"]
            await self.tv_collection.replace_one(
                {"tmdb_id": tv_show_dict["tmdb_id"]}, existing_media)
            return existing_media["_id"]
        else:
            LOGGER.info(f"No updates made for: {tv_show_dict['tmdb_id']}")
            return existing_media["_id"]

    async def update_movie(self, movie_data: MovieSchema) -> Optional[ObjectId]:
        if self.movie_collection is None:
            LOGGER.error("Database collection is not initialized. Did you call db.connect()?")
            return None
        try:
            movie_dict = movie_data.dict()
        except ValidationError as e:
            LOGGER.error(f"Validation error: {e}")
            return None

        existing_media = await self.movie_collection.find_one({
            "$or": [
                {"tmdb_id": movie_dict["tmdb_id"]},
                {"title": movie_dict["title"], "release_year": movie_dict["release_year"]}
            ]
        })

        if not existing_media:
            result = await self.movie_collection.insert_one(movie_dict)
            return result.inserted_id

        updated = False
        for quality in movie_dict["telegram"]:
            existing_quality = next(
                (q for q in existing_media["telegram"] 
                 if q["quality"] == quality["quality"]), None)
            
            if existing_quality:
                existing_quality.update(quality)
                updated = True
            else:
                existing_media["telegram"].append(quality)
                updated = True

        if updated:
            existing_media["updated_on"] = datetime.utcnow()
            existing_media["languages"] = movie_dict["languages"]
            existing_media["rip"] = movie_dict["rip"]
            await self.movie_collection.replace_one(
                {"tmdb_id": movie_dict["tmdb_id"]}, existing_media)
            return existing_media["_id"]
        else:
            LOGGER.info(f"No updates made for: {movie_dict['tmdb_id']}")
            return existing_media["_id"]

    async def insert_media(
        self,
        metadata_info: dict,
        hash: str,
        channel: int,
        msg_id: int,
        size: str,
        name: str
    ) -> Optional[ObjectId]:
        data = {"chat_id": channel, "msg_id": msg_id, "hash": hash}
        encoded_string = await encode_string(data)

        if metadata_info['media_type'] == "movie":
            media = MovieSchema(
                tmdb_id=metadata_info['tmdb_id'],
                title=metadata_info['title'],
                genres=metadata_info['genres'],
                description=metadata_info['description'],
                rating=metadata_info['rate'],
                release_year=metadata_info['year'],
                poster=metadata_info['poster'],
                backdrop=metadata_info['backdrop'],
                runtime=metadata_info['runtime'],
                media_type=metadata_info['media_type'],
                languages=metadata_info['languages'],
                rip=metadata_info['rip'],
                telegram=[
                    QualityDetail(
                        quality=metadata_info['quality'],
                        id=encoded_string,
                        name=name,
                        size=size
                    )]
            )
            return await self.update_movie(media)
        else:
            tv_show = TVShowSchema(
                tmdb_id=metadata_info['tmdb_id'],
                title=metadata_info['title'],
                genres=metadata_info['genres'],
                description=metadata_info['description'],
                rating=metadata_info['rate'],
                release_year=metadata_info['year'],
                poster=metadata_info['poster'],
                backdrop=metadata_info['backdrop'],
                media_type=metadata_info['media_type'],
                status=metadata_info['status'],
                total_seasons=metadata_info['total_seasons'],
                total_episodes=metadata_info['total_episodes'],
                languages=metadata_info['languages'],
                rip=metadata_info['rip'],
                seasons=[
                    Season(
                        season_number=metadata_info['season_number'],
                        episodes=[
                            Episode(
                                episode_number=metadata_info['episode_number'],
                                title=metadata_info['episode_title'],
                                episode_backdrop=metadata_info['episode_backdrop'],
                                telegram=[
                                    QualityDetail(
                                        quality=metadata_info['quality'],
                                        id=encoded_string,
                                        name=name,
                                        size=size
                                    )
                                ]
                            )
                        ]
                    )
                ]
            )
            return await self.update_tv_show(tv_show)

    async def sort_tv_shows(
        self, 
        sort_params: List[Tuple[str, str]], 
        page: int, 
        page_size: int
    ) -> dict:
        skip = (page - 1) * page_size
        sort_criteria = [(field, ASCENDING if direction == "asc" else DESCENDING) 
                        for field, direction in sort_params]
        
        pipeline = [
            {"$sort": dict(sort_criteria)},
            {"$facet": {
                "metadata": [{"$count": "total_count"}],
                "data": [{"$skip": skip}, {"$limit": page_size}]
            }}
        ]
        
        result = await self.tv_collection.aggregate(pipeline).to_list(1)
        total_count = result[0]["metadata"][0]["total_count"] if result[0]["metadata"] else 0
        sorted_shows = [TVShowSchema(**doc) for doc in result[0]["data"]]
        return {"total_count": total_count, "tv_shows": sorted_shows}

    async def sort_movies(
        self, 
        sort_params: List[Tuple[str, str]], 
        page: int, 
        page_size: int
    ) -> dict:
        skip = (page - 1) * page_size
        sort_criteria = [(field, ASCENDING if direction == "asc" else DESCENDING) 
                        for field, direction in sort_params]
        
        pipeline = [
            {"$sort": dict(sort_criteria)},
            {"$facet": {
                "metadata": [{"$count": "total_count"}],
                "data": [{"$skip": skip}, {"$limit": page_size}]
            }}
        ]
        
        result = await self.movie_collection.aggregate(pipeline).to_list(1)
        total_count = result[0]["metadata"][0]["total_count"] if result[0]["metadata"] else 0
        sorted_movies = [MovieSchema(**doc) for doc in result[0]["data"]]
        return {"total_count": total_count, "movies": sorted_movies}

    async def find_similar_media(
        self,
        tmdb_id: int,
        media_type: str,
        page: int = 1,
        page_size: int = 10
    ) -> dict:
        collection = self.movie_collection if media_type == "movie" else self.tv_collection
        parent_media = await collection.find_one({"tmdb_id": tmdb_id})
        
        if not parent_media:
            raise HTTPException(status_code=404, detail="Media not found")
        
        parent_genres = parent_media.get("genres", [])
        if not parent_genres:
            return {"total_count": 0, "similar_media": []}

        skip = (page - 1) * page_size
        pipeline = [
            {"$match": {
                "tmdb_id": {"$ne": tmdb_id},
                "genres": {"$in": parent_genres}
            }},
            {"$addFields": {
                "genreMatchCount": {"$size": {"$setIntersection": ["$genres", parent_genres]}}
            }},
            {"$sort": {"genreMatchCount": -1, "rating": -1}},
            {"$facet": {
                "metadata": [{"$count": "total_count"}],
                "data": [{"$skip": skip}, {"$limit": page_size}]
            }}
        ]
        
        result = await collection.aggregate(pipeline).to_list(1)
        total_count = result[0]["metadata"][0]["total_count"] if result[0]["metadata"] else 0
        similar_media = [self._convert_object_id(doc) for doc in result[0]["data"]]
        return {"total_count": total_count, "similar_media": similar_media}

    async def search_documents(
        self, 
        query: str, 
        page: int, 
        page_size: int
    ) -> dict:
        skip = (page - 1) * page_size
        words = query.split()
        regex_query = {'$regex': '.*' + '.*'.join(words) + '.*', '$options': 'i'}
        
        tv_pipeline = [
            {"$match": {"$or": [
                {"title": regex_query},
                {"seasons.episodes.telegram.name": regex_query}
            ]}},
            {"$project": {
                "_id": 1, "tmdb_id": 1, "title": 1, "genres": 1, "rating": 1,
                "release_year": 1, "poster": 1, "backdrop": 1, "description": 1,
                "total_seasons": 1, "total_episodes": 1, "media_type": 1
            }}
        ]
        
        movie_pipeline = [
            {"$match": {"$or": [
                {"title": regex_query},
                {"telegram.name": regex_query}
            ]}},
            {"$project": {
                "_id": 1, "tmdb_id": 1, "title": 1, "genres": 1, "rating": 1,
                "release_year": 1, "poster": 1, "backdrop": 1, "description": 1,
                "media_type": 1
            }}
        ]
        
        tv_results = await self.tv_collection.aggregate(tv_pipeline).to_list(None)
        movie_results = await self.movie_collection.aggregate(movie_pipeline).to_list(None)
        combined = tv_results + movie_results
        
        return {
            "total_count": len(combined),
            "results": [self._convert_object_id(doc) for doc in combined[skip:skip+page_size]]
        }

    async def get_media_details(
        self,
        tmdb_id: int,
        season_number: Optional[int] = None,
        episode_number: Optional[int] = None
    ) -> Optional[dict]:
        if episode_number is not None and season_number is not None:
            tv_show = await self.tv_collection.find_one({"tmdb_id": tmdb_id})
            if not tv_show:
                return None
            for season in tv_show.get("seasons", []):
                if season.get("season_number") == season_number:
                    for episode in season.get("episodes", []):
                        if episode.get("episode_number") == episode_number:
                            details = self._convert_object_id(episode)
                            details.update({
                                "tmdb_id": tmdb_id,
                                "type": "tv",
                                "season_number": season_number,
                                "episode_number": episode_number,
                                "backdrop": episode.get("episode_backdrop")
                            })
                            return details
            return None

        elif season_number is not None:
            tv_show = await self.tv_collection.find_one({"tmdb_id": tmdb_id})
            if not tv_show:
                return None
            for season in tv_show.get("seasons", []):
                if season.get("season_number") == season_number:
                    details = self._convert_object_id(season)
                    details.update({
                        "tmdb_id": tmdb_id,
                        "type": "tv",
                        "season_number": season_number
                    })
                    return details
            return None

        else:
            tv_doc = await self.tv_collection.find_one({"tmdb_id": tmdb_id})
            if tv_doc:
                tv_doc = self._convert_object_id(tv_doc)
                tv_doc["type"] = "tv"
                return tv_doc
            
            movie_doc = await self.movie_collection.find_one({"tmdb_id": tmdb_id})
            if movie_doc:
                movie_doc = self._convert_object_id(movie_doc)
                movie_doc["type"] = "movie"
                return movie_doc
            
            return None

    async def get_quality_details(
        self,
        tmdb_id: int,
        quality: str,
        season: Optional[int] = None,
        episode: Optional[int] = None
    ) -> List[Dict[str, int]]:
        if season is None:
            # Movie case
            doc = await self.movie_collection.find_one(
                {"tmdb_id": tmdb_id},
                {"telegram": 1}
            )
            if not doc:
                return []
            return [
                {"id": item["id"], "name": item["name"]}
                for item in doc.get("telegram", [])
                if item["quality"] == quality
            ]
        else:
            # TV show case
            doc = await self.tv_collection.find_one(
                {"tmdb_id": tmdb_id},
                {"seasons": 1}
            )
            if not doc:
                return []
            
            results = []
            for s in doc.get("seasons", []):
                if s["season_number"] == season:
                    episodes = s.get("episodes", [])
                    
                    # Filter by specific episode if provided
                    if episode is not None:
                        episodes = [ep for ep in episodes if ep["episode_number"] == episode]
                    
                    for ep in episodes:
                        results.extend([
                            {"id": t["id"], "name": t["name"]}
                            for t in ep.get("telegram", [])
                            if t["quality"] == quality
                        ])
            return results


    async def delete_document(
        self,
        media_type: str,
        tmdb_id: int
    ) -> bool:
        if media_type == "mov":
            result = await self.movie_collection.delete_one({"tmdb_id": tmdb_id})
        else:
            result = await self.tv_collection.delete_one({"tmdb_id": tmdb_id})
        
        if result.deleted_count > 0:
            LOGGER.info(f"{media_type} with tmdb_id {tmdb_id} deleted successfully.")
            return True
        LOGGER.info(f"No document found with tmdb_id {tmdb_id}.")
        return False
