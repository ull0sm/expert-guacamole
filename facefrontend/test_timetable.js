import axios from 'axios';

const API_URL = 'http://localhost:5002/api/timetable';

async function test() {
    try {
        // 1. Add Period
        console.log("Adding period...");
        const addRes = await axios.post(API_URL, {
            subject: "Test Subject",
            startTime: "09:00",
            endTime: "10:00"
        });
        console.log("Add Response:", addRes.data);

        // 2. Fetch Timetable
        console.log("Fetching timetable...");
        const getRes = await axios.get(API_URL);
        const periods = getRes.data;
        console.log("Periods:", periods);

        if (periods.length === 0) {
            console.error("No periods found!");
            return;
        }

        const period = periods.find(p => p.subject === "Test Subject");
        if (!period) {
            console.error("Test period not found!");
            return;
        }
        const id = period.id;
        console.log("Target ID:", id);

        // 3. Update Period
        console.log(`Updating period ${id}...`);
        const updateRes = await axios.put(`${API_URL}/${id}`, {
            subject: "Updated Subject",
            startTime: "09:30",
            endTime: "10:30"
        });
        console.log("Update Response:", updateRes.data);

        // 4. Verify Update
        const verifyRes = await axios.get(API_URL);
        const updatedPeriod = verifyRes.data.find(p => p.id === id);
        console.log("Updated Period:", updatedPeriod);

    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

test();
