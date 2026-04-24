import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { Tabs, Tab } from "@nextui-org/tabs";
import { Input } from "@nextui-org/input";
import { Link } from "@nextui-org/link";
import { Button } from "@nextui-org/button";
import { Card, CardBody } from "@nextui-org/card";
import { Spinner } from "@nextui-org/spinner";

import SignInwithGoogle from "../components/signInWIthGoogle";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { IoEye, IoEyeOff } from "react-icons/io5";
import logo from "../assets/images/logo.png";

export default function Login() {
  const SITEKEY = import.meta.env.VITE_SITEKEY;
  const WORKERURL = import.meta.env.VITE_WORKERURL;

  const [selected, setSelected] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const navigate = useNavigate();
  const { setIsAuthenticated, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const toggleVisibility = () => setIsVisible(!isVisible);

  useEffect(() => {
    const initTurnstile = () => {
      if (window.turnstile) {
        window.turnstile.render(document.getElementById("turnstile"), {
          sitekey: SITEKEY,
          callback: (token) => setCaptchaToken(token),
        });
      }
    };

    setTimeout(initTurnstile, 1000);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); // Set loading to true when login starts

    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA.");
      setIsLoading(false); // Stop loading if there's an error
      return;
    }

    try {
      const response = await axios.post(
        WORKERURL,
        {
          email,
          password,
          captchaToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data.message.includes("successful")) {
        toast.error(response.data.message);
        setIsLoading(false); // Stop loading if there's an error
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true);
      navigate("/", { replace: true });
      toast.success("User logged in successfully");
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false); // Stop loading after login attempt completes
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); // Set loading to true when signup starts

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;

      await setDoc(doc(db, "Users", user.uid), {
        email: user.email,
        firstName: fname,
        lastName: lname,
      });

      toast.success("Account created successfully! Please sign in now.");
      setSelected("login");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false); // Stop loading after signup attempt completes
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner
          size="lg"
          label="Loading..."
          labelColor="warning"
          color="warning"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen items-center ">
      <ToastContainer style={{ fontSize: "0.8rem" }} />
      <img src={logo} alt="Logo" className="w-52" />
      <Card className="max-w-full w-[340px]">
        <CardBody className="overflow-hidden">
          <Tabs
            fullWidth
            size="md"
            aria-label="Tabs form"
            selectedKey={selected}
            onSelectionChange={setSelected}
          >
            <Tab key="login" title="Login">
              <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                <Input
                  isRequired
                  label="Email"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  isRequired
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                      aria-label="toggle password visibility"
                    >
                      {isVisible ? (
                        <IoEye className="text-2xl text-default-400 pointer-events-none" />
                      ) : (
                        <IoEyeOff className="text-2xl text-default-400 pointer-events-none" />
                      )}
                    </button>
                  }
                  type={isVisible ? "text" : "password"}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-center text-small">
                  Need to create an account?{" "}
                  <Link size="sm" onPress={() => setSelected("sign-up")}>
                    Sign up
                  </Link>
                </p>
                <div className="flex gap-2 flex-col justify-end">
                  <div id="turnstile" className="my-4"></div>

                  <Button
                    fullWidth
                    color="primary"
                    type="submit"
                    isLoading={isLoading} // Show loading spinner when isLoading is true
                    spinner={
                      <svg
                        className="animate-spin h-5 w-5 text-current"
                        fill="none"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          fill="currentColor"
                        />
                      </svg>
                    }
                  >
                    Login
                  </Button>
                </div>
              </form>
              <SignInwithGoogle />
            </Tab>
            <Tab key="sign-up" title="Sign up">
              <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                <Input
                  isRequired
                  label="First Name"
                  placeholder="Enter your First Name"
                  type="text"
                  value={fname}
                  onChange={(e) => setFname(e.target.value)}
                />
                <Input
                  isRequired
                  label="Last Name"
                  placeholder="Enter your Last Name"
                  type="text"
                  value={lname}
                  onChange={(e) => setLname(e.target.value)}
                />
                <Input
                  isRequired
                  label="Email"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  isRequired
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                      aria-label="toggle password visibility"
                    >
                      {isVisible ? (
                        <IoEye className="text-2xl text-default-400 pointer-events-none" />
                      ) : (
                        <IoEyeOff className="text-2xl text-default-400 pointer-events-none" />
                      )}
                    </button>
                  }
                  type={isVisible ? "text" : "password"}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex gap-2 flex-col justify-end">
                  <Button
                    fullWidth
                    color="primary"
                    type="submit"
                    isLoading={isLoading} // Show loading spinner when isLoading is true
                    spinner={
                      <svg
                        className="animate-spin h-5 w-5 text-current"
                        fill="none"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          fill="currentColor"
                        />
                      </svg>
                    }
                  >
                    Sign Up
                  </Button>
                </div>
              </form>
              <SignInwithGoogle />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
