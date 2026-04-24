// src/pages/Movies.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import MoviesAndSeriesSections from "../components/MoviesAndSeriesSections";
import Pagination from "../components/Pagination";
import SEO from "../components/SEO"; // import SEO

export default function Movies() {
  const BASE = import.meta.env.VITE_BASE_URL; // Base Url for backend
  const SITENAME = import.meta.env.VITE_SITENAME;

  // States
  const [movies, setMovies] = useState([]);
  const [isMoviesDataLoading, setIsMoviesDataLoading] = useState(true);
  const [moviesDataForPageCount, setMoviesDataForPageCount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [movieFilter, setMovieFilter] = useState("updated_on");
  const [movieFilterVal, setMovieFilterVal] = useState("updated_on");

  // FETCH MOVIE DATA SECTION
  useEffect(() => {
    setIsMoviesDataLoading(true);
    window.scrollTo(0, 0);

    axios
      .get(`${BASE}/api/movies`, {
        params: {
          sort_by: `${movieFilter}:desc`,
          page: currentPage,
          page_size: 20,
        },
      })
      .then((response) => {
        setMovies(response.data.movies);
        setMoviesDataForPageCount(response.data.total_count);
        setIsMoviesDataLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching movies:", error);
        setIsMoviesDataLoading(false);
      });
  }, [movieFilter, currentPage, BASE]);

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
        dataType="movies"
        sectionTitle="Browse Movies"
        setMovieFilter={setMovieFilter}
        movieFilterVal={movieFilterVal}
        setMovieFilterVal={setMovieFilterVal}
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
