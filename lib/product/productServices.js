
const Product = require('../product/product');
const Constants = require('../user/userConstants');
const Currencies = require('../currency/currencies');
const globalFunction = require('../global/globalFunctions');
const Order = require('../exchange/order');
const resHndlr = require("../global/Responder");
const Transactions = require('../transection/transections')
var bcrypt = require('bcrypt');
const accountSid = 'AC46046362dac8e57a59a867bc54c59f82';
const authToken = 'f32f6dd93e1281d3b5abc9e91cecfa79';
const client = require('twilio')(accountSid, authToken);
var Promise = require("bluebird");
var jwt = Promise.promisifyAll(require("jsonwebtoken"));
const RuleBook = require('../admin/ruleBook');
const nodemailer = require('nodemailer');

module.exports = {

'createProduct': (req, res) => {
    console.log(req.body);
    if (!req.body.createdBy || !req.body.productPrice || !req.body.productNo || !req.body.productName || !req.body.actionCloseDate || !req.body.actionStartedDate) 
      return resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
 
    else {
        var productData = {
            createdBy: req.body.createdBy,
            productTitle: req.body.productTitle,
            productName: req.body.productName,
            productNo: req.body.productNo,
            productPrice:req.body.productPrice,
            productStatus: req.body.productStatus,
            productQuntity: req.body.productQuntity,
            actionStartedDate: req.body.actionStartedDate,
            actionCloseDate:req.body.actionCloseDate
        };
       
        Product.create(productData, function(err, product) {
                       if(err) {
                if (err.code == 11000 || err.code == '11000') 
                  return resHndlr.apiResponder(req, res, "Product No is already exsist", 500, err)
                else 
                  return resHndlr.apiResponder(req, res, "Something went wrong1", 500, err)
            } else {

                return resHndlr.apiResponder(req, res, 'Product created successfully.', 200, product)
            }
        })
    }
}, 
'updateProduct': (req, res) => {
    if (!req.query.createdBy || !req.query.productTitle || !req.query.productName || !req.query.productQuntity || !req.query.productPrice) 
      return resHndlr.apiResponder(req, res, 'Please fill the required fields.', 400)
    if (req.query._id) Product.findByIdAndUpdate({
        _id: req.query._id
    }, {
        createdBy: req.query.createdBy,
        productTitle: req.query.productTitle,
        productName: req.query.productName,
        productQuntity: req.query.productQuntity,
        productPrice: req.query.productPrice
    }, 
    { new: true})
    .then((success) => {
        return resHndlr.apiResponder(req, res, 'Success', 200, success)
    }).catch((unsuccess) => {
        return resHndlr.apiResponder(req, res, 'Something went wrong', 500)
    })
    else
     return resHndlr.apiResponder(req, res, 'Please provide the switch.', 500)
}
}

