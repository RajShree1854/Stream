import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase";
import { toast } from "react-toastify";
import { setDoc, doc } from "firebase/firestore";
import googleImage from "../assets/images/google.png"; // Import the image
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth
import { Divider } from "@nextui-org/divider";

function SignInwithGoogle() {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth(); // Get setIsAuthenticated from context

  async function googleLogin() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: user.displayName,
          lastName: "",
        });

        toast.success("User logged in successfully");

        setIsAuthenticated(true); // Update authentication state
        navigate("/"); // Redirect to profile page
      }
    } catch (error) {
      console.error("Login Error: ", error.message);
      toast.error("Failed to log in. Please try again.", {
        position: "top-center",
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center justify-center my-4">
        <Divider className="flex-grow" />
        <p className="mx-4 text-center whitespace-nowrap">Or continue with</p>
        <Divider className="flex-grow" />
      </div>

      <div
        style={{ display: "flex", justifyContent: "center", cursor: "pointer" }}
        onClick={googleLogin}
      >
        <img src={googleImage} width={"60%"} alt="Google" />{" "}
        {/* Use imported image */}
      </div>
    </div>
  );
}

export default SignInwithGoogle;
