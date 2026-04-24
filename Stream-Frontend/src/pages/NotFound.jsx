// NotFoundPage.js
import React from 'react';
import Lottie from "lottie-react";
import error from "../assets/lotte/404.json";
const NotFoundPage = () => {
  return (
    <div className='flex flex-col w-full h-4/5 max-md:mt-36 text-white items-center justify-center'>
        <Lottie
            animationData={error}
            className="size-4/5 "
            loop={true}
            autoplay={true}
          />
    </div>
  );
};

export default NotFoundPage;
