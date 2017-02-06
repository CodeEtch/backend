/**
 * Created by harryliu on 2/6/17.
 */
/**
 * MethodsController
 *
 * @description :: Server-side logic for managing reference
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  /**
   * RefControlller.index()
   */
  index: function (req, res) {
    console.log("Methods: Received get classrefs request");

    var method_id = req.param('method_id');

    db.getClassRefs(method_id, function(refs) {
      return res.json(refs);
    });
  }
};
