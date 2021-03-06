var Sequelize = require("sequelize");

// Initialize database connection info
function init() {
  console.log("Initializing Database");
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    logging: false
  });

  sequelize.authenticate()
    .then(function (err) {
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
  dbClass.belongsTo(dbRepo, {foreignKey: "repo_uuid"});

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
  dbMethod.belongsTo(dbClass, {foreignKey: "class_uuid"});

  dbMethodParam = sequelize.define('method_param', {
    // name: {
    //     type: Sequelize.STRING
    // },
    // type: {
    //     type: Sequelize.STRING
    // },
    parameter: {
      type: Sequelize.STRING
    },
    uuid: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true
    }
  });
  dbMethodParam.belongsTo(dbMethod, {foreignKey: "method_uuid"});

  dbClassRef = sequelize.define('class_ref', {
    method_name: Sequelize.STRING,
    class_name: Sequelize.STRING,
    uuid: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true
    }
  });
  dbClassRef.belongsTo(dbClass, {foreignKey: "class_uuid"});
  dbClassRef.belongsTo(dbMethod, {foreignKey: "method_uuid"});

  dbMethodRef = sequelize.define('method_ref', {
    uuid: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true
    }
  });
  // dbMethodRef.belongsTo(dbMethod, { foreignKey: "src_uuid" });
  // dbMethodRef.belongsTo(dbMethod, { foreignKey: "dst_uuid" });
  // dbMethodRef.belongsTo(dbClass, { foreignKey: "class_uuid" });


  // Setup tables
  // force: true will drop the table if it already exists
  dbRepo.sync({force: false}).then(function () {
    dbClass.sync({force: false}).then(function () {
      dbMethod.sync({force: false}).then(function () {
        dbClassRef.sync({force: false});
        dbMethodRef.sync({force: false});
        dbMethodParam.sync({force: false});
      }).then(console.log.bind(null, "Database initialization completed"))
    })
  });
}

function getRepos(callback) {
  dbRepo.all().then(callback);
}

function getRepo(owner, repo_name, branch, callback) {
  dbRepo.findOne({
    where: {
      owner: owner,
      name: repo_name,
      branch: branch
    }
  }).then(function (res) {
    callback(res);
  })
}

function createRepo(owner, repo_name, branch, callback) {
  dbRepo.create({
    owner: owner,
    name: repo_name,
    branch: branch
  }).then(function (res) {
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

function createClassRef(method_id, class_id, method_name, class_name, callback) {
  dbClassRef.create({
    method_uuid: method_id,
    class_uuid: class_id,
    method_name: method_name,
    class_name: class_name,
  }).then(callback)
}

function getMethodParam(method_id, callback) {
  dbMethodParam.findAll({
    where: {
      method_uuid: method_id,
    }
  }).then(callback);
}

function createMethodParam(method_id, parameter, callback) {
  dbMethodParam.create({
    where: {
      method_uuid: method_id,
      parameter: parameter
    }
  }).then(callback);
}

module.exports = {
  init: init,
  getRepo: getRepo,
  getRepos: getRepos,
  createRepo: createRepo,
  getClasses: getClasses,
  createClass: createClass,
  getMethods: getMethods,
  createMethod: createMethod,
  getClassRefs: getClassRefs,
  createClassRef: createClassRef,
  getMethodParam: getMethodParam,
  createMethodParam: createMethodParam,
};
