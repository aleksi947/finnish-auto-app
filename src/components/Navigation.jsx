// src/components/Navigation.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { FinnishFlagLogo } from "./ui/FinnishFlagLogo";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import { auth } from "../firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import toast from "react-hot-toast";
import { SUBSCRIPTIONS_ENABLED } from "../config/features";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if on home page
  const isHomePage = location.pathname === "/";

  // watch auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("🚪 Signed out");
      setIsMenuOpen(false);
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Could not sign out");
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast.success("✅ Signed in successfully");
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        toast.success("🎉 Registration complete");
      }
      setIsLoginOpen(false);
      setEmail("");
      setPassword("");
      setIsMenuOpen(false);
      navigate("/profile");
    } catch (err) {
      console.error(err);
      
      let errorMessage = "Authentication error";
      const errorCode = err.code;

      if (errorCode === "auth/invalid-credential" || errorCode === "auth/user-not-found" || errorCode === "auth/wrong-password") {
        errorMessage = "Invalid email or password";
      } else if (errorCode === "auth/email-already-in-use") {
        errorMessage = "This email is already registered";
      } else if (errorCode === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Try again later";
      } else if (errorCode === "auth/weak-password") {
        errorMessage = "Password too weak (minimum 6 characters)";
      } else if (errorCode === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      }

      toast.error(errorMessage);
    }
  };

  return (
    <nav className={`absolute inset-x-0 top-0 z-50 transition-all duration-300 ${
      isHomePage 
        ? "bg-black/20 backdrop-blur-sm" 
        : "bg-gradient-to-r from-[#5B9BD5] to-[#4A90E2] shadow-lg shadow-blue-500/30"
    }`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo → home */}
        <Link to="/" className="flex items-center gap-2">
          <FinnishFlagLogo />
        </Link>

        {/* Desktop menu */}
        <div className="hidden items-center gap-8 md:flex">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-white/90 transition-colors hover:text-white">
              Home
            </Link>
            <Link to="/lessons" className="text-white/90 transition-colors hover:text-white">
              Lessons
            </Link>
            <Link to="/profile" className="text-white/90 transition-colors hover:text-white">
              Profile
            </Link>
            
            {SUBSCRIPTIONS_ENABLED && (
              <Link to="/subscription" className="text-white/90 transition-colors hover:text-white">
                Subscription
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button className="text-white transition-colors">RU</button>
              <span className="text-white/50">/</span>
              <button className="text-white/90 transition-colors hover:text-white">
                EN
              </button>
            </div>

            {!user ? (
              <Button
                variant="outline"
                className="border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={() => {
                  setAuthMode("login");
                  setIsLoginOpen(true);
                }}
              >
                Sign in
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={handleLogout}
              >
                Sign out
              </Button>
            )}
          </div>
        </div>

        {/* Mobile bar */}
        <div className="flex items-center gap-3 md:hidden">
          {!user ? (
            <Button
              variant="outline"
              size="sm"
              className="border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              onClick={() => {
                setAuthMode("login");
                setIsLoginOpen(true);
              }}
            >
              Sign in
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              onClick={handleLogout}
            >
              Sign out
            </Button>
          )}

          <button
            className="p-2 text-white"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className={`px-6 py-4 ${
          isHomePage 
            ? "bg-black/30 backdrop-blur-sm" 
            : "bg-gradient-to-r from-[#5B9BD5] to-[#4A90E2]"
        }`}>
          <div className="flex flex-col gap-4">
            <Link
              to="/"
              className="py-2 text-white/90 transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/lessons"
              className="py-2 text-white/90 transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Lessons
            </Link>
            <Link
              to="/profile"
              className="py-2 text-white/90 transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Profile
            </Link>
            {SUBSCRIPTIONS_ENABLED && (
              <Link
                to="/subscription"
                className="py-2 text-white/90 transition-colors hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Subscription
              </Link>
            )}
            <div className="mt-2 flex items-center gap-2 border-t border-white/20 pt-4">
              <button className="text-white transition-colors">RU</button>
              <span className="text-white/50">/</span>
              <button className="text-white/90 transition-colors hover:text-white">
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login/Register modal */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {authMode === "login" ? "Sign in" : "Register"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500">
              {authMode === "login"
                ? "Enter your email and password to sign in"
                : "Create an account with your email and password"}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleAuthSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.com"
                className="w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700">
              {authMode === "login" ? "Sign in" : "Register"}
            </Button>

            <div className="pt-2 text-center text-sm">
              {authMode === "login" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                    onClick={() => setAuthMode("register")}
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                    onClick={() => setAuthMode("login")}
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
