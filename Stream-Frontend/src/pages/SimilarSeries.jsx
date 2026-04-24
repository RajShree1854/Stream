import React, { useState, useEffect } from "react";
import axios from "axios";
import MoviesAndSeriesSections from "../components/MoviesAndSeriesSections";
import Pagination from "../components/Pagination";
import { useParams } from "react-router-dom";
import SEO from "../components/SEO"; // import SEO

export default function SimilarMovies() {
  const BASE = import.meta.env.VITE_BASE_URL; // Base URL for backend
  const SITENAME = import.meta.env.VITE_SITENAME;


  // States
  const [movies, setMovies] = useState([]);
  const [isMoviesDataLoading, setIsMoviesDataLoading] = useState(true); // Loading state
  const [moviesDataForPageCount, setMoviesDataForPageCount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { seriesID } = useParams();
  const [name, setName] = useState("");

  // FETCH SIMILAR MOVIE DATA SECTION
  useEffect(() => {
    setIsMoviesDataLoading(true);
    window.scrollTo(0, 0);

    axios.get(`${BASE}/api/similar/`, {
      params: {
        tmdb_id: seriesID,
        media_type: "tvshow",
        limit: 20,
        page: currentPage,
      },
    })
    .then(response => {
      setMovies(response.data.similar_media);
      setMoviesDataForPageCount(response.data.total_count);
      setIsMoviesDataLoading(false);
    })
    .catch(error => {
      console.error("Error fetching similar series:", error);
      setIsMoviesDataLoading(false);
    });
  }, [currentPage, seriesID, BASE]);

  // FETCH SERIES DATA FOR TITLE
  useEffect(() => {
    axios.get(`${BASE}/api/id/${seriesID}`)
    .then(response => {
      setName(response.data.title);
    })
    .catch(error => {
      console.error("Error fetching series title:", error);
    });
  }, [seriesID, BASE]);

  return (
    <div>
      {/* SEO SECTION */}
      <SEO
        title={SITENAME}
        description={`Discover a world of entertainment where every show, movie, and exclusive content takes you on a journey beyond the screen. ${SITENAME} offers endless options for every mood, helping you relax, escape, and imagine more. Stream your favorites, dream big, and repeat the experience, only with ${SITENAME}.`}
        name={SITENAME}
        type="text/html"
        keywords="watch movies online, watch hd movies, watch full movies, streaming movies online, free streaming movie, watch movies free, watch hd movies online, watch series online, watch hd series free, free tv series, free movies online, tv online, tv links, tv links movies, free tv shows, watch tv shows online, watch tv shows online free, free hd movies, New Movie Releases, Top Movies of the Year, Watch Movies Online, Streaming Services, Movie Reviews, Upcoming Films, Best Movie Scenes, Classic Movies, HD Movie Streaming, Film Trailers, Action Movies, Drama Films, Comedy Movies, Sci-Fi Films, Horror Movie Picks, Family-Friendly Movies, Award-Winning Films, Movie Recommendations, Cinematic Experiences, Behind-the-Scenes, Director Spotlights, Actor Interviews, Film Festivals, Cult Classics, Top Box Office Hits, Celebrity News, Movie Soundtracks, Oscar-Winning Movies, Movie Trivia, Exclusive Film Content, Best Cinematography, Must-Watch Movies, Film Industry News, Filmmaking Tips, Top Movie Blogs, Latest Movie Gossip, Interactive Movie Quizzes, Red Carpet Moments, IMDb Ratings, Movie Fan Communities, fmovies, fmovies.to, fmovies to, fmovies is, fmovie, free movies, online movie, movie online, free movies online, watch movies online free, free hd movies, watch movies online"
        link={`https://${SITENAME}.com`}
      />
      {/* Movies component */}
      <MoviesAndSeriesSections
        movieData={movies}
        isMovieDataLoading={isMoviesDataLoading}
        dataType="similarSeries"
        sectionTitle={`Similar with: ${name}`}
      />
      {/* Call Pagination Component */}
      <Pagination
        currentPage={currentPage}
        total={moviesDataForPageCount} 
        pagesNum={Math.ceil(moviesDataForPageCount / 20)} 
        onPageChange={(p) => {
          setCurrentPage(p); 
        }}
        limit={20}
      />
    </div>
  );
}
