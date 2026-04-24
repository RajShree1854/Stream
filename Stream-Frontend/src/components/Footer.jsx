import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Footer() {
  const TG_URL = import.meta.env.VITE_TG_URL;
  const SITENAME = import.meta.env.VITE_SITENAME;


  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      {!isLoginPage && (
        <section className="relative pt-10 border-t-2 border-btnColor xxl:container m-auto">
          {/* TOP OF FOOTER */}
          <div className="flex flex-col items-start justify-between w-11/12 gap-6 m-auto md:flex-row ">
            {/* LEFT */}
            <div className="p-0 w-full md:w-1/3 lg:p-6">
              <div className="flex items-center text-secondaryTextColor uppercase gap-4 mb-4 font-bold text-2xl">
                <a href="/" className="-space-y-1">
                  <p className="text-2xl text-otherColor">{SITENAME}</p>
                </a>
              </div>
              <p className="text-sm text-secondaryTextColor lg:text-md">
                This site does not store any file on the server, it only links
                to media files which are hosted on Telegram.
              </p>
              <div className="flex items-center gap-3 mt-6 ">
                <a
                  href={TG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    width="100"
                    height="100"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="cursor-pointer w-8"
                  >
                    <path
                      d="M12,24c6.629,0 12,-5.371 12,-12c0,-6.629 -5.371,-12 -12,-12c-6.629,0 -12,5.371 -12,12c0,6.629 5.371,12 12,12zM5.491,11.74l11.57,-4.461c0.537,-0.194 1.006,0.131 0.832,0.943l0.001,-0.001l-1.97,9.281c-0.146,0.658 -0.537,0.818 -1.084,0.508l-3,-2.211l-1.447,1.394c-0.16,0.16 -0.295,0.295 -0.605,0.295l0.213,-3.053l5.56,-5.023c0.242,-0.213 -0.054,-0.333 -0.373,-0.121l-6.871,4.326l-2.962,-0.924c-0.643,-0.204 -0.657,-0.643 0.136,-0.953z"
                      fill="#50B498"
                    />
                  </svg>

                
                </a>
                
              </div>
            </div>
            {/* MIDDLE */}
            <div className="p-0 w-full text-primaryTextColor md:w-1/3 lg:p-6 ">
              <button className="border-b-2 border-otherColor text-xl cursor-default mb-5 md:text-2xl">
                What we have
              </button>
              <div className="flex gap-2 flex-wrap">
                <div className="text-sm px-6 py-1 rounded-full bg-otherColor text-bgColor lg:text-md">
                  <h1 className="">Movies</h1>
                </div>
                <div className="text-sm px-6 py-1 rounded-full bg-otherColor text-bgColor lg:text-md">
                  <h1 className="">TV shows</h1>
                </div>
                <div className="text-sm px-6 py-1 rounded-full bg-otherColor text-bgColor lg:text-md">
                  <h1 className="">Anime</h1>
                </div>
                <div className="text-sm px-6 py-1 rounded-full bg-otherColor text-bgColor lg:text-md">
                  <h1 className="">K-Drama</h1>
                </div>
              </div>
            </div>
            {/* RIGHT */}
            <div className="p-0 w-full text-primaryTextColor md:w-1/3 lg:p-6">
              <button className="border-b-2 border-otherColor text-xl cursor-default mb-5 md:text-2xl">
                Quick Menu
              </button>
              <ul className="capitalize text-secondaryTextColor flex flex-col space-y-4 text-sm lg:text-md">
                <Link
                  to="/"
                  className="transition-all duration-300 ease-in-out hover:text-primaryTextColor"
                >
                  <li>home</li>
                </Link>
                <Link
                  to="/movies"
                  className="transition-all duration-300 ease-in-out hover:text-primaryTextColor"
                >
                  <li>movies</li>
                </Link>
                <Link
                  to="/series"
                  className="ftransition-all duration-300 ease-in-out hover:text-primaryTextColor"
                >
                  <li>series</li>
                </Link>
              </ul>
            </div>
          </div>
          <div className="border-t-2 border-btnColor  py-6  mt-5 ">
            <div className="flex flex-col gap-5 items-center  justify-center md:items-center w-11/12 m-auto sm:text-center  sm:flex-row sm:items-start">
              {/* BOTTOM FOOTER LEFT */}
              <div className="flex items-center gap-1 text-sm text-secondaryTextColor md:text-md">
                <button className="relative text-sm w-4 h-4 rounded-full border-2 border-secondaryTextColor p-2">
                  <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    C
                  </p>
                </button>
                <p className="uppercase">{SITENAME}. All Rights Reserved</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
