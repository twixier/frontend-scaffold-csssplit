"use strict";

// Requirements
var util = require('gulp-util'),
    log = require('frontend-scaffold-log'),
    through = require('through2'),
    path = require('path'),
    fs = require('fs'),
    sakugawa = require('sakugawa'),
    StringDecoder = require('string_decoder').StringDecoder;

var splitter = function splitter (opts) {
  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }
    if (file.isStream()) {
      return cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }

    if (!file.contents.length) {
      file.path = gutil.replaceExtension(file.path, '.css');
      return cb(null, file);
    }
    
    var options = {
      match: (opts.match ? opts.match : ""), // Specefic filename to match, if there is multiple files comming down stream
      // Where should we save the splits when completed? 
      path: (opts.path ? opts.path : "ie-partials")
    };

    // Check if file.path matches options.match search regex
    if (options.match.length > 0) {
      // Since we have a pattern to search for, try matching it to our file.path
      if(file.path.indexOf(options.match) > -1) {
        // Test: Are there more than 4095 selectors in our stylesheet?
        if(splitter.test(file.path)) {
          splitter.splitFiles(file.path, opts);
        }
      } else {
        // We couldn't match our pattern against file.path
        log({
        "title": "CSS-Split",
        "status": "Notification",
        "message": "Your filepattern didn't match any files in stream. CSS-Split is aborting..."
        });
      }
    } else {
      // We didnt have a pattern to search for, run test on all files comming down stream      
      if(splitter.test(file.path)) {
        splitter.splitFiles(file.path, opts);
      }
    }
 
    return cb();
  });
}

// @function
// Tests a file to see if counted selectors is higher than 4095. If not
// the test fails and nothing will happend.
// @param file - Current file sent down the stream
splitter.test = function (filename) {
  var filecontent = fs.readFileSync(filename, 'utf-8');
    
    var Parker = require('parker'),
      metrics = require('parker/metrics/all'),
      test = new Parker(metrics),
      results = test.run(filecontent.toString());
   
    // Check if total selectors count is higher than 4095
    if(results['total-selectors'] <= 4095) {
      // Log an entry so developer is aware we need a cssplit
      log({
        "title": "CSS-Split",
        "status": "Pending",
        "message": "Your CSS contains more than 4095 selectors, we need to split it up to work properly in ie 9 and ie 8"
      });
     
      return true;
    }
    
    // Total Selectors didn't reach pass 4095 selectors, no need for us to do something
    log({
      "title": "CSS-Split",
      "status": "OK",
      "message": "Your CSS contains " + results['total-selectors'] + " selectors and therefore we don't need to split it!"
    }); 

    return false;
};

// @function
// Split a file into multiple pieces based on how many selectors are found.
// @param file - stylesheet passed down the stream to split up
// @param {Object} opts - Customizable options for function
splitter.splitFiles = function (file, opts) {
  var _self = this,
      arrFileImports = [],
      filecontent = fs.readFileSync(file, 'utf-8'),
      decoder = new StringDecoder('utf-8'),
      css = decoder.write(filecontent),
      extension = file.split('.').pop().toLowerCase(),
      filename = (extension === 'css' ? file.substring(0, file.length - 4) : "");

  // Custom variables used for setting/returning the correct paths used in our plugin
  var basedir = path.dirname(file) + '/' + opts.path;
  
  var pages = sakugawa(css, {
    maxSelectors: 3,
    suffix: '_'
  });

  // Check if ie-partials directory exists, else create it
  if(!fs.existsSync(basedir)) {
    fs.mkdirSync(basedir);
  } 

  pages.forEach(function (page, index) {
    var filename = '/ie_' + (index + 1) + '.css',
        filepath = basedir + filename;
    // add new source map file to stream
    fs.writeFileSync(filepath, page);
    
    arrFileImports.push(opts.path + filename);
  });
  
  splitter.writeImports(arrFileImports);
}

// @function
// Write import directives to an ie file for each browser we need to support
// @param {array} filenames - contains an array of files to be imported for a specific browser
splitter.writeImports = function (filenames) {
  var filecontent = "";
  
  // Contruct import directives for file
  for(var i = 0; filenames.length >= i; i++) {
    if(typeof filenames[i] !== 'undefined') {
      filecontent += '@import url("'+ filenames[i]  +'");\n';
    }
  }
  
  // Write filecontent to an actual file
  fs.writeFileSync('./styles/ie.css', filecontent);
  
  // Apply log message to console
  log({
      "title": "CSS-Split",
      "status": "Complete",
      "message": "Your CSS is now splitted and we have made an ie.css file which contains all import directives."
    });
}

module.exports = splitter;

