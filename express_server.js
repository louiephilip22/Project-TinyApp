const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');


let usersDB = {};

let urlsDB = {};


function generateRandomString() {
  let randomStr = "";
  const alphabetAndDigits = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 6; i++) {
    randomStr += alphabetAndDigits.charAt(Math.floor(Math.random() * alphabetAndDigits.length));
  }
  return randomStr;
}


function hasUser(userID) {
  if (!userID) {
    return false;
  } else {
    for (let user in usersDB) {
      if (user === userID) {
        return true;
      }
    }
    return false;
  }
}


function hasUserEmail(email) {
  for (let user in usersDB) {
    if (usersDB[user].email === email) {
      return true;
    }
  }
  return false;
}


function getUserID(email) {
  for (let user in usersDB) {
    if (usersDB[user].email === email) {
      return usersDB[user].id;
    }
  }
}


function getShortURL(url, userID) {
  for (let key in urlsDB[userID]) {
    if (urlsDB[userID][key] === url) {
      return key;
    }
  }
}


function getLongURL(shortURL) {
  for (let key in urlsDB) {
    if (urlsDB[key].hasOwnProperty(shortURL)) {
      return urlsDB[key][shortURL];
      break;
    }
  }
}


const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
name: 'session',
keys: [process.env.SECRET_KEY || 'philip']
}));

const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");


//Registration page
app.get("/register", (req, res) => {
  const userID = req.session.userID;
  if (hasUser(userID)) {
    res.redirect("/urls");
  } else {
    res.render("urls_register");
  }
});


//login page
app.get("/login", (req, res) => {
  const userID = req.session.userID;
  if (hasUser(userID)) {
    res.redirect("/urls");
  } else {
    res.render("urls_login");
  }
});


//shortURL creation page
app.get("/urls/new", (req, res) => {
  const userID = req.session.userID;
  if (hasUser(userID)) {
    const templateVars = { user: usersDB[userID]};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});


//specific URL page
app.get("/urls/:id", (req, res) => {
  const userID = req.session.userID;
  if (hasUser(userID)) {
    if (!urlsDB[userID].hasOwnProperty(req.params.id)) {
      res.status(403).send(`shortURL not found. Create a new one (<a href="/urls_new">here</a>).`);
    } else {
      const templateVars = {shortURL: req.params.id, longURL: urlsDB[userID][req.params.id], user: usersDB[userID]};
      res.render("urls_show", templateVars);
    }
  } else {
    res.status(403).send('User not logged in! Go to log in page (<a href="/login">Login</a>)');
  }
});


//home page
app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  if (hasUser(userID)) {
    const templateVars = { user: usersDB[userID], urls: urlsDB[userID] };
    res.render("urls_index", templateVars);
  } else {
    res.status(403).send('User not logged in! Go to <a href="/login">Login</a> or <a href="/register">Register</a> page.');
  }
});


//shortURL page
app.get("/u/:shortURL", (req, res) => {
  let longURL = getLongURL(req.params.shortURL);
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(400).send('Requested url doesn\'t exist. Create a new one (<a href="urls_new">New shortURL</a>)');
  }
});


app.get("/", (req, res) => {
  res.redirect("/urls");
});


//Receive email and password
app.post("/register", (req, res) => {
  if(!req.body.email || !req.body.password) {
    res.status(400).send('Email and password required! Try again! (<a href="/register">Register</a>).');
  } else if (hasUserEmail(req.body.email)) {
    res.status(400).send('Email already registered! Go to login page (<a href="/login">Login</a>).');
  } else {
    const userID = generateRandomString();
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    usersDB[userID] = {"id": userID, "email": req.body.email, "password": hashedPassword};
    req.session.userID = userID;
    res.redirect("/urls");
  }
});


//check email and password
app.post("/login", (req, res) => {
  if(!req.body.email || !req.body.password) {
    res.status(400).send('Email and password required!');
  } else if (!hasUserEmail(req.body.email)) {
    res.status(403).send('User not registered! Register first to log in (<a href="/register">Register</a>).');
  } else if (bcrypt.compareSync(req.body.password, usersDB[getUserID(req.body.email)].password)) {
    req.session.userID = getUserID(req.body.email);
    res.redirect("/urls");
  } else {
    res.status(403).send('Invalid password! Please try again! (<a href="/login">Login</a>)');
  }
});


//logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


//delete
app.post("/urls/:id/delete", (req, res) => {
  const userID = req.session.userID;
  if (hasUser(userID)) {
    if (urlsDB[userID].hasOwnProperty(req.params.id)) {
      delete urlsDB[userID][req.params.id];
      res.redirect("/urls/");
    } else {
      res.status(403).send(`shortURL not found. Create a new one (<a href="/urls_new">here</a>)`);
    }
  } else {
    res.status(403).send('User not logged in! Log in first! (<a href="/login">Login</a>)');
  }
});


//longURL form
app.post("/urls/:id", (req, res) => {
  const userID = req.session.userID;
  if (hasUser(userID)) {
    if (urlsDB[userID].hasOwnProperty(req.params.id)) {
      urlsDB[userID][req.params.id] = req.body.longURL;
      res.redirect('/urls/' + req.params.id);
    } else {
      res.status(403).send(`shortURL not found. Create a new one (<a href="/urls_new">here</a>)`);
    }
  } else {
    res.redirect("/urls/");
  }
});

//shortURL and longURL
app.post("/urls", (req, res) => {
  const userID = req.session.userID;
  if (hasUser(userID)) {
    const userURLs = urlsDB[userID] || {};
    const shortURL = generateRandomString();
    userURLs[shortURL] = req.body.longURL;
    urlsDB[userID] = userURLs;

    res.redirect('/urls/' + shortURL);
  } else {
    res.status(403).send('User not logged in! Log in first! (<a href="/login">Login</a>)');
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
