require('dotenv').config()
const express = require("express");

const ejs = require("ejs");

const app = express();
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");

// const md5 = require('md5');

const bcrypt = require('bcrypt');
const saltRounds = 10;
// const myPlaintextPassword = 's0/\/\P4$$w0rD';
// const someOtherPlaintextPassword = 'not_bacon';

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));


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




const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// const secret = process.env.SECRET;
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const User = new mongoose.model ("User", userSchema);


app.get("/", function(req, res){
  res.render("home")
});

app.get("/login", function(req, res){

  res.render("login")
});

app.get("/register", function(req, res){
  res.render("register")
});

app.post("/register", function(req, res){


  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

    const newUser = new User ({
      email: req.body.username,
      password: hash
    });
  
    newUser.save(function(err){
      if(err) {
        console.log(err);
      } else {
        res.render("secrets");
      }
    })
});

  

});

app.post("/login", function(req, res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username}, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
       
        
        bcrypt.compare(password, foundUser.password, function(err, result) {
          // result == true

          if (result === true) {

            res.render("secrets");
          }  else {
            res.render("login");
          }


      });

        
      }
    }
  });
});






app.listen(3000, function() {
    console.log("Server started on port 3000");
  });
