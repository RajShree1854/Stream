import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Autoplay, Navigation, A11y } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-creative";
import "react-lazy-load-image-component/src/effects/black-and-white.css";
import { BsArrowLeftCircle, BsArrowRightCircle } from "react-icons/bs";
import { FaPlay } from "react-icons/fa";
import { PiStarFill } from "react-icons/pi";

export default function HeroSlider({ movieData, isMovieDataLoading }) {
  return (
    <div className="pt-20">
      {!isMovieDataLoading ? (
        <>
          <Swiper
            modules={[Autoplay, Navigation, A11y]}
            grabCursor={true}
            lazy="true"
            loop={true}
            navigation={{
              prevEl: ".heroSlidePrev",
              nextEl: ".heroSlideNext",
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            spaceBetween={30}
            keyboard={{
              enabled: true,
            }}
          >
            {movieData.map((movie, index) => (
              <SwiperSlide key={index}>
                <div className="relative">
                  <div className="rounded-t-2xl aspect-video md:h-96 mask md:aspect-auto">
                    <LazyLoadImage
                      src={movie.backdrop}
                      className="rounded-t-2xl"
                      effect="black-and-white"
                      alt={movie.title}
                    />
                  </div>
                  <div className="absolute bottom-4 left-4 right-0 flex flex-col gap-1 xs:gap-2  sm:left-8 text-secondaryTextColor">
                    {movie.title && (
                      <h1 className="line-clamp-1 w-[90%] text-xl sm:text-3xl md:text-4xl font-extrabold text-primaryTextColor">
                        {movie.title}
                      </h1>
                    )}
                    <div className="hidden items-center gap-2 -mt-2  sm:flex">
                      {movie.release_year && (
                        <p className="text-[0.6rem] lg:text-[0.7rem] xl:text-[0.9rem] ">
                          {movie.release_year}
                        </p>
                      )}
                      <span>•</span>
                      <p className="text-[0.6rem] lg:text-[0.7rem] xl:text-[0.9rem]">
                        {movie.languages
                          .map(
                            (lang) =>
                              lang.charAt(0).toUpperCase() + lang.slice(1)
                          ) // Capitalize each language code
                          .join("-")}{" "}
                      </p>
                      <span>|</span>
                      <p className="text-[0.6rem] lg:text-[0.7rem] xl:text-[0.9rem]">
                      {movie.rip}
                      </p>
                    </div>
                    <div className="flex-col gap-3 text-sm  text-bgColor hidden md:flex">
                      <div className="flex items-center gap-1 capitalize flex-wrap">
                        {movie.genres.map((genreId, index) => (
                          <div
                            className=" text-[0.6rem] py-0.5 px-2.5 bg-primaryBtn rounded-full sm:text-sm"
                            key={index}
                          >
                            {[genreId] || ""}
                          </div>
                        ))}
                      </div>
                    </div>

                    {movie.description && (
                      <p className="font-extralight line-clamp-1 w-[80%] text-xs sm:line-clamp-2 sm:text-sm md:text-md">
                        {movie.description}
                      </p>
                    )}
                    <div className=" flex items-center gap-2 mt-2 ">
                      <div className="flex items-center gap-3 flex-wrap ">
                        <Link
                          className="flex items-center gap-2 bg-primaryBtn text-bgColor text-sm py-1 px-5 rounded-full sm:text-base transition-all duration-300 ease-in-out hover:bg-primaryBtnHower hover:text-primaryTextColor"
                          to={`/mov/${movie.tmdb_id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <FaPlay />
                          Watch
                        </Link>
                      </div>

                      {/* Mobile rating */}
                      <div className="flex gap-1 w-fit items-center bg-bgColorSecondary text-yellow-300  text-sm py-0.5 px-5 rounded-full sm:text-base">
                        <PiStarFill />
                        <p className="text-xs sm:text-lg">
                          {movie.rating.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="flex items-center gap-3 mt-5 pl-4 sm:pl-8">
            <BsArrowLeftCircle className="heroSlidePrev text-[2.4rem] text-secondaryTextColor p-2 cursor-pointer rounded-full transition-all duration-300 ease-in-out hover:bg-bgColorSecondary hover:text-primaryTextColor " />
            <BsArrowRightCircle className="heroSlideNext text-[2.4rem] text-secondaryTextColor p-2 cursor-pointer rounded-full transition-all duration-300 ease-in-out hover:bg-bgColorSecondary hover:text-primaryTextColor" />
          </div>
        </>
      ) : (
        <>
          <div className="relative">
            <div className=" bg-bgColorSecondary rounded-t-2xl aspect-video rounded-2xl md:h-96 md:aspect-auto">
              <LazyLoadImage className="rounded-2xl" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}