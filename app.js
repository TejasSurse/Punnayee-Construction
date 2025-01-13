require('dotenv').config({
    path: `./.env`,
});
const path = require("path");
const express = require("express");
const app = express();
const mysql = require("mysql2");
const ejsMate = require("ejs-mate");
const port = 3000;
const multer = require('multer');


// Database Connection 
const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10),
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT, 10),
    ssl: {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
    },
});




conn.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL database!');
});


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.engine('ejs', ejsMate);
app.use(express.json());
app.use(express.static(path.join(__dirname, "/public")));

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Home Route 
app.get("/", (req, res) => {
    res.render("listings/index");
});

// project read 
app.get("/projects", (req, res) => {
    const query = "SELECT * FROM Projects";
    conn.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching projects:", err);
            return res.status(500).send("Database error");
        }
        res.render("listings/projects", { projects: results });
    });
});

// project upload - create route 
app.get("/create", (req, res) => {
    res.render("listings/new");
});

app.post("/create", upload.single('image'), (req, res) => {
    const { title, cost, location, size } = req.body;
    const image = req.file ? req.file.buffer : null;

    const query = `INSERT INTO Projects (title, image, cost, location, size) VALUES (?, ?, ?, ?, ?)`;
    conn.query(query, [title, image, cost, location, size], (err, result) => {
        if (err) {
            console.error("Error inserting project:", err);
            res.status(500).send("Internal Server Error");
            return;
        }
        res.redirect("/adminpannel");
    });
});

app.get("/admin", (req, res) => {
    const query = "SELECT * FROM Projects";
    conn.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching projects:", err);
            return res.status(500).send("Database error");
        }
        res.render("listings/adminprojects", { projects: results });
    });
});

// project delete 
app.get("/delete/:id", (req, res) => {
    const query = "DELETE FROM Projects WHERE id = ?";
    conn.query(query, [req.params.id], (err, result) => {
        if (err) {
            console.error("Error deleting project:", err);
            return res.status(500).send("Database error");
        }
        res.redirect("/admin");
    });
});

// project edit 
app.get("/edit/:id", (req, res) => {
    const query = "SELECT * FROM Projects WHERE id = ?";
    conn.query(query, [req.params.id], (err, result) => {
        if (err) {
            console.error("Error fetching project:", err);
            return res.status(500).send("Database error");
        }
        res.render("listings/editproject", { project: result[0] });
    });
});

// Update Route Project 
app.post("/update/:id", upload.single('image'), (req, res) => {
    const { title, cost, location, size } = req.body;
    const image = req.file ? req.file.buffer : null;

    // Validate form data
    if (!title || !cost || !location || !size) {
        return res.status(400).send("All fields are required");
    }

    let query;
    let params;

    if (image) {
        // If a new image is uploaded
        query = "UPDATE Projects SET title = ?, cost = ?, location = ?, size = ?, image = ? WHERE id = ?";
        params = [title, cost, location, size, image, req.params.id];
    } else {
        // If no new image is uploaded
        query = "UPDATE Projects SET title = ?, cost = ?, location = ?, size = ? WHERE id = ?";
        params = [title, cost, location, size, req.params.id];
    }

    conn.query(query, params, (err, result) => {
        if (err) {
            console.error("Error updating project:", err);
            return res.status(500).send("Database error");
        }
        res.redirect("/admin");
    });
});

// Contact Page 
app.get("/contacts", (req, res) => {
    res.render("listings/contact")
});

app.get("/about", (req, res) => {
    res.render("listings/about");
});


app.get("/adminpannel", (req, res) =>{
    res.render("listings/adminpannel");
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});