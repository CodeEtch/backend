/**
 * FooController
 *
 * @description :: Server-side logic for managing foos
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var GitHubApi = require("github");
var esprima = require("esprima");
var ghdownload = require('github-download');
var exec = require('exec');

module.exports = {
  /**
   * CommentController.create()
   */
  test: function (req, res) {
    // console.log(req);

    console.log("Received create request");
    // console.log(esprima.tokenize()):
    
    ghdownload({user: 'jprichardson', repo: 'node-batchflow', ref: 'master'}, process.cwd())
    .on('dir', function(dir) {
        console.log(dir)
    })
    .on('file', function(file) {
        console.log(file)
    })
    .on('zip', function(zipUrl) { //only emitted if Github API limit is reached and the zip file is downloaded
        console.log(zipUrl)
    })
    .on('error', function(err) {
        console.error(err)
    })
    .on('end', function() {
        exec('tree', function(err, stdout, sderr) {
            console.log(stdout)
        })
    })
    return res.json({
      todo: 'Not implemented yet!'
    });
  }
};

