import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const Signin = ({ classname }) => {
    const [authMode, setAuthMode] = useState("login");

    const handleSignup = async () => {
        const username = document.querySelector("#signup-username").value;
        const email = document.querySelector("#signup-email").value;
        const password = document.querySelector("#signup-password").value;
        const retypePassword = document.querySelector("#signup-retype").value;

        if (password !== retypePassword) {
            toast.error("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch("http://localhost:5001/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Signup successful! Please login.");
                setAuthMode("login");
            } else {
                toast.error("Signup failed: " + data.message);
            }
        } catch (err) {
            toast.error("Signup error: " + err.message);
            console.error(err);
        }
    };

    const handleSignin = async () => {
        const emailOrUsername = document.querySelector("#signin-email").value;
        const password = document.querySelector("#signin-password").value;

        try {
            const response = await fetch("http://localhost:5001/signin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: emailOrUsername,
                    password,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Signin successful! Redirecting...");
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 1000);
            } else {
                toast.error("Signin failed: " + data.message);
            }
        } catch (err) {
            toast.error("Signin network error: " + err.message);
            console.error(err);
        }
    };


    return (
        <div className="mx-auto flex h-screen max-w-lg flex-col md:max-w-none md:flex-row md:pr-10">
            <div className="max-w-[50rem] rounded-3xl bg-gradient-to-br from-blue-800 to-indigo-900 px-4 py-10 text-white sm:px-10 md:m-6 md:mr-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <p className="mb-20 font-bold tracking-wider">College Admin Panel</p>
                <p className="mb-4 text-3xl font-bold md:text-4xl md:leading-snug">
                    Welcome to <br />
                    <span className="text-yellow-300">RV Institute of Technology and Management</span>
                </p>
                <p className="mb-28 font-semibold leading-relaxed text-gray-200">
                    Admin Pannel
                </p>
                <div className="bg-blue-600/80 rounded-2xl px-6 py-8">
                </div>
            </div>
            <div className="w-full flex items-center justify-center">


                <div className="px-4 py-20 mt-0 ">
                    <h2 className="mb-2 text-3xl font-bold">{authMode === "login" ? "Admin Login" : "Admin Signup"}</h2>
                    <p className="mb-1 font-medium text-gray-500">Select Mode</p>

                    <div className="mb-6 flex flex-col gap-y-2 gap-x-4 lg:flex-row">
                        <div
                            onClick={() => setAuthMode("login")}
                            className={`relative flex w-56 items-center justify-center rounded-xl px-4 py-3 font-medium cursor-pointer ${authMode === "login" ? "bg-blue-200 text-blue-800" : "bg-gray-50 text-gray-700"
                                }`}
                        >
                            <span>Login</span>
                        </div>
                        <div
                            onClick={() => setAuthMode("signup")}
                            className={`relative flex w-56 items-center justify-center rounded-xl px-4 py-3 font-medium cursor-pointer ${authMode === "signup" ? "bg-blue-200 text-blue-800" : "bg-gray-50 text-gray-700"
                                }`}
                        >
                            <span>Signup</span>
                        </div>
                    </div>

                    {authMode === "login" ? (
                        <>
                            <p className="mb-1 font-medium text-gray-500">Email</p>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    id="signin-email"
                                    className="w-full rounded-md border-2 border-gray-300 px-4 py-2"
                                    placeholder="Enter your email or username"
                                    required
                                />
                            </div>
                            <p className="mb-1 font-medium text-gray-500">Password</p>
                            <div className="mb-4">
                                <input
                                    type="password"
                                    id="signin-password"
                                    className="w-full rounded-md border-2 border-gray-300 px-4 py-2"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                            <button
                                onClick={handleSignin}
                                className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-8 py-3 font-bold text-white transition-all hover:opacity-90 hover:shadow-lg"
                            >
                                Sign In
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="mb-1 font-medium text-gray-500">Username</p>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    id="signup-username"
                                    className="w-full rounded-md border-2 border-gray-300 px-4 py-2"
                                    placeholder="Enter your username"
                                />
                            </div>
                            <p className="mb-1 font-medium text-gray-500">Email</p>
                            <div className="mb-4">
                                <input
                                    type="email"
                                    id="signup-email"
                                    className="w-full rounded-md border-2 border-gray-300 px-4 py-2"
                                    placeholder="Enter your email"
                                />
                            </div>
                            <p className="mb-1 font-medium text-gray-500">Password</p>
                            <div className="mb-4">
                                <input
                                    type="password"
                                    id="signup-password"
                                    className="w-full rounded-md border-2 border-gray-300 px-4 py-2"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                            <p className="mb-1 font-medium text-gray-500">Retype Password</p>
                            <div className="mb-4">
                                <input
                                    type="password"
                                    id="signup-retype"
                                    className="w-full rounded-md border-2 border-gray-300 px-4 py-2"
                                    placeholder="Retype your password"
                                    required
                                />
                            </div>
                            <button onClick={handleSignup} className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-8 py-3 font-bold text-white transition-all hover:opacity-90 hover:shadow-lg">
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Signin;
