import axios from 'axios';

async function verify(port) {
    const API_URL = `http://localhost:${port}/api/timetable`;
    console.log(`\n--- Testing against Port ${port} ---`);
    try {
        // 1. Add a Subject with a specific Day
        const testSubject = `TestSubject_${port}_` + Date.now();
        const testDay = "Friday";
        console.log(`1. Adding '${testSubject}' on '${testDay}'...`);

        await axios.post(API_URL, {
            subject: testSubject,
            startTime: "14:00",
            endTime: "15:00",
            day: testDay
        });
        console.log("   Add request successful.");

        // 2. Fetch and Verify
        console.log("2. Fetching timetable to verify...");
        const getRes = await axios.get(API_URL);
        const period = getRes.data.find(p => p.subject === testSubject);

        if (!period) {
            console.error("   FAILURE: Newly added period not found at all!");
            return;
        }

        console.log(`   Found period: Subject='${period.subject}', Day='${period.day}'`);

        if (period.day === testDay) {
            console.log("   SUCCESS: 'day' field was preserved correctly.");
        } else {
            console.error(`   FAILURE: 'day' field is '${period.day}' (Expected '${testDay}').`);
            console.error("   This confirms the server is running OLD code.");
        }

    } catch (err) {
        console.error("   ERROR:", err.response ? `${err.response.status} ${err.response.statusText}` : err.message);
    }
}

async function runTests() {
    await verify(5001); // Main Server (User's)
    await verify(5002); // Test Server (Mine)
}

runTests();
