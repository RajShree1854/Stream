import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import MoviesAndSeriesDetailsSections from "../components/MoviesAndSeriesDetailsSections";
import Similars from "../components/Similars";
import SEO from "../components/SEO"; // import SEO
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
export default function MovieDetails() {
  const BASE = import.meta.env.VITE_BASE_URL; // Base URL for backend
  const SITENAME = import.meta.env.VITE_SITENAME;

  let { movieID } = useParams();

  // States
  const [movieDetail, setMovieDetail] = useState({});
  const [similarMovies, setSimilarMovies] = useState([]);
  const [isDetailsLoading, setDetailsIsLoading] = useState(true);
  const [isSimilarLoading, setIsSimilarLoading] = useState(true);

  // Fetch Movie Details Data
  useEffect(() => {
    setDetailsIsLoading(true);
    window.scrollTo(0, 0);

    axios
      .get(`${BASE}/api/id/${movieID}`)
      .then((response) => {
        setMovieDetail(response.data);
        setDetailsIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching movie details:", error);
        setDetailsIsLoading(false);
      });
  }, [movieID, BASE]);

  // Fetch Similar Movies
  useEffect(() => {
    setIsSimilarLoading(true);

    axios
      .get(`${BASE}/api/similar/`, {
        params: {
          tmdb_id: movieID,
          media_type: "movie",
          limit: 10,
        },
      })
      .then((response) => {
        setSimilarMovies(response.data.similar_media);
        setIsSimilarLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching similar movies:", error);
        setIsSimilarLoading(false);
      });
  }, [movieID, BASE]);

  return (
    <div>
      {/* SEO SECTION */}
      <ToastContainer style={{ fontSize: "0.8rem" }} />

      <SEO
        title={SITENAME}
        description={`Discover a world of entertainment where every show, movie, and exclusive content takes you on a journey beyond the screen. ${SITENAME} offers endless options for every mood, helping you relax, escape, and imagine more. Stream your favorites, dream big, and repeat the experience, only with ${SITENAME}.`}
        name={SITENAME}
        type="text/html"
        keywords="watch movies online, watch hd movies, watch full movies, streaming movies online, free streaming movie, watch movies free, watch hd movies online, watch series online, watch hd series free, free tv series, free movies online, tv online, tv links, tv links movies, free tv shows, watch tv shows online, watch tv shows online free, free hd movies, New Movie Releases, Top Movies of the Year, Watch Movies Online, Streaming Services, Movie Reviews, Upcoming Films, Best Movie Scenes, Classic Movies, HD Movie Streaming, Film Trailers, Action Movies, Drama Films, Comedy Movies, Sci-Fi Films, Horror Movie Picks, Family-Friendly Movies, Award-Winning Films, Movie Recommendations, Cinematic Experiences, Behind-the-Scenes, Director Spotlights, Actor Interviews, Film Festivals, Cult Classics, Top Box Office Hits, Celebrity News, Movie Soundtracks, Oscar-Winning Movies, Movie Trivia, Exclusive Film Content, Best Cinematography, Must-Watch Movies, Film Industry News, Filmmaking Tips, Top Movie Blogs, Latest Movie Gossip, Interactive Movie Quizzes, Red Carpet Moments, IMDb Ratings, Movie Fan Communities, fmovies, fmovies.to, fmovies to, fmovies is, fmovie, free movies, online movie, movie online, free movies online, watch movies online free, free hd movies, watch movies online"
        link={`https://${SITENAME}.com`}
      />
      {/* Call MoviesAndSeriesDetailsSections Component */}
      <MoviesAndSeriesDetailsSections
        movieData={movieDetail}
        isMovieDataLoading={isDetailsLoading}
        detailType="movie"
      />
      <Similars
        movieData={similarMovies}
        isMovieDataLoading={isSimilarLoading}
        sectionTitle="You may also like"
        detailType="similarMovies"
        seeMoreButtonLink={`/similarMov/${movieID}`}
      />
    </div>
  );
}
