/**
 * ClassesController
 *
 * @description :: Server-side logic for managing classes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var db = require('../services/db');

module.exports = {
  /**
   * ClassesController.getClasses()
   */
  getClasses: function (req, res) {
    console.log("Classes: Received get classes request");

    var owner = req.param('owner'),
        repo_name = req.param('repo'),
        ref = req.param('branch');

    db.getRepo(owner, repo_name, ref, function(repo) {
        if (!repo) {
            return res.notFound();
        } else {
            db.getClasses(repo.uuid, function(classes) {
                return res.json(classes);
            });
        }
    });
  },
  /**
   * ClassesController.getRepoClasses()
   */
  getRepoClasses: function (req, res) {
    console.log("Classes: Received get classes request");

    var repo_id = req.param('repo_id');
    
    db.getClasses(repo_id, function(classes) {
        return res.json(classes);
    });
  },

  /**
   * ClassesController.getClassMethods()
   */
  getClassMethods: function (req, res) {
    console.log("Classes: Received get class methods request");

    var class_id = req.param('class_id');

    db.getMethods(class_id, function(methods) {
        return res.json(methods);
    });
  }

	
};

