
var Sequelize = require("sequelize");

// Initialize database connection info
let dbUsername = process.env.DB_USER,
    dbPassword = process.env.DB_PASS,
    dbHost = process.env.DB_HOST,
    dbPort = process.env.DB_PORT,
    dbName = process.env.DB_NAME;

function init() {
    console.log("Initializing Database");
    sequelize = new Sequelize(dbName, dbUsername, dbPassword, {
        host: dbHost,
        dialect: 'postgres',
        pool: {
            max: 5,
            min: 0,
            idle: 10000
        }
    });

    sequelize.authenticate()
    .then(function(err) {
        console.log('Connection has been established successfully.');
    })
    .catch(function (err) {
        console.log('Unable to connect to the database:', err);
    });

    dbRepo = sequelize.define('repo', {
        owner: {
            type: Sequelize.STRING
        },
        name: {
            type: Sequelize.STRING
        },
        branch: {
            type: Sequelize.STRING
        },
        uuid: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV1,
            primaryKey: true
        }
    });

    // Define tables
    dbClass = sequelize.define('class', {
        name: {
            type: Sequelize.STRING
        },
        path: {
            type: Sequelize.STRING
        },
        file_name: {
            type: Sequelize.STRING
        },
        uuid: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV1,
            primaryKey: true
        }
    });
    dbClass.belongsTo(dbRepo, { foreignKey: "repo_uuid" });

    dbMethod = sequelize.define('method', {
        name: {
            type: Sequelize.STRING
        },
        type: {
            type: Sequelize.STRING
        },
        uuid: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV1,
            primaryKey: true
        }
    });
    dbMethod.belongsTo(dbClass, { foreignKey: "class_uuid" });

    dbMethodParam = sequelize.define('methodParam', {
        name: {
            type: Sequelize.STRING
        },
        type: {
            type: Sequelize.STRING
        },
        uuid: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV1,
            primaryKey: true
        }
    });
    dbMethodParam.belongsTo(dbMethod, { foreignKey: "method_uuid" });

    dbClassRef = sequelize.define('classRef', {
        class_name: Sequelize.STRING,
        uuid: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV1,
            primaryKey: true
        }
    });
    dbClassRef.belongsTo(dbClass, { foreignKey: "class_uuid" });
    dbClassRef.belongsTo(dbMethod, { foreignKey: "method_uuid" });

    dbMethodRef = sequelize.define('methodRef', {
        uuid: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV1,
            primaryKey: true
        }
    });
    dbMethodRef.belongsTo(dbMethod, { foreignKey: "src_uuid" });
    dbMethodRef.belongsTo(dbMethod, { foreignKey: "dst_uuid" });
    dbMethodRef.belongsTo(dbClass, { foreignKey: "class_uuid" });


    // Setup tables
    // force: true will drop the table if it already exists
    dbRepo.sync({force: true}).then(function () {
        dbClass.sync({force: true}).then(function () {
            dbMethod.sync({force: true}).then(function() {
                dbClassRef.sync({force: true});
                dbMethodRef.sync({force: true});
                dbMethodParam.sync({force: true});
            }).then(console.log.bind(null, "Database initialization completed"))
        })
    });
}

function getRepo(owner, repo_name, branch, callback) {
    dbRepo.findOne({ 
        where: {
            owner: owner,
            name: repo_name,
            branch: branch
        }
    }).then(function(res) {
        callback(res);
    })
}

function createRepo(owner, repo_name, branch, callback) {
    dbRepo.create({
        owner: owner,
        name: repo_name,
        branch: branch
    }).then(function(res) {
        callback(res);
    })
}

function getClasses(repo_id, callback) {
    dbClass.findAll({
        where: {
            repo_uuid: repo_id
        }
    }).then(callback);
}

function createClass(repo_id, name, path, file_name, callback) {
    dbClass.create({
        repo_uuid: repo_id,
        name: name,
        path: path,
        file_name: file_name
    }).then(callback)
}

function getMethods(class_id, callback) {
    dbMethod.findAll({
        where: {
            class_uuid: class_id
        }
    }).then(callback);
}

function createMethod(class_id, name, type, callback) {
    dbMethod.create({
        class_uuid: class_id,
        name: name,
        type: type
    }).then(callback)
}

function getClassRefs(method_id, callback) {
    dbClassRef.findAll({
        where: {
            method_uuid: method_id,
        }
    }).then(callback);
}

function createClassRef(method_id, class_id, class_name, callback) {
    dbClassRef.create({
        method_uuid: method_id,
        class_uuid: class_id,
        class_name: class_name,
    }).then(callback)
}

module.exports = {
    init: init,
    getRepo: getRepo,
    createRepo: createRepo,
    getClasses: getClasses,
    createClass: createClass,
    getMethods: getMethods,
    createMethod: createMethod,
    getClassRefs: getClassRefs,
    createClassRef: createClassRef,
};
