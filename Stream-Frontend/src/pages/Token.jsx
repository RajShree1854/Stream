import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import SEO from "../components/SEO";

import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { Spinner } from "@nextui-org/spinner";
import { v4 as uuidv4 } from "uuid";
import Lottie from "lottie-react";

import happy from "../assets/lotte/happy.json";
import sad from "../assets/lotte/sad.json";

export default function Token() {
  const [loading, setLoading] = useState(true);
  const [tokenCreationStatus, setTokenCreationStatus] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const SHORTNER_TIME = import.meta.env.VITE_SHORTNER_TIME;
  const SITENAME = import.meta.env.VITE_SITENAME;


  const { tokenID } = useParams();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  // Fetch the user's token from Firestore
  const fetchUserToken = async (userId) => {
    try {
      const userTokenDoc = await getDoc(doc(db, "tokens", userId));
      if (userTokenDoc.exists()) {
        const { token } = userTokenDoc.data();
        return token || false;
      } else {
        console.log("No token found for user.");
        return false;
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      return false;
    }
  };

  // Create and store the token with an expiration timestamp
  const createAndStoreToken = async () => {
    const existingToken = await fetchUserToken(userId);
    if (existingToken === tokenID) {
      const expiresAt = Date.now() + SHORTNER_TIME * 60 * 60 * 1000; // 2 hour from now

      try {
        const generateToken = () => uuidv4();
        const newtoken = generateToken();
        await setDoc(doc(db, "tokens", userId), { token: newtoken, expiresAt });
        setTokenCreationStatus(true);
        console.log("Token successfully stored.");
      } catch (error) {
        console.error("Error storing token:", error);
        setTokenCreationStatus(false);
      }
    } else {
      setTokenCreationStatus(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId && tokenID) {
      createAndStoreToken();
    }
  }, [userId, tokenID]);

  useEffect(() => {
    // Countdown timer logic
    const countdownInterval = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(countdownInterval);
          window.close();
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  return (
    <div className="text-primaryTextColor flex items-center justify-center">
      <SEO
        title={SITENAME}
        description={`Discover a world of entertainment where every show, movie, and exclusive content takes you on a journey beyond the screen. ${SITENAME} offers endless options for every mood, helping you relax, escape, and imagine more. Stream your favorites, dream big, and repeat the experience, only with ${SITENAME}.`}
        name={SITENAME}
        type="text/html"
        keywords="watch movies online, watch hd movies, watch full movies, streaming movies online, free streaming movie, watch movies free, watch hd movies online, watch series online, watch hd series free, free tv series, free movies online, tv online, tv links, tv links movies, free tv shows, watch tv shows online, watch tv shows online free, free hd movies, New Movie Releases, Top Movies of the Year, Watch Movies Online, Streaming Services, Movie Reviews, Upcoming Films, Best Movie Scenes, Classic Movies, HD Movie Streaming, Film Trailers, Action Movies, Drama Films, Comedy Movies, Sci-Fi Films, Horror Movie Picks, Family-Friendly Movies, Award-Winning Films, Movie Recommendations, Cinematic Experiences, Behind-the-Scenes, Director Spotlights, Actor Interviews, Film Festivals, Cult Classics, Top Box Office Hits, Celebrity News, Movie Soundtracks, Oscar-Winning Movies, Movie Trivia, Exclusive Film Content, Best Cinematography, Must-Watch Movies, Film Industry News, Filmmaking Tips, Top Movie Blogs, Latest Movie Gossip, Interactive Movie Quizzes, Red Carpet Moments, IMDb Ratings, Movie Fan Communities, fmovies, fmovies.to, fmovies to, fmovies is, fmovie, free movies, online movie, movie online, free movies online, watch movies online free, free hd movies, watch movies online"
        link={`https://${SITENAME}.com`}
      />
      {loading && (
        <Spinner
          label="Verifying Token..."
          labelColor="warning"
          color="warning"
          className="h-screen"
        />
      )}

      {!loading && tokenCreationStatus === true && (
        <div className="flex flex-col justify-center gap-5 items-center mt-20">
          {/* Giphy embed for success */}
          <Lottie
            animationData={happy}
            className="size-6/12"
            loop={true}
            autoplay={true}
          />
          <div className="flex flex-col gap-1 items-center justify-center">
            <h1>
              Done! Now enjoy the echo without limit For {SHORTNER_TIME} hr.
            </h1>
            <h2>Closing in: {countdown} seconds</h2>
          </div>
          {/* Countdown timer display */}
        </div>
      )}
      {!loading && tokenCreationStatus === false && (
        <div className="flex flex-col justify-center gap-5 items-center mt-20">
          <Lottie
            animationData={sad}
            loop={true}
            autoplay={true}
            className="size-6/12"
          />
          <div className="flex flex-col gap-1 items-center justify-center">
            <h1>Sorry, there was an issue with the token creation.</h1>
            <h2>Closing in: {countdown} seconds</h2>{" "}
          </div>
        </div>
      )}
    </div>
  );
}
