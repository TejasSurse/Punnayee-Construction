require('dotenv').config({
    path: `./.env`,
});
//const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
// backend code punnayee construction
const path = require("path");
const express = require("express");
const app = express();
const mysql = require("mysql2");
const ejsMate = require("ejs-mate");
const port = 3000;
const multer = require('multer');
//const { sendContactFormEmail } = require('./sendmail');
//Database Connection 
const conn = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'PunnayeeConstructionProjects'
});

conn.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database!');
});


app.set("view engine", "ejs");                  
app.set("views", path.join(__dirname, "views"));
// To parse all data come form url get req
app.use(express.urlencoded({extended: true}));
app.engine('ejs', ejsMate);


app.use(express.json()); // Parse JSON data (if needed)

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
app.get("/create", (req, res)=>{
    res.render("listings/new");
});

app.post("/create", upload.single('image'), (req, res) => {
    const { title, cost, location, size } = req.body;
    const image = req.file ? req.file.buffer : null;

    // Updated query to include the title field
    const query = `INSERT INTO Projects (title, image, cost, location, size) VALUES (?, ?, ?, ?, ?)`;
    conn.query(query, [title, image, cost, location, size], (err, result) => {
        if (err) {
            console.error("Error inserting project:", err);
            res.status(500).send("Internal Server Error");
            return;
        }
        res.send("Project created successfully!");
    });
});



app.get("/admin", (req, res)=>{
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

app.get("/delete/:id", (req, res)=>{
    console.log("id");
    const query = "DELETE FROM Projects WHERE id = ?";
    conn.query(query, [req.params.id], (err, result) => {
        if (err) {
            console.error("Error deleting project:", err);
            return res.status(500).send("Database error");
            return;
            }
            res.redirect("/admin");
            });
});

// project edit 
app.get("/edit/:id", (req, res)=>{
    const query = "SELECT * FROM Projects WHERE id = ?";
    conn.query(query, [req.params.id], (err, result) => {
        if (err) {
            console.error("Error deleting project:", err);
            return res.status(500).send("Database error");
        }
        res.render("listings/editproject", { project: result[0] });
        });
})

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




// mail send api 
// Contact Page 


app.get("/contacts", (req, res)=>{
    res.render("listings/contact")
});


app.get("/about", (req, res)=>{
    res.render("listings/about");
});

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
});

