/**
 * FooController
 *
 * @description :: Server-side logic for managing foos
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var GitHubApi = require("github");
var java_parser = require("java-parser");
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

    ghdownload({user: 'CodeEtch', repo: 'backend', ref: 'master'}, process.cwd() + "/" + timeString)
    .on('error', function(err) {
        console.error(err)
    })
    .on('end', function() {
        // Should call our parser function
        deleteFolderRecursive(process.cwd() + "/" + timeString);
    });

    console.log(process.cwd());

    return res.json({
        desc: "Testing function"
    });
  },
  parse: function (req, res) {

    var file = fs.readFileSync('test.java', 'utf8');
    var syntax  = java_parser.parse(file);
    var types = [];
    for (var type of syntax.types) {
      var functions = [];

      for (var declaration of type.bodyDeclarations) {
        var references = []

        for (var statement of declaration.body.statements) {
          references.push({
            name:statement.expression.name.identifier
          })
        }

        functions.push({
          name:declaration.name,
          references:references
        })

      }
      types.push({
        name:type.name,
        functions:functions

      })
    }


    return res.json(types);

  }
};

