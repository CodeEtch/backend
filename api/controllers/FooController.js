/**
 * FooController
 *
 * @description :: Server-side logic for managing foos
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var GitHubApi = require("github");
var esprima = require("esprima");
var ghdownload = require('github-download');
var fs = require('fs');

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
            var curPath = path + "\\" + file;
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

    ghdownload({user: 'jprichardson', repo: 'node-batchflow', ref: 'master'}, process.cwd() + "/" + timeString)
    .on('error', function(err) {
        console.error(err)
    })
    .on('end', function() {
        // Should call our parser function
        deleteFolderRecursive(process.cwd() + "\\" + timeString);
    });

    console.log(process.cwd());

    return res.json({
        desc: "Testing function"
    });
  }
};

