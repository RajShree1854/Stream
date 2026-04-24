import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/black-and-white.css";
import { PiStarFill } from "react-icons/pi";

import { BsPlayFill } from "react-icons/bs";
import posterPlaceholder from "../assets/images/poster-placeholder.png";

const MovieCard = ({ movie }) => {
  const [showPlayBtn, setShowPlayBtn] = useState(false);
  const [openId, setOpenId] = useState();

  const showPlay = () => {
    setOpenId(movie.tmdb_id);
    setShowPlayBtn(true);
  };

  const hidePlay = () => {
    setOpenId(movie.tmdb_id);
    setShowPlayBtn(false);
  };

  return (
    <div className="relative">
      <Link
        to={
          movie.media_type === "movie"
            ? `/mov/${movie.tmdb_id}`
            : `/ser/${movie.tmdb_id}`
        }
        className="rounded-t-2xl"
      >
        <div className="flex items-center justify-center aspect-[9/13.5] w-full object-cover rounded-2xl ">
          <LazyLoadImage
            src={movie.poster ? movie.poster : posterPlaceholder}
            width="100%"
            effect="black-and-white"
            alt={movie.title}
            className="aspect-[9/13.5] w-full object-cover rounded-2xl "
            onMouseEnter={showPlay}
            onMouseLeave={hidePlay}
          />
        </div>
      </Link>

      <div className="text-primaryTextColor mt-2">
        <p className="line-clamp-1 text-md md:text-base ">{movie.title}</p>
        <div className="flex items-center justify-between text-secondaryTextColor mt-1 uppercase text-[0.6rem] sm:text-xs md:text-sm">
          {movie.release_year && <p>{movie.release_year}</p>}
          <div className="uppercase bg-bgColorSecondary text-primaryTextColor py-1 px-3 rounded-full text-[0.5rem] sm:text-[0.6rem]">
            <p>{movie.media_type}</p>
          </div>
        </div>
      </div>

      {movie.rating ? (
        <div className="flex items-center gap-1 absolute top-5 left-3 bg-bgColorSecondary text-yellow-300 py-1 px-3 rounded-full font-extrabold text-[0.6rem] sm:text-xs">
          <PiStarFill />
          <p>{movie.rating.toFixed(1)}</p>
        </div>
      ) : (
        <div className="flex items-center gap-1 absolute top-5 left-3 bg-primaryBtn text-bgColor py-1 px-3 rounded-full text-xs font-extrabold">
          <PiStarFill />
          <p>0.0</p>
        </div>
      )}

      {movie.languages ? (
        <div className="flex items-center gap-1 absolute bottom-16 right-3 bg-primaryBtn text-bgColor py-1 px-3 rounded-full font-extrabold text-[0.6rem] sm:text-xs">
          <p>
            {movie.languages
              .map((lang) => lang.charAt(0).toUpperCase() + lang.slice(1)) // Capitalize each language code
              .join("-")}{" "}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-1 absolute bottom-16 right-3 bg-primaryBtn text-bgColor py-1 px-3 rounded-full text-xs font-extrabold">
          <p>Hi</p>
        </div>
      )}

      {movie.rip ? (
        <div className="flex bg-bgColorSecondary rounded-full items-center gap-1 absolute bottom-16 left-3 text-primaryTextColor py-1 px-3 font-medium text-[0.6rem] sm:text-xs">
          <p>{movie.rip}</p>
        </div>
      ) : (
        <div className="flex bg-bgColorSecondary rounded-full items-center gap-1 absolute bottom-16 left-3 text-primaryTextColor py-1 px-3 font-medium text-[0.6rem] sm:text-xs">
          <p>Blu-Ray</p>
        </div>
      )}

      <AnimatePresence>
        {openId === movie.tmdb_id && showPlayBtn && (
          <Link
            to={
              movie.media_type === "movie"
                ? `/mov/${movie.tmdb_id}`
                : `/ser/${movie.tmdb_id}`
            }
            onMouseEnter={showPlay}
            onMouseLeave={hidePlay}
            className="hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primaryBtn sm:block"
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{
                type: "tween",
                duration: 0.3,
              }}
              className="text-3xl p-1 rounded-full border-4 border-primaryBtn"
            >
              <BsPlayFill />
            </motion.div>
          </Link>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MovieCard;
