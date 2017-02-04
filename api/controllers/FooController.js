/**
 * FooController
 *
 * @description :: Server-side logic for managing foos
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var GitHubApi = require("github");

module.exports = {
  /**
   * CommentController.create()
   */
  create: function (req, res) {

    var github = new GitHubApi({
        // optional
        debug: true,
        protocol: "https",
        host: "api.github.com", // should be api.github.com for GitHub
        pathPrefix: "", // for some GHEs; none for GitHub
        headers: {
            "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent
        },
        // Promise: require('bluebird'),
        followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
        timeout: 5000
    });

    // TODO: optional authentication here depending on desired endpoints. See below in README.

    var test_val = 0;

    github.users.getFollowingForUser({
        // optional
        // headers: {
        //     "cookie": "blahblah"
        // },
        username: "magellantoo"
    }, function(err, res) {
        console.log(JSON.stringify(res));
    });

    return res.json({
      todo: 'Not implemented yet!'
    });
  },

  /**
   * CommentController.destroy()
   */
  destroy: function (req, res) {
    return res.json({
      todo: 'Not implemented yet!'
    });
  },

  /**
   * CommentController.tag()
   */
  tag: function (req, res) {
    return res.json({
      todo: 'Not implemented yet!'
    });
  },

  /**
   * CommentController.like()
   */
  like: function (req, res) {
    return res.json({
      todo: 'Not implemented yet!'
    });
  }
};

