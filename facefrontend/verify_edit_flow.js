import axios from 'axios';

const API_URL = 'http://localhost:5002/api/timetable';

async function verifyFlow() {
    console.log(`Testing against ${API_URL}...`);
    try {
        // 1. Add a Subject
        console.log("1. Adding 'Physics' (10:00 - 11:00)...");
        const addRes = await axios.post(API_URL, {
            subject: "Physics",
            startTime: "10:00",
            endTime: "11:00"
        });
        console.log("   Success:", addRes.data.message);

        // 2. Get ID
        const getRes = await axios.get(API_URL);
        const period = getRes.data.find(p => p.subject === "Physics");
        if (!period) throw new Error("Physics period not found after adding!");
        console.log("   Found ID:", period.id);

        // 3. Edit the Subject
        console.log(`2. Updating 'Physics' to 10:30 - 11:30...`);
        const updateRes = await axios.put(`${API_URL}/${period.id}`, {
            subject: "Physics",
            startTime: "10:30",
            endTime: "11:30"
        });
        console.log("   Success:", updateRes.data.message);

    } catch (err) {
        console.error("   FAILED:", err.response ? `${err.response.status} ${err.response.statusText}` : err.message);
    }
}

verifyFlow();
