require('dotenv').config()
const express = require("express");

const ejs = require("ejs");

const app = express();
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportlocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-find-or-create');
// const encrypt = require("mongoose-encryption");

// const md5 = require('md5');

// const bcrypt = require('bcrypt');
// const saltRounds = 10;
// const myPlaintextPassword = 's0/\/\P4$$w0rD';
// const someOtherPlaintextPassword = 'not_bacon';

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(session({

  secret:process.env.SECRET,
  resave: false,
  saveUninitialized: false
 

}));

app.use(passport.initialize());
app.use(passport.session());



const dburl = process.env.DB_CONNECT;



try {
  mongoose.connect(
    dburl,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => console.log("connected")
  );
} catch (error) {
  console.log("could not connect");
  console.log(error);
};



mongoose.set('useCreateIndex', true);


const userSchema = new mongoose.Schema({
  email: String,
  password: String,
 
  googleId: String,
  secret: String
});

userSchema.plugin(passportlocalMongoose);
userSchema.plugin(findOrCreate);
// const secret = process.env.SECRET;
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const User = new mongoose.model ("User", userSchema);

passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});





passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
  // userProfileURL: "https//www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {

  console.log(profile);
  User.findOrCreate({ googleId: profile.id}, function (err, user) {
    return cb(err, user);


  });
}
));





app.get("/", function(req, res){
  res.render("home")
});


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/login", function(req, res){

  res.render("login")
});

app.get("/register", function(req, res){
  res.render("register")
});


app.get("/secrets", function(req, res){

  User.find({"secret":{$ne:null}},function(err,foundUsers){
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render ("secrets", {usersWithSecrets: foundUsers});
      }
    }
  })
  
  // } else {
  //   res.redirect("/login")
  // }
});



app.get("/submit", function (req, res){

  if (req.isAuthenticated()) {
    res.render("submit");
  } else {res.redirect("/login")};

});


app.post("/submit", function (req, res){
  
    const submittedSecret = req.body.secret;

    console.log(req.user.id);

    User.findById(req.user.id, function(err, foundUser){
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.secret = submittedSecret;
          foundUser.save( function(){
            res.redirect("/secrets")
          });
        }

      }
    });

});


app.post("/register", function(req, res){


  var User = mongoose.model('Users', userSchema);

User.register({username: req.body.username, active: false}, req.body.password, function(err, user) {
  if (err) { 
    console.log(err);
    res.redirect('/register');
  } else {
    passport.authenticate("local")(req,res, function(){

      res.redirect("/secrets");

    });
  }


  // var authenticate = User.authenticate();
  // authenticate('username', 'password', function(err, result) {
  //   if (err) { ... }

    // Value 'result' is set to false. The user could not be authenticated since the user is not active
  });
});
  



app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
      res.redirect("/login");
    }
    else {
      passport.authenticate("local")(req,res, function(){

        res.redirect("/secrets");
    });
  }
  
});

});


app.get('/logout', function(req,res){

  req.logout();
  res.redirect('/');

} );


app.listen(3000, function() {
    console.log("Server started on port 3000");
  });
