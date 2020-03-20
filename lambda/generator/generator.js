const fs = require('fs');
const path = require('path');
const serverless = require('serverless-http');
const express = require('express');

const app = express();
const router = express.Router();

const currentDir = process.env.LAMBDA_TASK_ROOT || __dirname;

app.get('/*', (req, res) => {
  const params = req.path.split(/[\/x]+/).filter(i => i);

  fs.readFile(path.join(currentDir, 'photos.json'), 'utf-8', (error, data) => {
    if (error || isNaN(params[0])) return res.redirect('/error');

    const photos = JSON.parse(data);

    let width, height, ratio, options = params[2];

    width = params[0];
    height = width;

    if(!isNaN(params[1])) {
      height = params[1];
    } else {
      options = params[1];
    }

    ratio = width / height;
      
    const grayscale = /[g]/.test(options);
    const young = /[y]/.test(options);
  
    let getPhotoAttempts = 0;
    const getPhoto = () => {
      const chosenPhoto = photos[Math.floor(Math.random() * photos.length)];
      const chosenPhotoRatio = chosenPhoto.width/chosenPhoto.height;

      if (
        (young === true && chosenPhoto.young !== true) ||
        (ratio < 0.75 && chosenPhotoRatio > 1) ||
        (ratio > 1.25 && chosenPhotoRatio < 1)
      ) {
        getPhotoAttempts++;
        return getPhotoAttempts < 10 ? getPhoto() : chosenPhoto
      } else {
        return chosenPhoto;
      }
    }
    const photo = getPhoto();
  
    let filter = grayscale ? '<filter id="filter"><feColorMatrix type="saturate" values="0.10"/></filter>' : '';
    let filterAttribute = grayscale ? ' filter="url(#filter)"' : '';
  
    res.writeHead(200, {'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400'});
    return res.end('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + width + '" height="' + height + '" viewBox="0 0 ' + photo.width + ' ' + photo.height + '" preserveAspectRatio="xMidYMid slice">' + filter + '<image xlink:href="' + photo.data + '" width="' + photo.width + '" height="' + photo.height + '"' + filterAttribute + ' /></svg>');
  });
});

app.use('/.netlify/functions/generator', router);

module.exports = app;
module.exports.handler = serverless(app);
