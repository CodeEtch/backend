/**
 * FooController
 *
 * @description :: Server-side logic for managing foos
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var GitHubApi = require("github");
var ghdownload = require('github-download');
var fs = require('fs');

var java_parser = require('../services/java');
var antlr4 = require('antlr4/index');
var JavaLexer = require('../services/JavaLexer');
var JavaParser = require('../services/JavaParser');
var JavaListener = require('../services/JavaListener');

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

    var program = fs.readFileSync('test/main/main.java', 'utf8');
    console.log(program);

    var chars = new antlr4.InputStream(program);
    var lexer = new JavaLexer.JavaLexer(chars);
    var tokens  = new antlr4.CommonTokenStream(lexer);
    var parser = new JavaParser.JavaParser(tokens);
    parser.buildParseTrees = true;
    var tree = parser.compilationUnit();
    // var tree = parser.parse();
    var listener = new JavaListener.JavaListener()
    ////////////////// console.log(tree);
    antlr4.tree.ParseTreeWalker.DEFAULT.walk(listener, tree);

 /////////////////////

    return res.json({
        test: "Nothing yet"
    });
    // return res.json(java_parser.parse(program));

  }
};

