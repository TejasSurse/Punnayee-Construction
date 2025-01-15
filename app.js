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
const nodeMailer = require('nodemailer');

// Transport Setup
const transporter = nodeMailer.createTransport({
    secure: true,
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: "punnyaeeconstruction@gmail.com",
        pass: "vgldszkavhiqpwxp"
    }
});

function sendMail(to, sub, msg) {
    return transporter.sendMail({
        from: `"Punnyaee Construction" APP`,
        to: to,
        subject: sub,
        html: msg,
    });
}

// Database Connection 
const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 4000,
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

// Routes
app.get("/", (req, res) => {
    res.render("listings/index");
});

// Project routes
app.get("/projects", (req, res) => {
    const query = "SELECT * FROM Projects";
    conn.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching projects:", err);
            return res.render("listings/error", { error: "Something went wrong. Please try again later." });
        }
        res.render("listings/projects", { projects: results });
    });
});

app.get("/create", (req, res) => {
    res.render("listings/new");
});

app.post("/create", upload.single('image'), (req, res) => {
    const { title, cost, location, size } = req.body;
    const image = req.file ? req.file.buffer : null;

    const query = `INSERT INTO Projects (title, image, cost, location, size) VALUES (?, ?, ?, ?, ?)`;
    conn.query(query, [title, image, cost, location, size], (err) => {
        if (err) {
            console.error("Error inserting project:", err);
            return res.render("listings/error", { error: "Failed to create project. Please try again later." });
        }
        res.render("listings/success", { message: "Project created successfully!" });
    });
});

app.get("/delete/:id", (req, res) => {
    const query = "DELETE FROM Projects WHERE id = ?";
    conn.query(query, [req.params.id], (err) => {
        if (err) {
            console.error("Error deleting project:", err);
            return res.render("listings/error", { error: "Failed to delete project. Please try again later." });
        }
        res.render("listings/success", { message: "Project deleted successfully!" });
    });
});

app.get("/edit/:id", (req, res) => {
    const query = "SELECT * FROM Projects WHERE id = ?";
    conn.query(query, [req.params.id], (err, result) => {
        if (err) {
            console.error("Error fetching project:", err);
            return res.render("listings/error", { error: "Failed to fetch project. Please try again later." });
        }
        res.render("listings/editproject", { project: result[0] });
    });
});

app.post("/update/:id", upload.single('image'), (req, res) => {
    const { title, cost, location, size } = req.body;
    const image = req.file ? req.file.buffer : null;

    if (!title || !cost || !location || !size) {
        return res.render("listings/error", { error: "All fields are required." });
    }

    let query;
    let params;

    if (image) {
        query = "UPDATE Projects SET title = ?, cost = ?, location = ?, size = ?, image = ? WHERE id = ?";
        params = [title, cost, location, size, image, req.params.id];
    } else {
        query = "UPDATE Projects SET title = ?, cost = ?, location = ?, size = ? WHERE id = ?";
        params = [title, cost, location, size, req.params.id];
    }

    conn.query(query, params, (err) => {
        if (err) {
            console.error("Error updating project:", err);
            return res.render("listings/error", { error: "Failed to update project. Please try again later." });
        }
        res.render("listings/success", { message: "Project updated successfully!" });
    });
});

// Contact routes
app.get("/contacts", (req, res) => {
    res.render("listings/contact");
});

app.post("/contact", async (req, res) => {
    const { name, phone, email, subject, message } = req.body;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2>New Enquiry Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
      </div>
    `;

    try {
        await sendMail("punnyaeeconstruction@gmail.com", "New Enquiry", emailContent);
        res.render("listings/success", { message: "Enquiry submitted successfully!" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.render("listings/error", { error: "Failed to send enquiry. Please try again later." });
    }
});

app.get("/about", (req, res) => {
    res.render("listings/about");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
