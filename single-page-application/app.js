'use strict';

require('dotenv').config(); // read .env files
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const multer = require('multer');
const upload = multer();

// used for authentication functionality
app.use(cookieParser('secret'));

// for parsing application/json
app.use(express.json());

// for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// for parsing multipart/form-data
app.use(upload.array());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((err, req, res, next) => {
  // body-parser will set this to 400 if the json is in error
  if (err.status === 400) {
    return res.status(err.status).json({ message: 'Request is not valid JSON' });
  }
  return next(err); // if it's not a 400, let the default error handling do it.
});

// Allows us to easily read JSON files
function jsonReader (filePath, cb) {
  fs.readFile(filePath, (err, fileData) => {
    if (err) {
      return cb && cb(err);
    }
    try {
      const object = JSON.parse(fileData);
      return cb && cb(null, object);
    } catch (err) {
      return cb && cb(err);
    }
  });
}

// Used to check if a given email is a valid email address
function validateEmail (email) {
  var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

//  POST authenticate method - checks the given credentials match credentials
//  stored in JSON and logs the user in if so
app.post('/api/auth', function (req, res) {
  jsonReader('accounts.json', (err, credentials) => {
    if (err) {
      console.log('Error reading file:', err);
      res.status(500).json(
        { message: 'An error has occurred. Please try again.' });
    } else if (validateEmail(req.body.email_address) !== true) {
      res.status(422).json(
        { message: 'A valid email address must be provided' });
    } else if (!req.body.password) {
      res.status(422).json(
        { message: 'Password cannot be empty' });
    } else {
      var authenticated = false;
      var account;
      for (account in credentials.accounts) {
        if ((req.body.email_address ===
          credentials.accounts[account].email_address) &&
          (req.body.password === credentials.accounts[account].password)) {
          authenticated = true;
          res.cookie('email_address', req.body.email_address,
            { maxAge: 900000, signed: true, httpOnly: true });
          res.status(200).json({ message: 'Successfully logged in' });
          break;
        }
      }
      if (authenticated === false) {
        res.status(401).json({ message: 'Those credentials are incorrect' });
      }
    }
  });
});

//  POST method to register new account
app.post('/api/newaccount', function (req, res) {
  jsonReader('accounts.json', (err, credentials) => {
    if (err) {
      console.log('Error reading file:', err);
      res.status(500).json(
        { message: 'An error has occurred. Please try again.' });
    } else if (validateEmail(req.body.email_address) !== true) {
      res.status(422).json(
        { message: 'A valid email address must be provided' });
    } else if (!req.body.password) {
      res.status(422).json(
        { message: 'Password cannot be empty' });
    } else {
      // check to ensure the new email address isn't already in use
      var emailTaken;
      var acc;
      for (acc in credentials.accounts) {
        if (req.body.email_address ===
          credentials.accounts[acc].email_address) {
          emailTaken = true;
          res.status(409).json(
            { message: 'That email address is already in use' });
          break;
        }
      }
      // add new account credentials to JSON file
      if (emailTaken !== true) {
        credentials.accounts.push(req.body);
        fs.writeFile('accounts.json',
          JSON.stringify(credentials), (err) => {
            if (err) console.log('Error writing file:', err);
          });
        res.cookie('email_address', req.body.email_address,
          { maxAge: 900000, signed: true, httpOnly: true });
        res.status(200).json({ message: 'Account successfully registered' });
        res.end();
      }
    }
  });
});

// Testing POST method to delete test account (used for deleting
// test user after registering them for testing purposes)
app.post('/api/deleteTestAccount', function (req, res) {
  jsonReader('accounts.json', (err, credentials) => {
    if (err) {
      console.log('Error reading file:', err);
      res.status(500).json(
        { message: 'An error has occurred. Please try again.' });
    } else {
      // delete the specific test user that we registered
      for (var i = 0; i < credentials.accounts.length; i++) {
        if (credentials.accounts[i].email_address === 'test098@testing345test.com') {
          credentials.accounts.splice(i, 1);
        }
      }
        fs.writeFile('accounts.json',
          JSON.stringify(credentials), (err) => {
            if (err) console.log('Error writing file:', err);
          });
        res.status(200).json({ message: 'Account successfully deleted' });
        res.end();
    }
  });
});

// Check whether user is authenticated method
app.get('/api/checkperms', function (req, res) {
  if (validateEmail(req.signedCookies.email_address) === true) {
    res.status(200).json({ message: 'authenticated' });
  } else {
    res.status(200).json({ message: 'unauthenticated' });
  }
});

// Logout method
app.get('/api/logout', function (req, res) {
  res.clearCookie('email_address');
  res.redirect('/');
});

//  GET method to retrieve all images, also used to
//  retrieve the users in the contributors page as
//  the users are stored against the images that they upload
app.get('/api/getImageSources', function (req, res) {
  fs.readFile('images.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.log('Error reading file from disk:', err);
      res.status(500).json(
        { message: 'An error has occurred. Please try again.' });
    }
    try {
      res.status(200).json(jsonString);
    } catch (err) {
      console.log('Error parsing JSON string:', err);
      res.status(500).json(
        { message: 'An error has occurred. Please try again.' });
    }
  });
});

// GET method to return users who have uploaded photos, along
// with the no. photos they have uploaded and sort the users
// accordingly
app.get('/api/getUserLeaderboard', function (req, res) {
  fs.readFile('images.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.log('Error reading file from disk:', err);
      res.status(500).json(
        { message: 'An error has occurred. Please try again.' });
    }
    try {
      var results = JSON.parse(jsonString);
      var trackingArray = {};
      var result;
      for (result in results.images) {
        if (results.images[result].user in trackingArray) {
          trackingArray[results.images[result].user]++;
        } else {
          trackingArray[results.images[result].user] = 1;
        }
      }
      // need to get users in order of how many photos they've uploaded
      var sortable = [];
      for (var el in trackingArray) {
        sortable.push([el, trackingArray[el]]);
      }
      sortable.sort(function (a, b) {
        return a[1] - b[1];
      });
      res.status(200).json(sortable);
    } catch (err) {
      console.log('Error parsing JSON string:', err);
      res.status(500).json(
        { message: 'An error has occurred. Please try again.' });
    }
  });
});

// POST method to add a new image
app.post('/api/uploadPhoto', function (req, res) {
  jsonReader('images.json', (err, imageDetails) => {
    if (err) {
      console.log('Error reading file:', err);
      res.status(500).json(
        { message: 'An error has occurred. Please try again.' });
    } else if (!req.body.source_link) {
      res.status(422).json(
        { message: 'Image source link cannot be empty' });
    } else if (!req.body.caption) {
      res.status(422).json(
        { message: 'Caption cannot be empty' });
    } else if (validateEmail(req.signedCookies.email_address) !== true) {
      res.status(403).json(
        { message: 'There is no valid cookie to determine authenticity' });
    } else {
          var data = {
            source: req.body.source_link,
            user: req.signedCookies.email_address,
            caption: req.body.caption
          };
          //  add new image details to JSON file
          imageDetails.images.push(data);
          fs.writeFile('images.json', JSON.stringify(imageDetails), (err) => {
            if (err) console.log('Error writing file:', err);
          });
          res.status(200).json({ message: 'Image successfully uploaded' });
          res.end();
        }
  });
});

// GET method to return comments - either for a specific image
// or if no parameter is specified, all comments are returned
app.get('/api/getComments', function (req, res) {
  fs.readFile('comments.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.log('Error reading file from disk:', err);
      res.status(500).json(
        { results: 'An error has occurred. Please try again.' });
    }
    var source = req.query.source;
    try {
      if (source) {
        var comments = JSON.parse(jsonString)[source];
        if (comments) {
          res.status(200).json({ results: comments });
        } else {
          res.status(200).json({ results: 'No comments have been submitted for this photo yet.' });
        }
      } else {
        res.status(200).json({ results: jsonString });
      }
    } catch (err) {
      console.log('Error parsing JSON string:', err);
      res.status(500).json(
        { results: 'An error has occurred. Please try again.' });
    }
  });
});

// POST method to add a new comment
app.post('/api/submitComment', function (req, res) {
  jsonReader('comments.json', (err, commDetails) => {
    if (err) {
      console.log('Error reading file:', err);
      res.status(500).json(
        { message: 'An error has occurred. Please try again.' });
    } else if (!req.body.source_link) {
      res.status(422).json(
        { message: 'Image source link cannot be empty' });
    } else if (!req.body.comment) {
      res.status(422).json(
        { message: 'Comment cannot be empty' });
    } else if (validateEmail(req.signedCookies.email_address) !== true) {
      res.status(403).json(
        { message: 'There is no valid cookie to determine authenticity' });
    } else {
      var src = decodeURIComponent(req.body.source_link);
      var data = {
        email_address: req.signedCookies.email_address,
        comment: req.body.comment
      };
      if (typeof commDetails[src] === 'undefined') {
        commDetails[src] = [];
        commDetails[src].push(data);
      } else {
        commDetails[src].push(data);
      }
      //  add new comment to JSON file
      fs.writeFile('comments.json',
        JSON.stringify(commDetails), (err) => {
          if (err) console.log('Error writing file:', err);
        });
      res.status(200).json({ messsage: 'Comment successfully uploaded' });
    }
  });
});

// Set public folder as root
app.use(express.static('public'));

// Allow front-end access to node_modules folder
app.use('/scripts', express.static(`${__dirname}/node_modules/`));

// Redirect all traffic to index.html
app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));

module.exports = app;
