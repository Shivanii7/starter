/*
 * Project: Milestone 1
 * File Name: IOhandler.js
 * Description: Collection of functions for files input/output related operations
 *
 * Created Date:
 * Author:
 *
 */
const yauzl = require('yauzl-promise');
const fs = require("fs");
const PNG = require("pngjs").PNG;
const  path = require("path");
const {pipeline} = require('stream/promises');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');

/**
 * Description: decompress file from given pathIn, write to given pathOut
 *
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {promise}
 */

const unzip = async (pathIn, pathOut) => {
  const zip = await yauzl.open(pathIn); // Opens the zip file
  try {
    for await (const entry of zip) { // iterate over each entry in the zip file
      if (entry.filename.endsWith('/')) { // checks if the entry is a directory
        await fs.promises.mkdir(`${pathOut}/${entry.filename}`); // created the directory
      } else { // if the entry is file
        const readStream = await entry.openReadStream(); // open a read stream for the file
        const writeStream = fs.createWriteStream( // create a write stream to oputput the file
          `${pathOut}/${entry.filename}`);
        await pipeline(readStream, writeStream); // pipe readstream to writestream
        
      }
    }
  } finally { 
      await zip.close(); // close the zip file 
  }
  console.log("Extraction operation complete");
};


/**
 * Description: read all the png files from given directory and return Promise containing array of each png file path
 *
 * @param {string} path
 * @return {promise}
 */
const readDir = (dir) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        reject (err)
      } else {
        const pngFiles = files.filter(file => {return path.extname(file).toLowerCase() === ".png";}); // png files is an array containing all PNG files
        const imgs = pngFiles.map(file => path.join(dir, file)); // map iterates over each file and takes each file from the png files and joins it with the dir path using path.join
        //console.log(imgs)
        resolve(imgs);
      }
    })
  })
};

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */



const processImageGrayScale  = (pathIn, pathOut) => {
  pathIn.forEach(path => {
    fs.createReadStream(path) // read stream
        .pipe(new PNG({ // transform stream
          filterType: 4,}) )
        .on("parsed", function () {
          for (var y = 0; y < this.height; y++) {  // this is basically a dictionary containing height, width, data (very large buffer that contains all the pixels) and other important information.
          // above line of code iterates over each row of pixels
            for (var x = 0; x < this.width; x++) { // iterates over each row of pixels
              var idx = (this.width * y + x) << 2; // this.data is a really big array of data. It calculates the index of the current pixel in the data array.
              var gray = (this.data[idx] + this.data[idx + 1] + this.data[idx + 2]) / 3; // calculate the average of red, green and blue components to get the grayscale value.
              this.data[idx] = gray; // red component
              this.data[idx + 1] = gray; // green component
              this.data[idx + 2] = gray; // blue component
        }
      }
          const outputPath = pathOut + '\\' + path.split('\\').pop();
          //console.log(outputPath);
          if (!fs.existsSync(pathOut)) {
            fs.mkdirSync(pathOut, { recursive: true });
          }
          this.pack().pipe(fs.createWriteStream(outputPath)) // now, we are done modifying the container, this code is gonna pack to a new png creater and write is out to the destination. 
          //console.log("Images converted to grayscale");
          
    });    
  });      
};


const processImageSepeaFilter  = (pathIn, pathOut) => {
  pathIn.forEach(path => {
    fs.createReadStream(path) 
        .pipe(new PNG({ 
          filterType: 4,}) )
        .on("parsed", function () {
          for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
              var idx = (this.width * y + x) << 2;
              let r = this.data[idx];
              let g = this.data[idx + 1];
              let b = this.data[idx + 2];
              this.data[idx] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
              this.data[idx + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
              this.data[idx + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
            }
          }
          const outputPath = pathOut + '\\' + path.split('\\').pop();
          if (!fs.existsSync(pathOut)) {
            fs.mkdirSync(pathOut, { recursive: true });
          }
          this.pack().pipe(fs.createWriteStream(outputPath)) 
          
    });    
  });      
};
  

if (!isMainThread) {
  const { pathIn, pathOut, filterType } = workerData;
  if (filterType === 'grayScale') {
      processImageGrayScale(pathIn, pathOut);
  } else if (filterType === 'sepeaFilter') {
      processImageSepeaFilter(pathIn, pathOut);
  }
}


module.exports = {
  unzip,
  readDir,
  processImageGrayScale,
  processImageSepeaFilter
};