
var fs = require('fs');

var antlr4 = require('antlr4/index');
var JavaLexer = require('../services/java_parser/JavaLexer');
var JavaParser = require('../services/java_parser/JavaParser');
var JavaListener = require('../services/JavaListener');
var db = require('../services/db');

function Processor(repo_id) {
    this.repo_id = repo_id;
    this.repo = {
        classes: {}
    };
}

Processor.prototype = Object.create(null);
Processor.prototype.constructor = Processor;

Processor.prototype.getGraph = function() {
    return this.graph;
}

Processor.prototype.process = function(abs_path, local_path = '') {
    var self = this;
    var full_path = abs_path + local_path;
    if( fs.existsSync(full_path) ) {
        fs.readdirSync(full_path).forEach(function(file,index){
            var new_local_path = local_path + "/" + file;
            if(fs.lstatSync(abs_path + new_local_path).isDirectory()) {
                // recurse
                self.process(abs_path, new_local_path);
            } else {
                // Parse file
                self.parse(abs_path, local_path, file);
            }
        });
    } else {
        console.log("Processor.process: Path does not exist: " + full_path);
    }
}

Processor.prototype.parse = function(abs_path, local_path, file) {
    var full_path = abs_path + local_path;
    var program = fs.readFileSync(full_path + "/" + file, 'utf8');

    var file_tokens = file.split('.');
    if (file_tokens.length < 2) {
        return;
    }

    if (file_tokens[file_tokens.length - 1].toLowerCase() == 'java') {
        if (!(file_tokens[0] in this.repo.classes)) {
            var chars = new antlr4.InputStream(program);
            var lexer = new JavaLexer.JavaLexer(chars);
            var tokens  = new antlr4.CommonTokenStream(lexer);
            var parser = new JavaParser.JavaParser(tokens);
            parser.buildParseTrees = true;
            var tree = parser.compilationUnit();
            var listener = new JavaListener.JavaListener()
            antlr4.tree.ParseTreeWalker.DEFAULT.walk(listener, tree);

            var methodDeclarations = listener.getMethodDeclarations();
            this.repo.classes[file_tokens[0]] = {
                path: local_path,
                classDeclarations: listener.getClassDeclarations(),
                methodDeclarations: methodDeclarations,
                classReferences: listener.getClassReferences(),
                methodReferences: listener.getMethodReferences(),
            };

            db.createClass(this.repo_id, file_tokens[0], local_path, function(res) {
                for (var method of Object.keys(methodDeclarations)) {
                    db.createMethod(res.uuid, method, methodDeclarations[method]);
                }
            });
        }
    }
}

module.exports = Processor;
