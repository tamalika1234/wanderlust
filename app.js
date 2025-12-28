if(process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const express =  require("express");
const app = express();
const mongoose = require("mongoose");
const path = require ("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js")

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL;

main()
    .then(() => {
        console.log("connect to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname, "views"));
app.engine('ejs', ejsMate);
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname,"/public")));


const sessionOptions = {
    name: "session",
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: dbUrl,
        collectionName: "sessions",
        ttl: 14 * 24 * 60 * 60 
    }),
    cookie: {
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000,
    }
};




app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});



app.get("/set-session", (req, res) => {
    req.session.username = "Tamalika";
    res.send("Session saved in MongoDB Atlas!");
});

app.get("/get-session", (req, res) => {
    res.send(req.session.username || "No session found");
});


app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter);



app.all('/{*splat}', (req,res,next) => {
    next(new ExpressError(404, "Page Not Found!"));
});


app.use((err, req,res, next) => {
    let{ statusCode=500, message="Something went wrong!"}=err;
    res.status(statusCode).render("error.ejs",{ message });
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});

