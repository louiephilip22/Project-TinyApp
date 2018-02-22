var express = require("express");
var app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

function generateRandomString() {
  let randomStr = "";
  const alphabetAndDigits = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (var i = 0; i < 6; i++) {
    randomStr += alphabetAndDigits.charAt(Math.floor(Math.random() * alphabetAndDigits.length));
  }
  return randomStr;
}

function hasUser(user_id) {
  for (let user in usersDB) {
    if (user === user_id) {
      return true;
    }
  }
  return false;
}

function hasUserEmail (email) {
  for (let user in usersDB) {
    if (usersDB[user].email === email) {
      return true;
    }
  }
  return false;
}

function hasUserPassword (email, password) {
  for (let user in usersDB) {
    if (usersDB[user].email === email) {
      if (usersDB[user].password === password) {
        return true;
      }
      return false;
    }
  }
  return false;
}

function getUser_id(email) {
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

const usersDB = {};

let urlsDB = {};

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
  if (hasUser(req.cookies.user_id)) {
    const templateVars = { user: usersDB[req.cookies.user_id]};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("http://localhost:8080/login");
  }
});

app.get("/urls/:id", (req, res) => {
  if (hasUser(req.cookies.user_id)) {
    const templateVars = {shortURL: req.params.id, longURL: urlsDB[req.cookies.user_id][req.params.id], user: usersDB[req.cookies.user_id]};
    res.render("urls_show", templateVars);
  } else {
    res.redirect("http://localhost:8080/login");
  }
});

app.get("/urls", (req, res) => {
  if (hasUser(req.cookies.user_id)) {
    const templateVars = { user: usersDB[req.cookies.user_id], urls: urlsDB[req.cookies.user_id] };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("http://localhost:8080/login");
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDataBase[req.params.shortURL];
  res.redirect(longURL);
});



app.post("/register", (req, res) => {
  if(!req.body.email || !req.body.password) {
    res.sendStatus(400);
  } else if (hasUserEmail(req.body.email)) {
    res.sendStatus(400);
  } else {
    const user_id = generateRandomString();
    usersDB[user_id] = {"id": user_id, "email": req.body.email, "password": req.body.password};
    res.cookie('user_id', user_id);
    res.redirect("http://localhost:8080/urls/");
  }
});

app.post("/login", (req, res) => {
  if (!hasUserEmail(req.body.email)) {
    res.sendStatus(403);
  } else if (!hasUserPassword(req.body.email, req.body.password)) {
    res.sendStatus(403);
  } else {
    res.cookie('user_id', getUser_id(req.body.email));
    res.redirect("http://localhost:8080/urls");
  }
});

app.post("/logout", (req, res) => {
  res.redirect("http://localhost:8080/urls/login");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlsDB[req.cookies.user_id][req.params.id];
  res.redirect("http://localhost:8080/urls/");
});

app.post("/urls/:id", (req, res) => {
  urlDataBase[req.params.id] = req.params.longURL;
  res.redirect("http://localhost:8080/urls/");
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const userURLs = urlsDB[req.cookies.user_id] || {};
  const oldShortURL = getShortURL(req.body.longURL, userURLs);
  if (oldShortURL) {
    delete userURLs[oldShortURL];
    userURLs[shortURL] = req.body.longURL;
  } else {
    userURLs[shortURL] = req.body.longURL;
  }
  urlsDB[req.cookies.user_id] = userURLs;
  res.redirect('http://localhost:8080/urls/' + shortURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
