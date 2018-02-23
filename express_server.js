const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: 'thequickbrownfoxjumpsoverthelazydog'
}));

var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

const usersDB = {};

let urlsDB = {};

function generateRandomString() {
  let randomStr = "";
  const alphabetAndDigits = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (var i = 0; i < 6; i++) {
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

function hasUserEmail (email) {
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

function getShortURL (url, userURLs) {
  for (let key in userURLs) {
    if (userURLs[key] === url) {
      return key;
    }
  }
  return undefined;
}

function getLongURL(shortURL) {

  for (let index in urlsDB) {
    if (urlsDB[index].hasOwnProperty(shortURL)) {
      return urlsDB[index][shortURL];
    }
  }
  return - 1;
}

app.get('/db.json', (req, res) => {
  res.json({ usersDB, urlsDB });
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.userID;
  if (hasUser(userID)) {
    const templateVars = { user: usersDB[userID]};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("http://localhost:8080/login");
  }
});

app.get("/urls/:id", (req, res) => {
  const userID = req.session.userID;
  if (hasUser(userID)) {
    const templateVars = {shortURL: req.params.id, longURL: urlsDB[userID][req.params.id], user: usersDB[userID]};
    res.render("urls_show", templateVars);
  } else {
    res.redirect("http://localhost:8080/login");
  }
});

app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  if (hasUser(userID)) {
    const templateVars = { user: usersDB[userID], urls: urlsDB[userID] };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("http://localhost:8080/login");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = getLongURL(req.params.shortURL);
  res.redirect(longURL);
});

app.post("/register", (req, res) => {
  if(!req.body.email || !req.body.password) {
    res.sendStatus(400);
  } else if (hasUserEmail(req.body.email)) {
    res.sendStatus(400);
  } else {
    const userID = generateRandomString();
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    usersDB[userID] = {"id": userID, "email": req.body.email, "password": hashedPassword};
    req.session.userID = userID;
    res.redirect("http://localhost:8080/urls/");
  }
});

app.post("/login", (req, res) => {
  if (!hasUserEmail(req.body.email)) {
    res.sendStatus(403);
  } else if (bcrypt.compareSync(req.body.password, usersDB[getUserID(req.body.email)].password)) {
    req.session.userID = getUserID(req.body.email);
    res.redirect("http://localhost:8080/urls");
  } else {
    res.sendStatus(403);
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("http://localhost:8080/urls/login");
});

app.post("/urls/:id/delete", (req, res) => {
  const userID = req.session.userID;
  delete urlsDB[userID][req.params.id];
  res.redirect("http://localhost:8080/urls/");
});

app.post("/urls/:id", (req, res) => {
  urlDataBase[req.params.id] = req.params.longURL;
  res.redirect("http://localhost:8080/urls/");
});

app.post("/urls", (req, res) => {
  const userID = req.session.userID;
  const shortURL = generateRandomString();
  const userURLs = urlsDB[userID] || {};
  const oldShortURL = getShortURL(req.body.longURL, userURLs);
  if (oldShortURL) {
    delete userURLs[oldShortURL];
    userURLs[shortURL] = req.body.longURL;
  } else {
    userURLs[shortURL] = req.body.longURL;
  }
  urlsDB[userID] = userURLs;
  res.redirect('http://localhost:8080/urls/' + shortURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});