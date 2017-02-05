/**
 * MethodsController
 *
 * @description :: Server-side logic for managing methods
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  /**
   * MethodsController.getClassReferences()
   */
  getClassReferences: function (req, res) {
    console.log("Methods: Received get classrefs request");

    var method_id = req.param('method_id');
    
    db.getClassRefs(method_id, function(refs) {
        return res.json(refs);
    });
  },
};

