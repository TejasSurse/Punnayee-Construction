const path = require("path");
const express = require("express");
const app = express();
const ejsMate = require("ejs-mate");
const port = 3000;


// App configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.engine('ejs', ejsMate);
app.use(express.json());
app.use(express.static(path.join(__dirname, "/public")));



// Routes
app.get("/", (req, res) => {
    res.render("home");
});


app.get("/about", (req, res) => {
    res.render("about");
});


app.get("/contact", (req, res) => {
    res.render("contact");
});

app.get("/services", (req, res)=>{
    res.render("services");
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
