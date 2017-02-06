/**
 * MethodsController
 *
 * @description :: Server-side logic for managing methods
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  /**
   * MethodsController.getClassMethods()
   */
  index: function (req, res) {
    console.log("Classes: Received get class methods request");

    var class_id = req.param('class_id');

    db.getMethods(class_id, function(methods) {
      return res.json(methods);
    });
  }
};

