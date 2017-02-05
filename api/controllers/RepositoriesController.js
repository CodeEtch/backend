/**
 * RepositoriesController
 *
 * @description :: Server-side logic for managing repositories
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var GitHubApi = require("github");
var ghdownload = require('github-download');
var fs = require('fs');
var Processor = require('../services/Processor');

var db = require('../services/db');

module.exports = {
  /**
   * RepositoriesController.create()
   */
  create: function (req, res) {
    var owner = req.param('owner'),
        repo_name = req.param('repo'),
        ref = req.param('branch');

    console.log("Repositories: Received create request");

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

    var output_dir = process.cwd() + "/" + timeString;

    ghdownload({user: owner, repo: repo_name, ref: ref}, output_dir)
    .on('dir', function(dir) {
        console.log(dir);
    })
    .on('file', function(file) {
    console.log(file)
    })
    .on('zip', function(zipUrl) { //only emitted if Github API limit is reached and the zip file is downloaded
        console.log("Received zip: " + zipUrl);
    })
    .on('error', function(err) {
        console.log("Error downloading repository");
        console.error(err);
        return res.json({
            status: "error",
            description: "Problem downloading repository"
        })
    })
    .on('end', function() {
        // If repo already exists, do not parse
        db.getRepo(owner, repo_name, ref, function(repo) {
            console.log(repo);
            if (!repo) {
                db.createRepo(owner, repo_name, ref, function(repo) {
                    console.log("Creating new repo");
                    var processor = new Processor(repo.uuid);
                    processor.process(output_dir);
                    deleteFolderRecursive(output_dir);
                    return res.json(repo);
                })
            } else {
                console.log("Repo exists already");
                return res.json(repo);
            }
        })
    });
  }
};

