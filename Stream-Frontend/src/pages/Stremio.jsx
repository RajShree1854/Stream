import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import { getAuth } from "firebase/auth";
import { isPremiumGmail } from "../firebase";
import axios from "axios";

export default function Stremio() {
  const SITENAME = import.meta.env.VITE_SITENAME;
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const BASE_STREMIO_URL = import.meta.env.VITE_STREMIO_URL;
  
  const [copied, setCopied] = useState(false);
  const [stremioUrl, setStremioUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const generateUserSpecificUrl = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const isPremium = await isPremiumGmail(user.email);
          if (isPremium) {
            const response = await axios.post(`${BASE_URL}/api/generate-stremio-token`, {
              email: user.email
            });
            const token = response.data.token;
            const userSpecificUrl = `${BASE_STREMIO_URL}/stremio/manifest.json?token=${token}`;
            setStremioUrl(userSpecificUrl);
          } else {
            setStremioUrl("");
          }
        } else {
          setStremioUrl("");
        }
      } catch (error) {
        console.error('Error generating Stremio URL:', error);
        setStremioUrl(`${BASE_STREMIO_URL}/stremio/manifest.json`);
      } finally {
        setLoading(false);
      }
    };

    generateUserSpecificUrl();
  }, [auth.currentUser, BASE_URL, BASE_STREMIO_URL]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(stremioUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-bgColor pt-20">
      <SEO
        title={`Stremio Addon - ${SITENAME}`}
        description="Install the Stremio addon to access media content through Stremio"
        name={SITENAME}
        type="text/html"
        keywords="stremio addon, streaming, media server, telegram stremio"
        link={`https://${SITENAME}.com/stremio`}
      />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-btnColor/80 backdrop-blur-md rounded-2xl border border-bgColorSecondary overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-otherColor rounded-full mb-8 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-primaryTextColor mb-4">
                  Stremio Addon
                </h1>
                <p className="text-lg text-secondaryTextColor max-w-2xl mx-auto">
                  Install the addon to access media content through Stremio
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-primaryTextColor mb-8 text-center">Installation Instructions</h2>
                
                <div className="space-y-8">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6 bg-bgColor/50 rounded-xl p-6 border border-bgColorSecondary"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-otherColor rounded-full flex items-center justify-center mx-auto md:mx-0">
                      <span className="text-white font-bold text-lg">1</span>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-bold text-primaryTextColor mb-4">Copy the manifest URL below</h3>
                      <div className="bg-bgColorSecondary/50 p-6 rounded-lg border border-bgColorSecondary">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {loading ? (
                            <div className="flex items-center justify-center flex-1 py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-otherColor"></div>
                              <span className="ml-2 text-secondaryTextColor">Generating URL...</span>
                            </div>
                          ) : stremioUrl ? (
                            <span className="font-mono text-sm text-primaryTextColor break-all flex-1">
                              {stremioUrl}
                            </span>
                          ) : (
                            <div className="flex items-center justify-center flex-1 py-4">
                              <span className="text-red-400">Premium subscription required</span>
                            </div>
                          )}
                          <button
                            onClick={copyToClipboard}
                            disabled={!stremioUrl || loading}
                            className={`px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                              copied 
                                ? 'bg-green-600 text-white shadow-lg' 
                                : 'bg-otherColor text-white hover:bg-primaryBtnHower shadow-lg hover:shadow-xl'
                            }`}
                          >
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6 bg-bgColor/50 rounded-xl p-6 border border-bgColorSecondary"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-otherColor rounded-full flex items-center justify-center mx-auto md:mx-0">
                      <span className="text-white font-bold text-lg">2</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-primaryTextColor mb-3">Open Stremio and go to Addons section</h3>
                      <p className="text-secondaryTextColor text-lg">Launch the Stremio application and navigate to the Addons section</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6 bg-bgColor/50 rounded-xl p-6 border border-bgColorSecondary"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-otherColor rounded-full flex items-center justify-center mx-auto md:mx-0">
                      <span className="text-white font-bold text-lg">3</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-primaryTextColor mb-3">Paste the URL in "Add Addon" field and install</h3>
                      <p className="text-secondaryTextColor text-lg">Paste the copied URL in the Add Addon field and click install to complete the setup</p>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-12 text-center"
                >
                  <div className="bg-otherColor/10 border border-otherColor/30 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-primaryTextColor mb-2">🚀 Ready to Stream!</h4>
                    <p className="text-secondaryTextColor">
                      Once installed, you'll have access to all your Telegram media through Stremio's beautiful interface
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
