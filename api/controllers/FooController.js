/**
 * FooController
 *
 * @description :: Server-side logic for managing foos
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var GitHubApi = require("github");
var ghdownload = require('github-download');
var fs = require('fs');
var Processor = require('../services/Processor');

module.exports = {
  /**
   * CommentController.create()
   */
  test: function (req, res) {
    // console.log(req);

    console.log("Received create request");
    // console.log(esprima.tokenize()):

    var now = new Date();
    var timeString = now.getTime();

    var deleteFolderRecursive = function(path) {
        if( fs.existsSync(path) ) {
            fs.readdirSync(path).forEach(function(file,index){
                var curPath = path + "/" + file;
                if(fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        } else {
            console.log("Path does not exist: " + path);
        }
    };

    ghdownload({user: 'CodeEtch', repo: 'backend', ref: 'master'}, process.cwd() + "/" + timeString)
    .on('error', function(err) {
        console.error(err)
    })
    .on('end', function() {
        // Should call our parser function
        var processor = new Processor();
        processor.process(timeString);
        deleteFolderRecursive(process.cwd() + "/" + timeString);
    });

    return res.json({
        status: "Processing"
    });
  },
  parse: function (req, res) {
    var processor = new Processor();
    processor.process("test");

    return res.json(processor.getGraph());
    return res.json({
        test: "Nothing yet"
    });
  }
};
