import { React, useState } from "react";
import { Link } from "react-router-dom";
import MovieCard from "./MovieCard";
import MovieCardSkeleton from "./MovieCardSkeleton";

import "react-lazy-load-image-component/src/effects/black-and-white.css";
import { BiArrowFromLeft } from "react-icons/bi";

export default function HomeSection(props) {
  // States
  const [showPlayBtn, setShowPlayBtn] = useState(false);
  const [openId, setOpenId] = useState();

  // PLAY Button Show/hide Function
  const showPlay = (i) => {
    setOpenId(i);
    setShowPlayBtn(true);
  };
  const hidePlay = (i) => {
    setOpenId(i);
    setShowPlayBtn(false);
  };

  return (
    <>
      {/* Title */}
      <div className="mt-[2.5rem] flex items-center flex-wrap gap-5 text-primaryTextColor pb-[1.5rem] md:mt-[5rem]">
        <div className="pl-[1rem]   border-l-2 border-otherColor ">
          <p className="text-[0.8rem] uppercase font-bold sm:text-[1rem]">
            {props.sectionTitle}
          </p>
        </div>
        {/* See All Button */}
        <Link
          to={props.seeMoreButtonLink}
          className="flex gap-3 items-center py-[0.5rem] px-[1rem] text-[0.7rem] rounded-sm transition-all duration-300 ease-in-out text-otherColor hover:bg-btnColor"
          style={{ textDecoration: "none" }}
        >
          <p>See more</p>
          <BiArrowFromLeft style={{ fontSize: "1rem" }} />
        </Link>
      </div>

      {/* Similar Movies Section */}
      <div className="">
        {!props.isMovieDataLoading ? (
          <div className="relative ">
            <div className="grid  gap-x-2 gap-y-6 grid-cols-2 md:grid-cols-3 bsmmd:grid-cols-4  lg:grid-cols-5 blgxl:grid-cols-6 xl:grid-cols-7">
              {props.movieData.map((movie, index) => {
                return (
                  <MovieCard key={index} movie={movie} />
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <MovieCardSkeleton />
          </>
        )}
      </div>
    </>
  );
}
