const proRoutr = require("express").Router();
const resHndlr = require("../global/Responder");
const middleware = require("../middleware");
const productServices = require("./productServices");
const dashboardServices = require("../socket/dashboard");
const constants = require("../constants");
const userConstants = require("../user/userConstants");
const jwtHandler = require("../jwtHandler");
const addressServices = require("../address/addressServices")
//const kycServices = require('./kycServices');
// const resHndlr = require("../global/Responder");
// const appUtil = require("../appUtils");
//const mediaUpload = require("../mediaupload/mediaUploadmiddleware");
// const validators=require("./userValidators");

proRoutr.route("/createProduct")
    .post([ /*middleware.authenticate.autntctTkn*/ ], function(req, res) {
        productServices.createProduct(req, res);
    });

proRoutr.route("/updateProduct")
    .put([ /*middleware.authenticate.autntctTkn*/ ], function(req, res) {
        productServices.updateProduct(req, res);
    });

module.exports = proRoutr;
