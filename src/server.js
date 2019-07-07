const path = require('path');
const serverless = require('serverless-http');
const express = require('express');
const app = express();

const router = express.Router();

const photos = require('../dist/photos.json');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/keanus', (req, res) => {
  res.sendFile(path.join(__dirname, 'keanus.html'));
});

app.get('/error', (req, res) => {
  res.sendFile(path.join(__dirname, 'error.html'));
});

app.get('/photos.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'photos.json'));
});

app.get('/equalize.min,css', (req, res) => {
  res.sendFile(path.join(__dirname, 'equalize.min.css'));
});

app.get('/:width/:height?/:options?', (req, res) => {
  // assign parameters from request to a variable
  const params = req.params;

  // assign each parameter into a separate variable
  const width = parseInt(params.width, 10);
  let height = parseInt(params.height, 10);

  // define ratio between requested width and height
  const ratio = width/height;

  // if no options are set, assign an empty string to the variable
  let options = typeof params.options !== 'undefined' ? params.options : '';

  if (typeof height === 'undefined') {
    // if only width is set, set height equal to width to return a square image
    height = width;
  } else if (isNaN(height) === true) {
    // if options are passed to the second parameter in the url, return a
    // square image and assign the options to the correct variable
    height = width;
    options = params.height;
  }

  // if no width or height is set, redirect to home
  if (isNaN(width) === true || isNaN(height) === true) {
    res.redirect(301, 'https://placekeanu.com/error');
    res.end();
  } else {
    // set each variable to true if respective option is present in path
    const grayscale = /[g]/.test(options);
    const young = /[y]/.test(options);

    // get photo from json data
    const getPhoto = () => {
      // choose a random photo
      const chosenPhoto = photos[Math.floor(Math.random() * photos.length)];

      // define ratio between chosen photo's width and height
      const chosenPhotoRatio = chosenPhoto.width/chosenPhoto.height;

      // try again if...
      // * young option is set, but chosen photo is not
      // * photo ratio is too extreme, and chosen photo is not correct rotation
      // otherwise, return the chosen photo
      if ((young === true && chosenPhoto.young !== true) || (ratio < 0.75 && chosenPhotoRatio > 1) || (ratio > 1.25 && chosenPhotoRatio < 1)) {
        return getPhoto();
      } else {
        return chosenPhoto;
      }
    }
    const photo = getPhoto();

    // if grayscale option is set, add a filter inside the svg
    // and a filter attribute on the image
    let filter = '';
    let filterAttribute = '';
    if (grayscale === true) {
      filter = '<filter id="filter"><feColorMatrix type="saturate" values="0.10"/></filter>';
      filterAttribute = ' filter="url(#filter)"';
    }

    // set custom headers to tell the client we're sending an svg, and enable
    // caching of the image
    res.writeHead(200, {'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400'});

    // end the response process by sending the requested svg
    res.end('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + width + '" height="' + height + '" viewBox="0 0 ' + photo.width + ' ' + photo.height + '" preserveAspectRatio="xMidYMid slice">' + filter + '<image xlink:href="' + photo.data + '" width="' + photo.width + '" height="' + photo.height + '"' + filterAttribute + ' /></svg>');
  }
});

app.use('/.netlify/functions/server', router);

module.exports = app;
module.exports.handler = serverless(app);
