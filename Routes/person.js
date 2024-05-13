const router = require("express").Router();
const pool = require("../dbPool");

// checking database connection
pool.getConnection()
    .then((conn) => {
        console.log("Connected to database");
        conn.release();
    })
    .catch((err) => {
        console.error("Error connecting to database", err);
    });

// view a person
// on GET /person with body {party_id} route search person by party_id and return the person details else send 404
router.get("/", async (req, res) => {
    const { party_id } = req.body;
    if (!party_id) {
        return res.status(400).send("party_id is required");
    }
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query("SELECT * FROM person WHERE party_id = ?", [party_id]);
        conn.release();
        if (rows.length > 0) {
            return res.send(rows[0]);
        }
        res.status(404).send("Person not found");
    } catch (err) {
        console.error("Error executing query", err);
        res.status(500).send("Internal server error");
    }
});

// add a new person
// on POST /person with body of new person 
// new person body{party_id, first_name, middle_name, last_name, gender, birth_date, marital_status_enum_id, employment_status_enum_id, occupation}
// first check if the party_id already exists in the database if yes not allowed with code 405 else insert the new person
// firstly add a new party in the party table then add the person details in the person table
// INSERT INTO party (party_id, party_enum_type_id) VALUES ('P1000', 'PERSON');
router.post("/", async (req, res) => {
    const { party_id, first_name, middle_name, last_name, gender, birth_date, marital_status_enum_id, employment_status_enum_id, occupation } = req.body;
    if (!party_id || !first_name || !last_name || !gender || !birth_date || !marital_status_enum_id || !employment_status_enum_id || !occupation) {
        return res.status(400).send("All fields are required");
    }
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query("SELECT * FROM person WHERE party_id = ?", [party_id]);
        if (rows.length > 0) {
            conn.release();
            return res.status(405).send("Person already exists");
        }
        await conn.query("INSERT INTO party (party_id, party_enum_type_id) VALUES (?, ?)", [party_id, first_name + middle_name + last_name]);
        await conn.query("INSERT INTO person (party_id, first_name, middle_name, last_name, gender, birth_date, marital_status_enum_id, employment_status_enum_id, occupation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [party_id, first_name, middle_name, last_name, gender, birth_date, marital_status_enum_id, employment_status_enum_id, occupation]);
        conn.release();
        res.send("Person added successfully");
    } catch (err) {
        console.error("Error executing query", err);
        res.status(500).send("Internal server error");
    }
});

// update a person details by party_id
// on PUT /person with body of updated person details
// check if the party_id exists in the database if not send 404 else update the person details
router.put("/", async (req, res) => {
    const { party_id, first_name, middle_name, last_name, gender, birth_date, marital_status_enum_id, employment_status_enum_id, occupation } = req.body;
    if (!party_id || !first_name || !last_name || !gender || !birth_date || !marital_status_enum_id || !employment_status_enum_id || !occupation) {
        return res.status(400).send("All fields are required");
    }
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query("SELECT * FROM person WHERE party_id = ?", [party_id]);
        if (rows.length > 0) {
            conn.release();
            await conn.query("UPDATE person SET first_name = ?, middle_name = ?, last_name = ?, gender = ?, birth_date = ?, marital_status_enum_id = ?, employment_status_enum_id = ?, occupation = ? WHERE party_id = ?", [first_name, middle_name, last_name, gender, birth_date, marital_status_enum_id, employment_status_enum_id, occupation, party_id]);
            conn.release();
            res.send("Person updated successfully");
        } else {
            conn.release();
            res.status(404).send("Person not found");
        }
    } catch (err) {
        console.error("Error executing query", err);
        res.status(500).send("Internal server error");
    }
});

module.exports = router;