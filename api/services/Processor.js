
var fs = require('fs');

var antlr4 = require('antlr4/index');
var JavaLexer = require('../services/java_parser/JavaLexer');
var JavaParser = require('../services/java_parser/JavaParser');
var JavaListener = require('../services/JavaListener');
var db = require('../services/db');

function Processor(repo_id) {
    this.repo_id = repo_id;
    this.repo = {
        files: {}
    };
    this.classes = {};
    this.methods = {};
    this.classReferences = {};
    this.fileCount = 0;
}

Processor.prototype = Object.create(null);
Processor.prototype.constructor = Processor;

Processor.prototype.getGraph = function() {
    return this.graph;
}

Processor.prototype.process = function(abs_path, local_path = '') {
    this.fileCount = 0;
    this.countFiles(abs_path, local_path);
    this.processHelper(abs_path, local_path).then(function() {
    });
}

Processor.prototype.countFiles = function(abs_path, local_path = '') {
    var self = this;
    var full_path = abs_path + local_path;
    if( fs.existsSync(full_path) ) {
        fs.readdirSync(full_path).forEach(function(file,index){
            var new_local_path = local_path + "/" + file;
            if(fs.lstatSync(abs_path + new_local_path).isDirectory()) {
                // recurse
                self.countFiles(abs_path, new_local_path);
            } else {
                if (self.isValidFile(file)) {
                    self.fileCount++;
                }
            }
        });
    } else {
        console.log("Processor.countFiles: Path does not exist: " + full_path);
    }
}

Processor.prototype.processHelper = function(abs_path, local_path = '') {
    var self = this;
    return new Promise(function(success, failure) {
        var full_path = abs_path + local_path;
        if( fs.existsSync(full_path) ) {
            fs.readdirSync(full_path).forEach(function(file,index){
                var new_local_path = local_path + "/" + file;
                if(fs.lstatSync(abs_path + new_local_path).isDirectory()) {
                    // recurse
                    self.processHelper(abs_path, new_local_path);
                } else {
                    // Parse file
                    self.parse(abs_path, local_path, file).then(function() {
                        console.log("Files remaining: " + self.fileCount);
                        self.fileCount--;
                        if (self.fileCount == 0) {
                            self.fileCount = -1;
                            success();
                            self.buildClassReferences();
                            return;
                        }
                    });
                }
            });
        } else {
            console.log("Processor.process: Path does not exist: " + full_path);
        }
    });
}

Processor.prototype.isValidFile = function(file) {
    var file_tokens = file.split('.');
    if (file_tokens.length < 2) {
        return false;
    }

    if (file_tokens[file_tokens.length - 1].toLowerCase() == 'java') {
        return true;
    }
    return false;
}

Processor.prototype.parse = function(abs_path, local_path, file) {
    var self = this;
    return new Promise(function(success, fail) {
        var full_path = abs_path + local_path;
        var program = fs.readFileSync(full_path + "/" + file, 'utf8');

        var file_tokens = file.split('.');
        if (file_tokens.length < 2) {
            return;
        }

        if (file_tokens[file_tokens.length - 1].toLowerCase() == 'java') {
            if (!(file_tokens[0] in self.repo.files)) {
                var chars = new antlr4.InputStream(program);
                var lexer = new JavaLexer.JavaLexer(chars);
                var tokens  = new antlr4.CommonTokenStream(lexer);
                var parser = new JavaParser.JavaParser(tokens);
                parser.buildParseTrees = true;
                var tree = parser.compilationUnit();
                var listener = new JavaListener.JavaListener()
                antlr4.tree.ParseTreeWalker.DEFAULT.walk(listener, tree);

                var methodDeclarations = listener.getMethodDeclarations();
                var class_name = listener.getClassName();
                var classReferences = listener.getClassReferences();
                for (var className of Object.keys(classReferences)) {
                    self.classReferences[className] = classReferences[className];
                }
                self.repo.files[file_tokens[0]] = {
                    path: local_path,
                    methodDeclarations: methodDeclarations,
                    className: class_name,
                    methodReferences: listener.getMethodReferences(),
                };

                db.createClass(self.repo_id, class_name, local_path, file_tokens[0], function(res) {
                    self.classes[res.name] = res.uuid;
                    var counter = 0;
                    for (var method of Object.keys(methodDeclarations)) {
                        db.createMethod(res.uuid, method, methodDeclarations[method], function(res) {
                            console.log(res.name);
                            self.methods[res.name] = res.uuid;
                            counter += 1;
                            if (counter == Object.keys(methodDeclarations).length) {
                                console.log("All methods accounted for")
                                counter += 1;
                                success();
                            }
                        });
                    }
                });
            }
        }
    });
}

Processor.prototype.buildClassReferences = function() {
    console.log("Processor: Building class references");
    console.log(this.classReferences);
    for (var reference of Object.keys(this.classReferences)) {
        console.log(reference);
        console.log(this.methods);
        if (reference in this.methods) {
            for (var className of this.classReferences[reference]) {
                console.log(className);
                if (className in this.classes) {
                    db.createClassRef(
                        this.methods[reference], 
                        this.classes[this.classReferences[reference]],
                        className);
                }
            }
        } else {
            console.log(reference + " not in this.methods");
        }
    }
}
module.exports = Processor;
