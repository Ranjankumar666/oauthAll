const { google } = require("googleapis");
const { default: axios } = require("axios");
const qs = require("querystring");
const { get } = require("http");

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_SECRET,
    "http://localhost:3000/auth/google"
);

const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
];

exports.googleURL = oauth2Client.generateAuthUrl({
    scope: scopes,
    prompt: "consent",
});

exports.githubURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}`;

const facebookConfig = qs.encode({
    client_id: process.env.FACEBOOK_CLIENT_ID,
    redirect_uri: "http://localhost:3000/auth/facebook/",
    scope: ["email", "user_friends"].join(","), // comma seperated string
    response_type: "code",
    auth_type: "rerequest",
    display: "popup",
});

exports.facebookURL = `https://www.facebook.com/v4.0/dialog/oauth?${facebookConfig}`;

exports.google = async (req, res) => {
    // get the authorization code
    const { code } = req.query;
    // exchange the authorization code for acces__tokens
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);
    // save this code/access_tokken in your db for futire request
    const { scope, access_token, id_token } = tokens;

    axios({
        url: `https://www.googleapis.com/oauth2/v1/userinfo`,
        params: {
            alt: "json",
            access_token,
        },

        headers: {
            Authorization: `Bearer ${id_token}`,
        },
    })
        .then((response) => {
            console.log(response.data);
            res.redirect("/");
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.github = async (req, res) => {
    // save this code/access_tokken in your db for futire request
    const { code } = req.query;

    try {
        const { data } = await axios({
            url: "https://github.com/login/oauth/access_token",
            method: "get",
            params: {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_SECRET,
                code,
            },
        });

        const { access_token, token_type } = qs.parse(data);

        const response = await axios({
            url: "https://api.github.com/user",
            method: "get",
            headers: {
                Authorization: `token ${access_token}`,
            },
        });

        console.log(response.data);
        res.redirect("/");
    } catch (err) {
        console.log(err.message);
        res.send("Something not good");
    }
};

exports.facebook = async (req, res) => {
    const { code } = req.query;

    const { data } = await axios({
        url: "https://graph.facebook.com/v4.0/oauth/access_token",
        method: "get",
        params: {
            client_id: process.env.FACEBOOK_CLIENT_ID,
            client_secret: process.env.FACEBOOK_SECRET,
            redirect_uri: "http://localhost:3000/auth/facebook/",
            code,
        },
    });

    // save the data.access_token into yor db

    await axios({
        url: "https://graph.facebook.com/me",
        method: "get",
        params: {
            fields: ["id", "email", "first_name", "last_name"].join(","),
            access_token: data.access_token,
        },
    }).then((response) => {
        console.log(response.data);
    });

    res.redirect("/");
};
