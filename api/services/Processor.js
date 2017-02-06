
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

Processor.prototype.process = function(abs_path, local_path) {
    this.fileCount = 0;
    this.countFiles(abs_path, local_path);
    this.processHelper(abs_path, local_path).then(function() {
    });
}

Processor.prototype.countFiles = function(abs_path, local_path) {
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

Processor.prototype.processHelper = function(abs_path, local_path) {
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
                        self.fileCount--;
                        if (self.fileCount < 10) {
                            console.log("Files remaining: " + self.fileCount);
                        }
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
            console.log("Processer.parse: File extension missing: " + file);
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
                var parsed_method_refs = listener.getClassReferences();
                var methodParams = listener.getMethodParams();

                var parsed_method_ref_keys = Object.keys(parsed_method_refs).filter(function(element) {
                    return parsed_method_refs[element].length != 0;
                });

                for (var i = 0; i < parsed_method_ref_keys.length; i++) {
                    if (!(parsed_method_ref_keys[i] in self.classReferences)) {
                        self.classReferences[parsed_method_ref_keys[i]] = {};
                    }
                    if(self.classReferences[parsed_method_ref_keys[i]].constructor != Object){
                        self.classReferences[parsed_method_ref_keys[i]] = {};
                    }
                    self.classReferences[parsed_method_ref_keys[i]][class_name] = parsed_method_refs[parsed_method_ref_keys[i]];
                }

                self.repo.files[file_tokens[0]] = {
                    path: local_path,
                    methodDeclarations: methodDeclarations,
                    className: class_name,
                    methodReferences: listener.getMethodReferences(),
                };

                db.createClass(self.repo_id, class_name, local_path, file_tokens[0], function(class_res) {
                    self.classes[class_res.name] = class_res.uuid;
                    var counter = 0;

                    if (Object.keys(methodDeclarations).length == 0) {
                        success();
                    }
                    for (var method of Object.keys(methodDeclarations)) {
                        db.createMethod(class_res.uuid, method, methodDeclarations[method], function(method_res) {
                            if (!(method_res.name in self.methods)) {
                                self.methods[method_res.name] = {};
                            }
                            if(self.methods[method_res.name].constructor != Object){
                                self.methods[method_res.name] = {};
                            }
                            self.methods[method_res.name][class_res.name] = method_res.uuid;

                            for (var param of methodParams[method_res.name]) {
                                // db.createMethodParam(res.uuid, param);
                            }

                            counter += 1;
                            if (counter == Object.keys(methodDeclarations).length) {
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

    var reference_methods = Object.keys(this.classReferences);
    // Every reference
    for (var method_name of reference_methods) {
        for (var src_class_name of Object.keys(this.classReferences[method_name])) {
            for (var dst_class_name of this.classReferences[method_name][src_class_name]) {
                if (dst_class_name in this.classes) {
                    db.createClassRef(
                        this.methods[method_name][src_class_name],
                        this.classes[dst_class_name],
                        method_name,
                        dst_class_name);
                }
            }
        }
    }
    // for (var i = 0; i < reference_methods.length; i++) {
    //     if (!(reference_methods[i] in Object.keys(this.methods))) {
    //         for (var class_name of Object.keys(this.methods[reference_methods[i]])) {
    //             console.log("Relationship found");
    //             console.log(this.classes[class_name]);
    //             console.log()
                // for (var class_name of this.classReferences[method]) {
                //     console.log(class_name);
                //     if (className in this.classes) {
                //         console.log(reference);
                //         db.createClassRef(
                //             method,
                //             this.classes[this.classReferences[reference]],
                //             className);
                //     }
                // }
        /*
        if (reference in Object.keys(this.methods)) {
            console.log(reference);
            console.log(Object.keys(this.methods[reference]));
            for (var method of Object.keys(this.methods[reference])) {
                console.log(method);
                console.log(this.classReferences[method]);
                for (var class_name of this.classReferences[method]) {
                    console.log(class_name);
                    if (className in this.classes) {
                        console.log(reference);
                        db.createClassRef(
                            method,
                            this.classes[this.classReferences[reference]],
                            className);
                    }
                }
            }
        }
    }*/
    console.log("Done building class references");
}
module.exports = Processor;
