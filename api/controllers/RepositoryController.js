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
  index: function (req, res) {
    console.log("Classes: Received get repositories request");

    db.getRepos(function(repos){
      res.json(repos);
    });
  },
  /**
   * RepositoriesController.create()
   */
  create: function (req, res) {
    console.log('createRepo', req.param);
    var owner = req.param('owner'),
        repo_name = req.param('name'),
      branch = req.param('branch');
    let authHeader= req.headers['authorization'];
    let token = authHeader.substring(6,authHeader.length);

    console.log(owner, repo_name, branch);

    var github = new GitHubApi({
        protocol: "https",
        host: "api.github.com", // should be api.github.com for GitHub
        headers: {
            "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent
        },
        followRedirects: false,
        timeout: 5000
    });

    console.log("Repositories: Received create request");

    github.authenticate({
      type: 'token',
      token: token
    });

    github.repos.getBranch({
      owner: owner,
      repo: repo_name,
      branch: branch
    }, function(err, gh_res) {
      if (err) {
        return res.notFound();
      }

      var now = new Date();
      var timeString = now.getTime();

      var output_dir = process.cwd() + '/repos/' + timeString;

      ghdownload({user: owner, repo: repo_name, ref: branch}, output_dir)
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
          db.getRepo(owner, repo_name, branch, function(repo) {
            if (!repo) {
              db.createRepo(owner, repo_name, branch, function(repo) {
                console.log("Creating new repo");
                var processor = new Processor(repo.uuid);
                processor.process(output_dir, '')
                  .then(()=>{
                    return res.json(repo);
                  })
              })
            } else {
              console.log("Repo exists already");
              return res.json(repo);
            }
          })
        });

    });
  }
};
