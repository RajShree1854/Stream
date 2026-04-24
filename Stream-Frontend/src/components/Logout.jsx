import React, { useState, useEffect } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/dropdown";
import { Avatar, AvatarIcon } from "@nextui-org/avatar";
import { signOut, onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import { setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_URL;

function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user is signed in.");
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative flex flex-col items-center">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>&times;</button>
        <h2 className="text-lg font-bold mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4 w-full">
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              placeholder="Current Password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="border rounded px-3 py-2 text-black w-full pr-10"
              required
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
              onClick={() => setShowCurrent((v) => !v)}
            >
              {showCurrent ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="border rounded px-3 py-2 text-black w-full pr-10"
              required
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
              onClick={() => setShowNew((v) => !v)}
            >
              {showNew ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="border rounded px-3 py-2 text-black w-full pr-10"
              required
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <button
            type="submit"
            className="bg-primaryBtn text-white rounded px-4 py-2 mt-2"
            disabled={loading}
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function UserInfoBtn() {
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [premiumInfo, setPremiumInfo] = useState({ premium: false, expires_at: null });
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserEmail(currentUser.email);
        setIsAuthenticated(true);
        setUser(currentUser);

        const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Fetch premium status from backend
        try {
          const res = await axios.post(`${BASE}/check-premium`, { gmail: currentUser.email });
          setPremiumInfo(res.data);
        } catch (e) {
          setPremiumInfo({ premium: false, expires_at: null });
        }
      } else {
        setUserEmail("Not signed in");
        setIsAuthenticated(false);
        setPremiumInfo({ premium: false, expires_at: null });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setIsAuthenticated]);

    // Show toast if premium is expiring within 5 days
  useEffect(() => {
    if (premiumInfo.expires_at) {
      const expiryDate = new Date(premiumInfo.expires_at);
      const today = new Date();
      expiryDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays <= 5) {
        toast.warn(`Your premium is expiring in ${diffDays} day${diffDays > 1 ? 's' : ''}!`, {
          toastId: "premium-expiry-warning"
        });
      }
    }
  }, [premiumInfo]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout Error: ", error.message);
    }
  };

  // Format premium expiry text
  let premiumText = "";
  if (premiumInfo.expires_at) {
    const date = new Date(premiumInfo.expires_at);
    const now = new Date();
    if (date > now) {
      const day = date.getDate().toString().padStart(2, "0");
      const month = date.toLocaleString("default", { month: "short" });
      premiumText = ` (Premium ${day}th ${month})`;
    }
  }

  return (
    <div className="flex items-center">
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar
            icon={<AvatarIcon />}
            classNames={{
              base: "bg-gradient-to-br from-[#FFB457] to-[#FF705B]",
              icon: "text-black/80",
            }}
          />
        </DropdownTrigger>
        <DropdownMenu aria-label="Profile Actions" variant="flat">
          <DropdownItem
            key="profile"
            className="h-14 gap-2"
            textValue="User profile information"
          >
            <p className="font-semibold">Signed in as</p>
            <p className="font-semibold">
              {loading ? "Loading..." : userEmail}
            </p>
            {premiumText && (
              <p className="font-semibold text-red-600">{premiumText}</p>
            )}
          </DropdownItem>
          <DropdownItem
            key="settings"
            onClick={() => setIsChangePasswordOpen(true)}
            textValue="My settings"
          >
            My Settings
          </DropdownItem>
          <DropdownItem
            isDisabled
            key="list"
            textValue="My list is currently unavailable"
          >
            My List
          </DropdownItem>
          <DropdownItem
            key="logout"
            color="danger"
            onClick={handleLogout}
            textValue="Log out of the account"
          >
            Log Out
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
    </div>
  );
}
