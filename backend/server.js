// Imports and Configurations
const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const User = require("./Models/user"); 
const userRoutes = require("./Routes/user");
const itemRoutes=require("./Routes/mycollege");


const app = express();
app.use(express.json({ limit: "10mb" }));  
app.use(express.urlencoded({ limit: "10mb", extended: true }));


app.use(
    cors({
        origin: ["https://college-olx.onrender.com", "http://localhost:3000"],
        credentials: true, 
        methods: ["GET", "POST", "PUT", "DELETE"],
    })
);



// Database Connection
const dbUrl = process.env.ATLASDB_URL;
if (!dbUrl) {
    console.error("Database URL not found. Set ATLASDB_URL in .env");
    process.exit(1);
}

async function main() {
    try {
        await mongoose.connect(dbUrl, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("DB connected");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
}
main();

// Session Configuration
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret: process.env.SECRET },
    touchAfter: 24 * 3600,
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true, // Security best practice
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // Fixes session issue on cross-origin requests
    },
};
app.set("trust proxy", 1);
app.use(session(sessionOptions));


// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

store.on("error", function (error) {
    console.error("Session Store Error:", error);
});
// Routes

app.use("/", userRoutes); 
app.use("/mycollege",itemRoutes);
// Server Setup
const Port = process.env.PORT || 3000;
app.listen(Port, "0.0.0.0", () => {
    console.log(`Server started at port ${Port}`);
});


