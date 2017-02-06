/**
 * ClassesController
 *
 * @description :: Server-side logic for managing classes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var db = require('../services/db');

module.exports = {
  /**
   * ClassesController.getRepoClasses()
   */
  index: function (req, res) {
    console.log("Classes: Received get classes request");

    var repo_id = req.param('repo_id');

    db.getClasses(repo_id, function(classes) {
        return res.json(classes);
    });
  }
};

