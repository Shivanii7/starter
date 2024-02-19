const path = require("path");
/*
 * Project: Milestone 1
 * File Name: main.js
 * Description: BCITstragram Lab
 *
 * Created Date: Feb 18, 2024
 * Author: Shivani
 *
 */

const IOhandler = require("./IOhandler");
const zipFilePath = path.join(__dirname, "myfile.zip");
const pathUnzipped = path.join(__dirname, "unzipped");
const pathProcessed = path.join(__dirname, "grayscaled");
const pathProcessed2 = path.join(__dirname, "sepea");
const readline = require('readline');
const { runWorker } = require('./worker');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

IOhandler.unzip(zipFilePath, pathUnzipped)
.then(() => IOhandler.readDir(pathUnzipped))
.then((imgs) => {
  rl.question("Which filter do you want to apply? (gray/sepea): ", (answer) => {
    if (answer === "gray") {
      IOhandler.processImageGrayScale(imgs, pathProcessed);
    } else if (answer === "sepea") {
      IOhandler.processImageSepeaFilter(imgs, pathProcessed2);
    } else {
      console.log('Invalid filter selection.');
    }
    console.log("The filter has been successfully applied.");
    rl.close();
  });})
.catch(err => console.log(err));
