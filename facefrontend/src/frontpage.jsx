import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const Front = () => {
  const [recognizedName, setRecognizedName] = useState("USN will appear here");
  const [recognizedStudentName, setRecognizedStudentName] = useState("Name will appear here");
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [students, setStudents] = useState([]);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/students");
        setStudents(response.data);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera access error:", err);
        toast.error("Could not access camera");
      }
    };

    getCamera();
  }, []);

  // Auto-Attendance Interval
  useEffect(() => {
    let interval;
    if (isAutoMode) {
      interval = setInterval(() => {
        handleRecognize(true); // Pass true for auto mode
      }, 5000); // Run every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isAutoMode, students]); // Depend on students to ensure we have data

  const handleRecognize = async (isAuto = false) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!videoRef.current || !canvas) return;

    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg");

    try {
      const response = await axios.post("http://localhost:5005/recognize", { image: imageData });
      const results = response.data;

      if (results.length === 0) {
        setRecognizedName("No face detected");
        setRecognizedStudentName("");
        if (!isAuto) toast.error("No face detected");
        return;
      }

      const recognizedUSNs = [];
      const recognizedNames = [];
      let successCount = 0;

      for (const result of results) {
        const usn = result.usn;
        if (usn === "Unknown") continue;

        recognizedUSNs.push(usn);
        const matchedStudent = students.find((student) => student.usn === usn);
        recognizedNames.push(matchedStudent ? matchedStudent.name : "Unknown");

        const recognizedAt = new Date().toISOString();

        try {
          const res = await axios.post("http://localhost:5001/api/periodwise-attendance", {
            usn,
            recognizedAt
          });
          if (res.status === 201) {
            successCount++;
            toast.success(`Marked: ${matchedStudent ? matchedStudent.name : usn}`);
          }
        } catch (err) {
          const errorMsg = err.response?.data?.message;
          if (!isAuto && errorMsg) {
            // Optional: toast.info(errorMsg); 
          }
        }
      }

      if (recognizedUSNs.length > 0) {
        setRecognizedName(recognizedUSNs.join(", "));
        setRecognizedStudentName(recognizedNames.join(", "));
        if (successCount > 0) {
          setAttendanceMessage(`Attendance marked for ${successCount} student(s).`);
        } else {
          setAttendanceMessage("Attendance already recorded for all.");
        }
      } else {
        setRecognizedName("Unknown");
        setRecognizedStudentName("Unknown");
        setAttendanceMessage("");
      }

    } catch (err) {
      console.error(err);
      setRecognizedName("Error");
      setRecognizedStudentName("Error");
      setAttendanceMessage("Error in recognition.");
      if (!isAuto) toast.error("Recognition failed");
    }
  };

  return (
    <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]">
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col sm:flex-row gap-5 w-full h-[80vh] p-5">
          <div className="w-1/2 h-full flex items-center justify-center">
            <div className="w-full max-w-2xl aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden border-2 border-[#E8E4FF] relative">
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} width="640" height="480" className="hidden"></canvas>

              {/* Auto Mode Indicator Overlay */}
              {isAutoMode && (
                <div className="absolute top-4 right-4 bg-green-500/80 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  AUTO MODE ON
                </div>
              )}
            </div>
          </div>

          <div className="w-1/2 h-full flex flex-col items-center justify-center text-center">
            <h1 className="text-5xl font-bold text-white drop-shadow-md mb-6">
              Smart Attendance System
            </h1>

            <div className="mt-5 text-2xl font-medium text-gray-300">
              Recognized USN: <span className="text-emerald-400 font-bold">{recognizedName}</span>
            </div>
            <div className="mt-5 text-2xl font-medium text-gray-300">
              Recognized Student Name: <span className="text-emerald-400 font-bold">{recognizedStudentName}</span>
            </div>

            {/* Display the attendance message */}
            {attendanceMessage && (
              <div className="mt-5 text-lg font-medium text-yellow-300">
                {attendanceMessage}
              </div>
            )}
            <div className="flex flex-row gap-3 flex-wrap justify-center">
              <button
                onClick={() => handleRecognize(false)}
                className="mt-8 transition-background inline-flex h-12 items-center justify-center rounded-xl border border-gray-800 bg-gradient-to-r from-gray-100 via-[#c7d2fe] to-[#8678f9] bg-[length:200%_200%] bg-[0%_0%] px-6 font-medium text-gray-950 duration-500 hover:bg-[100%_200%] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-50"
              >
                Recognize Face
              </button>

              <button
                onClick={() => setIsAutoMode(!isAutoMode)}
                className={`mt-8 transition-all inline-flex h-12 items-center justify-center rounded-xl border border-gray-800 px-6 font-medium text-white duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-50 ${isAutoMode ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isAutoMode ? "Stop Auto Mode" : "Start Auto Mode"}
              </button>

              <Link to="/Signin">
                <button className="mt-8 transition-background inline-flex h-12 items-center justify-center rounded-xl border border-gray-800 bg-gradient-to-r from-gray-100 via-[#c7d2fe] to-[#8678f9] bg-[length:200%_200%] bg-[0%_0%] px-6 font-medium text-gray-950 duration-500 hover:bg-[100%_200%] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-50">
                  Dashboard
                </button>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Front;
