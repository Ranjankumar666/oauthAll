require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const {
    google,
    googleURL,
    githubURL,
    github,
    facebook,
    facebookURL,
} = require("./controllers/authProviders");

app.use(express.static(path.join(__dirname, "/public")));

app.get("/", (req, res) => {
    res.send("index.html");
});

app.get("/login/:provider", (req, res) => {
    const { provider } = req.params;

    if (provider.toLowerCase() === "google") {
        res.redirect(googleURL);
    } else if (provider.toLowerCase() === "github") {
        res.redirect(githubURL);
    } else if (provider.toLowerCase() === "facebook") {
        res.redirect(facebookURL);
    }
    // something
});

app.get("/auth/google", google);
app.get("/auth/github", github);
app.get("/auth/facebook", facebook);

app.listen("3000", () => {
    console.log("Started Server");
});
