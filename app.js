require('dotenv').config({ path: './.env' });
const path = require("path");
const express = require("express");
const app = express();
const mysql = require("mysql2/promise"); // Use promise-based mysql2
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
        pass: "vgldszkavhiqpwxp",
    },
});

function sendMail(to, sub, msg) {
    return transporter.sendMail({
        from: `"Punnyaee Construction" APP`,
        to,
        subject: sub,
        html: msg,
    });
}

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Set the connection pool size
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
    },
});

// Middleware to check database connection for each route
async function checkDatabaseConnection(req, res, next) {
    try {
        const connection = await pool.getConnection();
        connection.release(); // Release connection back to the pool
        next();
    } catch (err) {
        console.error('Error with database connection:', err.message);
        res.render("listings/error", { error: "Database connection failed. Please try again later." });
    }
}

app.use(checkDatabaseConnection);

// App configuration
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

// Fetch all projects
app.get("/projects", async (req, res) => {
    try {
        const [results] = await pool.query("SELECT * FROM Projects");
        res.render("listings/projects", { projects: results });
    } catch (err) {
        console.error("Error fetching projects:", err);
        res.render("listings/error", { error: "Something went wrong. Please try again" });
    }
});

// Render create project form
app.get("/create", (req, res) => {
    res.render("listings/new");
});

// Create a new project
app.post("/create", upload.single('image'), async (req, res) => {
    const { title, cost, location, size } = req.body;
    const image = req.file ? req.file.buffer : null;

    try {
        const query = `INSERT INTO Projects (title, image, cost, location, size) VALUES (?, ?, ?, ?, ?)`;
        await pool.query(query, [title, image, cost, location, size]);
        res.render("listings/success", { message: "Project created successfully!" });
    } catch (err) {
        console.error("Error inserting project:", err);
        res.render("listings/error", { error: "Failed to create project. Please try again later." });
    }
});

// Delete a project
app.get("/delete/:id", async (req, res) => {
    try {
        const query = "DELETE FROM Projects WHERE id = ?";
        await pool.query(query, [req.params.id]);
        res.render("listings/success", { message: "Project deleted successfully!" });
    } catch (err) {
        console.error("Error deleting project:", err);
        res.render("listings/error", { error: "Failed to delete project. Please try again later." });
    }
});

// Edit a project
app.get("/edit/:id", async (req, res) => {
    try {
        const query = "SELECT * FROM Projects WHERE id = ?";
        const [result] = await pool.query(query, [req.params.id]);
        res.render("listings/editproject", { project: result[0] });
    } catch (err) {
        console.error("Error fetching project:", err);
        res.render("listings/error", { error: "Failed to fetch project. Please try again later." });
    }
});

// Update a project
app.post("/update/:id", upload.single('image'), async (req, res) => {
    const { title, cost, location, size } = req.body;
    const image = req.file ? req.file.buffer : null;

    if (!title || !cost || !location || !size) {
        return res.render("listings/error", { error: "All fields are required." });
    }

    try {
        let query;
        let params;

        if (image) {
            query = "UPDATE Projects SET title = ?, cost = ?, location = ?, size = ?, image = ? WHERE id = ?";
            params = [title, cost, location, size, image, req.params.id];
        } else {
            query = "UPDATE Projects SET title = ?, cost = ?, location = ?, size = ? WHERE id = ?";
            params = [title, cost, location, size, req.params.id];
        }

        await pool.query(query, params);
        res.render("listings/success", { message: "Project updated successfully!" });
    } catch (err) {
        console.error("Error updating project:", err);
        res.render("listings/error", { error: "Failed to update project. Please try again later." });
    }
});

// Contact form routes
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

// Static pages
app.get("/about", (req, res) => {
    res.render("listings/about");
});

app.get("/adminpannel", (req, res) => {
    res.render("listings/adminpannel");
});

app.get("/admin", async (req, res) => {
    try {
        const [results] = await pool.query("SELECT * FROM Projects");
        res.render("listings/adminprojects", { projects: results });
    } catch (err) {
        console.error("Error fetching projects:", err);
        res.render("listings/error", { error: "Failed to fetch admin projects. Please try again later." });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
