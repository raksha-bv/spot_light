if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const session = require('express-session');
const MongoDBStore = require('connect-mongo');

const userRoutes = require('./routes/users');
const spotRoutes = require('./routes/spots');
const reviewRoutes = require('./routes/reviews');
const secret=process.env.SECRET
const dbUrl=process.env.DB_URL
// const dbUrl='mongodb://127.0.0.1:27017/spot-light'
async function main() {
  await mongoose.connect(dbUrl);
}

const db= mongoose.connection
db.on("error", console.error.bind(console,"connection error:"))
db.once("open",()=>{
    console.log("database connected")
})
main().catch(err => console.log(err));
const app = express()

app.engine('ejs',ejsMate)
app.set('view engine','ejs')
app.set('views',path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanitize({
    replaceWith: '_'
}))

const store = MongoDBStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: secret
    }
});
store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
    store,
    name:'sess',
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure:true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash());
app.use(helmet());


const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://cdn.jsdelivr.net",
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", ...connectSrcUrls],
            styleSrc: ["'self'", 'maxcdn.bootstrapcdn.com', 'stackpath.bootstrapcdn.com',"'unsafe-inline'", ...styleSrcUrls],
            scriptSrc: ["'self'", 'cdn.jsdelivr.net', 'stackpath.bootstrapcdn.com',"'unsafe-inline'", ...styleSrcUrls],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dqdjdjtgm/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ], // Allowing images from Cloudinary
            mediaSrc: ["'self'", 'https://res.cloudinary.com/dqdjdjtgm/'], // Allowing media (videos) from Cloudinary
            objectSrc: ["'none'"],
            fontSrc: ["'self'", 'maxcdn.bootstrapcdn.com', 'stackpath.bootstrapcdn.com',,...fontSrcUrls],
            childSrc: ["blob:"],
            // defaultSrc: [],
            // connectSrc: ["'self'", ...connectSrcUrls],
            // scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            // styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            // workerSrc: ["'self'", "blob:"],
            // objectSrc: [],
            // imgSrc: [
            //     "'self'",
            //     "blob:",
            //     "data:",
            //     "https://res.cloudinary.com/dqdjdjtgm/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
            //     "https://images.unsplash.com/",
            // ],
            // mediaSrc: ["'self'", 'https://res.cloudinary.com/dqdjdjtgm/"'],
            // fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/', userRoutes);
app.use('/spots', spotRoutes)
app.use('/spots/:id/reviews', reviewRoutes)

app.get('/',(req,res)=>{
    res.render('home')
})


app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})
app.listen(3000,()=>{
    console.log('listening on port 3000')
})