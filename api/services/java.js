
var java_parser = require('java-parser');

var FieldDeclarationHandler = function(field) {
    var references = []

    references.push({
        name: field.type.name.identifier
    });

    return references;
}

var MethodDeclarationHandler = function(method) {
    var references = []
    if (method.body) {
        for (var statement of method.body.statements) {
            references.push({
                // name:statement.expression.name.identifier
            })
        }
    }

    return references;
}

var declarationHandlers = {
    FieldDeclaration: FieldDeclarationHandler,
    MethodDeclaration: MethodDeclarationHandler
};

module.exports = {
    parse: function(program_text) {
        var syntax  = java_parser.parse(program_text);
        var types = [];

        for (var type of syntax.types) {
            var declarations = [];
            var references = [];

            for (var declaration of type.bodyDeclarations) {
                functions.push({
                    name: declaration.name,
                    references: declarationHandlers[declaration.node](declaration)
                })

            }
            types.push({
                name:type.name,
                functions:functions

            })
        }
        return types;
    }
}
