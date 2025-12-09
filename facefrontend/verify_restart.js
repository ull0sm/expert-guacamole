import axios from 'axios';

const API_URL = 'http://localhost:5001/api/timetable';

async function verifyRestart() {
    console.log(`Testing against ${API_URL}...`);
    try {
        // 1. Add a Subject with a specific Day
        const testSubject = "RestartVerify_" + Date.now();
        const testDay = "Sunday";
        console.log(`1. Adding '${testSubject}' on '${testDay}'...`);

        await axios.post(API_URL, {
            subject: testSubject,
            startTime: "08:00",
            endTime: "09:00",
            day: testDay
        });
        console.log("   Add request successful.");

        // 2. Fetch and Verify
        console.log("2. Fetching timetable to verify...");
        const getRes = await axios.get(API_URL);
        const period = getRes.data.find(p => p.subject === testSubject);

        if (!period) {
            throw new Error("Newly added period not found at all!");
        }

        console.log(`   Found period: Subject='${period.subject}', Day='${period.day}'`);

        if (period.day === testDay) {
            console.log("   SUCCESS: Server is updated! 'day' field is correct.");
        } else {
            console.error(`   FAILURE: 'day' field is '${period.day}'. Server is STILL OLD.`);
        }

    } catch (err) {
        console.error("   ERROR:", err.response ? `${err.response.status} ${err.response.statusText}` : err.message);
    }
}

verifyRestart();
