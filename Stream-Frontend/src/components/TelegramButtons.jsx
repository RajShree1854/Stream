import React, { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { PiTelegramLogo } from "react-icons/pi";
import { FaUserPlus } from "react-icons/fa";
import axios from "axios";
import { getEncryptedUrl } from "../utils/urlEncryption";
import { Button } from "@nextui-org/button";
import Spinner from "./svg/Spinner";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { getAuth } from "firebase/auth";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { isPremiumGmail } from '../firebase';

const TelegramButton = ({ movieData }) => {
  const USERNAME = import.meta.env.VITE_TG_USERNAME;
  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;
  const TOKEN_SYSTEM = import.meta.env.VITE_TOKEN_SYSTEM;
  const TG_URL = import.meta.env.VITE_TG_URL;
  const ENCRYPT_URL = import.meta.env.VITE_ENCRYPT_URL === "true";

  const [shortenedUrls, setShortenedUrls] = useState({});
  const [loading, setLoading] = useState({});
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const location = useLocation();
  const fullUrl = window.location.href;
  const url = new URL(fullUrl);
  const domain = url.origin;

  const generateToken = () => uuidv4();

  const verifyTokenTimeStamp = async (userId) => {
    try {
      const docSnap = await getDoc(doc(db, "tokens", userId));

      if (docSnap.exists()) {
        const now = new Date();
        const { expiresAt } = docSnap.data();

        if (expiresAt) {
          if (new Date(expiresAt) > now) return true;
          toast.warning("Token expired, generating a new one...");
          // console.log("Token is invalid or expired.");
        } else {
          toast.info("Token expired, generating a new one...");
          // console.log("Token has no expiration date.");
        }
      } else {
        toast.info("No token found, generating a new one...");
        // console.log("No token found for user.");
      }
    } catch (error) {
      console.error("Error verifying token:", error);
    }
    return false;
  };

  const shortenUrl = async (url) => {
    try {
      const { data } = await axios.get(API_URL, {
        params: { api: API_KEY, url, format: "json" },
      });
      return data.shortenedUrl || url;
    } catch (error) {
      console.error("Error shortening URL:", error);
      return url;
    }
  };

  const handleButtonClick = async (originalUrl, quality) => {
    setLoading((prev) => ({ ...prev, [quality]: true }));
    let shortUrl = originalUrl;

    try {
      const user = auth.currentUser;
      if (user && await isPremiumGmail(user.email)) {
        shortUrl = originalUrl;
      } else if (TOKEN_SYSTEM === "true") {
        if (!(await verifyTokenTimeStamp(userId))) {
          const token = generateToken();
          await setDoc(doc(db, "tokens", userId), { token });
          const tokenUrl = `${domain}/token/${token}`;
          
          const shortenedUrl = await shortenUrl(tokenUrl);
          
          if (ENCRYPT_URL) {
            const encryptedUrl = await getEncryptedUrl(shortenedUrl);
            if (encryptedUrl !== shortenedUrl) {
              shortUrl = encryptedUrl;
            } else {
              shortUrl = shortenedUrl;
            }
          } else {
            shortUrl = shortenedUrl;
          }
        }
      }

      setShortenedUrls((prev) => ({ ...prev, [originalUrl]: shortUrl }));
    } catch (error) {
      console.error("Error processing URL:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [quality]: false }));
      window.open(shortUrl, "_blank", "noopener noreferrer");
    }
  };

  const renderQualityButtons = (qualityDetails) =>
    qualityDetails.map(({ quality }, index) => (
      <Button
        key={index}
        onClick={() =>
          handleButtonClick(
            `https://t.me/${USERNAME}?start=file_${movieData.tmdb_id}_${quality}`,
            quality
          )
        }
        size="sm"
        className="bg-primaryBtn rounded-full"
        isLoading={loading[quality]}
        spinner={<Spinner />}
      >
        {quality}
      </Button>
    ));

  const renderSeasonButtons = () =>
    movieData.seasons.map((season, seasonIndex) => {
      const availableQualities = new Set();
      season.episodes.forEach((episode) => {
        episode.telegram?.forEach(({ quality }) =>
          availableQualities.add(quality)
        );
      });

      return (
        <Popover
          key={seasonIndex}
          placement="left"
          showArrow={true}
          offset={20}
        >
          <PopoverTrigger>
            <button className="text-left bg-otherColor text-bgColor py-1 px-3 rounded-full border-2 border-otherColor">
              Season {season.season_number}
            </button>
          </PopoverTrigger>
          <PopoverContent className="bg-btnColor">
            <div className="px-1 py-2 flex gap-1 flex-wrap">
              {Array.from(availableQualities).map((quality, qualityIndex) => (
                <Button
                  key={qualityIndex}
                  onClick={() =>
                    handleButtonClick(
                      `https://t.me/${USERNAME}?start=file_${movieData.tmdb_id}_${season.season_number}_${quality}`,
                      quality
                    )
                  }
                  size="sm"
                  className="bg-primaryBtn rounded-full"
                  isLoading={loading[quality]}
                  spinner={<Spinner />}
                >
                  {quality}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      );
    });

  const handleJoinUsClick = () => {
    window.open(TG_URL, "_blank", "noopener noreferrer");
  };

  return (
    <>
      <Popover placement="bottom" showArrow={true}>
        <PopoverTrigger>
          <button className="uppercase flex items-center justify-center gap-2 bg-otherColor max-w-full grow text-bgColor text-xs rounded-full border-2 border-otherColor py-1 px-3 lg:text-sm sm:px-5 sm:max-w-[15rem] sm:py-2">
            <PiTelegramLogo className="text-lg" /> Telegram
          </button>
        </PopoverTrigger>
        <PopoverContent className="bg-btnColor">
          <div className="px-1 py-2 flex gap-1 flex-wrap flex-col">
            {movieData.media_type === "movie"
              ? renderQualityButtons(movieData.telegram || [])
              : renderSeasonButtons()}
          </div>
        </PopoverContent>
      </Popover>
      <button
        onClick={handleJoinUsClick}
        className="uppercase flex items-center justify-center gap-2 bg-otherColor max-w-full grow text-bgColor text-xs rounded-full border-2 border-otherColor py-1 px-3 lg:text-sm sm:px-5 sm:max-w-[15rem] sm:py-2"
      >
        <FaUserPlus className="text-lg" /> Join Us
      </button>
    </>
  );
};

export default TelegramButton;
