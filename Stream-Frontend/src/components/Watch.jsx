import { AiOutlineClose } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import Plyr from "plyr-react";
import "plyr-react/plyr.css";
import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { getAuth } from "firebase/auth";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify"; 
import { isPremiumGmail } from '../firebase';
import { getEncryptedUrl } from "../utils/urlEncryption";

export default function WatchTrailer(props) {
  const [sources, setSources] = useState([]);
  const [poster, setPoster] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const BASE = import.meta.env.VITE_BASE_URL;
  const playerRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;
  const TOKEN_SYSTEM = import.meta.env.VITE_TOKEN_SYSTEM;
  const ENCRYPT_URL = import.meta.env.VITE_ENCRYPT_URL === "true";

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

  useEffect(() => {
    const fetchData = async () => {
      // Only fetch data if the popup is open
      if (props.isWatchMoviePopupOpen || props.isWatchEpisodePopupOpen) {
        try {
          let shortUrl = null;
          let videoSources = [];
          let selectedPoster = "";

          // Premium Gmail bypass
          const user = auth.currentUser;
          if (user && await isPremiumGmail(user.email)) {
            // Bypass shortener/token logic
            if (props.popUpType === "movie") {
              videoSources = props.id.telegram.map((q) => ({
                src: `${BASE}/dl/${q.id}/${q.name}`,
                type: "video/mp4",
                size: parseInt(q.quality.replace("p", ""), 10),
              }));
              selectedPoster = props.id.backdrop;
            } else if (props.popUpType === "episode") {
              const season = props.id.seasons.find(
                (season) => season.season_number === props.seasonNumber
              );
              if (season) {
                const episode = season.episodes.find(
                  (ep) => ep.episode_number === props.episodeNumber
                );
                if (episode) {
                  videoSources = episode.telegram.map((q) => ({
                    src: `${BASE}/dl/${q.id}/${q.name}`,
                    type: "video/mp4",
                    size: parseInt(q.quality.replace("p", ""), 10),
                  }));
                  selectedPoster = episode.episode_backdrop;
                }
              }
            }
            setSources(videoSources);
            setPoster(selectedPoster);
            setIsModalOpen(true);
            return;
          }

          if (TOKEN_SYSTEM === "true") {
            const isTokenValid = await verifyTokenTimeStamp(userId);

            if (!isTokenValid) {
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
                window.open(shortUrl, "_blank", "noopener noreferrer");
              closeModal(); // Close the modal if the token is invalid
              return; // Stop further execution if the token is invalid
            }
          }

          if (props.popUpType === "movie") {
            videoSources = props.id.telegram.map((q) => ({
              src: `${BASE}/dl/${q.id}/${q.name}`,
              type: "video/mp4",
              size: parseInt(q.quality.replace("p", ""), 10),
            }));
            selectedPoster = props.id.backdrop;
          } else if (props.popUpType === "episode") {
            const season = props.id.seasons.find(
              (season) => season.season_number === props.seasonNumber
            );

            if (season) {
              const episode = season.episodes.find(
                (ep) => ep.episode_number === props.episodeNumber
              );

              if (episode) {
                videoSources = episode.telegram.map((q) => ({
                  src: `${BASE}/dl/${q.id}/${q.name}`,
                  type: "video/mp4",
                  size: parseInt(q.quality.replace("p", ""), 10),
                }));
                selectedPoster = episode.episode_backdrop;
              }
            }
          }

          setSources(videoSources);
          setPoster(selectedPoster);
          setIsModalOpen(true); // Open modal after data is set if token is valid
        } catch (error) {
          console.error("Error processing data:", error);
        }
      }
    };

    fetchData();
  }, [
    props.isWatchMoviePopupOpen,
    props.isWatchEpisodePopupOpen,
    props.popUpType,
    props.id,
    props.seasonNumber,
    props.episodeNumber,
  ]);

  const closeModal = () => {
    setIsModalOpen(false);
    if (props.popUpType === "trailer") {
      props.setIsTrailerPopupOpen(false);
    } else if (props.popUpType === "movie") {
      props.setIsWatchMoviePopupOpen(false);
    } else {
      props.setIsWatchEpisodePopupOpen(false);
    }
  };

  const plyrProps = {
    source: {
      type: "video",
      sources: sources,
    },
    options: {
      poster: poster,
      settings: ["captions", "quality", "speed"],
      controls: [
        "play-large",
        "play",
        "progress",
        "current-time",
        "mute",
        "volume",
        "captions",
        "settings",
        "fullscreen",
      ],
    },
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-30 w-full h-screen bg-black/90 backdrop-blur-md flex items-center justify-center"
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-5 right-5 text-white text-2xl z-50"
          >
            <AiOutlineClose />
          </button>

          {/* Plyr Player */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full max-w-4xl rounded-lg overflow-hidden shadow-lg relative"
          >
            <Plyr ref={playerRef} {...plyrProps} id="player" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
