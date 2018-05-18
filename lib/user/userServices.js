const User = require('../user/user');
const Constants = require('./userConstants');
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
// RuleBook.create({$push:{accessTo:'admin'}})
// .then((success)=>console.log('admin:::',success))
// .catch((unsuccess)=>console.log("unsuccess: ",unsuccess))
// User.create({name:'utkarsh',
// middleName:'',
// lastName:'vashishtha',
// phone:'+919818049959',
// verifyPhone:true,
// isTwoFactor:false,
// state:{ //for delete/block/deactive
// 	status:'active'
// },
// email:'utkarshv@gmail.com',
// ip:'',
// role:"user"}).then((su)=>console.log(su))
// .catch((un)=>console.log(un))
//***************************************function ************************************************
function sendMessage(_id, number, message, callback) {
var text = '';
var otppossible = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var i = 0;
for (; i < 6; i++) {
text += otppossible.charAt(Math.floor(Math.random() * otppossible.length));
};
    if(i>=6)
    client.messages.create({
        body: message + text,
        to: number,
        from: +13612983140
        // mediaUrl: 'http://www.example.com/cheeseburger.png',
    }, (err, message) => {
        if (err) 
            callback(err);
        else {
            User.findOneAndUpdate({ _id: _id}, {$set: {otp: text,phone: number}}, {new: true})
            .then((success) => callback(null, 'OTP is send on your phone please verify.'))
            .catch((unsuccess) => callback(Constants.MESSAGES.SomeThingWrong))
        }
    })
}
//*****************************************APIS***************************************************
module.exports = {
'createUser': (req, res) => { // just a demo api not for use
    bcrypt.genSalt(10, function(err, salt) {
        if (!req.body.email || !req.body.password || !req.body.name || !req.body.lastName /*|| !req.body.googleSecretKey*/) //user_id/page/sort/status/type
            resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
        else {
            RuleBook.findOne().then((success)=>{
                if (success.signup == true || success.signup == true) {
                    bcrypt.hash(req.body.password, salt, function(err, hash) {
                        if (err) return resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 500);
                        else var userData = {
                            email: req.body.email.toLowerCase(),
                            middleName: req.body.middleName,
                            name: req.body.name,
                            lastName: req.body.lastname,
                            password: hash,
                            //googleSecretKey:req.body.googleSecretKey
                        }
                        console.log("userData:", userData)
                        User.create(userData, function(err, user) {
                            if (err) {
                                console.log("err::::::::::::::::  ", err.code)
                                if(err.code == 11000 || err.code == "11000")
                                return resHndlr.apiResponder(req, res, Constants.MESSAGES.EmailAlreadyExsist, 400)
                            else
                                return resHndlr.apiResponder(req, res, Constants.MESSAGES.SomeThingWrong, 400)
                            } else {
                                globalFunction.sendMail(user._id,req.body.email, 'subject', 'text', (err, result) => {
                                    if (err) {
                                        console.log("err: ", err)
                                        resHndlr.apiResponder(req, res, "wrong", 500)
                                    } else resHndlr.apiResponder(req, res, Constants.MESSAGES.evrifyMail, 200)
                                })
                            }
                        });
                    })
                } else return resHndlr.apiResponder(req, res, Constants.MESSAGES.SignupRule, 500);
            })
        }
    })
},
   
    'userCurrency': (user_id) => { //entry in currency collection
        return Currencies.create({
            userId: user_id
        })
    },

    'login': (req, res) => {
    	if(!req.body.password || !req.body.email || !req.body.ip || !req.body.location)
            resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
        else
        User.findOne({email: req.body.email},function(err, record) {
            if(err) 
                return resHndlr.apiResponder(req, res, Constants.MESSAGES.PasswordMismatch, 400)
            else if (record) {
                if(record.state.status == 'active' || record.state.status == 'Active')
                bcrypt.compare(req.body.password, record.password, (err, result) => {
                    if (result) {
                        // var token = jwt.sign({data: 'foobar'}, 'secret', { expiresIn: '1h' });
                        var token = jwt.signAsync({id: record._id, role: record.role}, "login_secret_key_to_save_data", {})
                        // var token = jwt.sign({id: record._id, role: record.role},"login_secret_key_to_save_data");
                        User.findOneAndUpdate({_id: record._id},{$push:{loginDetails:{'ip':req.body.ip,'location':req.body.location}}},{new:true}).lean().exec(function(err, result) {
                            if (err)
                                {console.log("err:  ",err)
                             return resHndlr.apiResponder(req, res, Constants.MESSAGES.SomeThingWrong, 400)
                            }
                            else {
                                result.token = token
                                return resHndlr.apiResponder(req, res, 'Successfully logged in.', 200, result)
                            }
                        });
                    } 
                    else
                        {console.log(err)
                     return resHndlr.apiResponder(req, res, Constants.MESSAGES.PasswordMismatch, 400)
                    }
                })
            else
               return resHndlr.apiResponder(req, res, 'Please verify your account', 400) 
            } else
             return resHndlr.apiResponder(req, res, Constants.MESSAGES.EmailNotExsist, 400)
        })
    },
    'userTradeMarket': (req, res) => {
        if (!req.body.user_id || !req.body.page || !req.body.type) //user_id/page/sort/status/type
            resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
        else {
            req.body.type = req.body.type.toUpperCase();
            if (req.body.sort) // need to be static for sure
            {
                var value = req.body.sort;
                var option = {
                    page: req.body.page,
                    limit: Constants.MESSAGES.Limit,
                    sort: {
                        value: -1
                    },
                    lean: true
                }

                
            } else var option = {
                page: req.body.page,
                limit: Constants.MESSAGES.Limit,
                sort: {
                    createdAt: -1
                },
                lean: true
            }
            if (req.body.status == true) var query = {
                userId: req.body.user_id,
                type: req.body.type,
                status: true
            }
            else if (req.body.status == false) var query = {
                userId: req.body.user_id,
                type: req.body.type,
                status: false
            }
            else var query = {
                userId: req.body.user_id,
                type: req.body.type
            }
            console.log(query, option)
            Order.paginate(query, option, (error, result) => {
                if (error) resHndlr.apiResponder(req, res, Constants.MESSAGES.SomeThingWrong, 400)
                else resHndlr.apiResponder(req, res, Constants.MESSAGES[req.body.type], 200, result)
            })
        }
    },
    'userTrades': (req, res) => {
        if (!req.body.user_id || !req.body.page) //user_id/page/sort/status
            resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
        else {
            if (req.body.sort) // need to be static for sure like :processedAt/rate/total_amount/total_volume
            {
                var value = req.body.sort;
                var option = {
                    page: req.body.page,
                    limit: Constants.MESSAGES.Limit,
                    sort: {
                        value: -1
                    },
                    lean: true
                }
            } else var option = {
                page: req.body.page,
                limit: Constants.MESSAGES.Limit,
                sort: {
                    createdAt: -1
                },
                lean: true
            }
            if (req.body.status == true) var query = {
                userId: req.body.user_id,
                status: true
            }
            else if (req.body.status == false) var query = {
                userId: req.body.user_id,
                status: false
            }
            else var query = {
                userId: req.body.user_id
            }
            Order.paginate(query, option, (error, result) => {
                if (error) resHndlr.apiResponder(req, res, Constants.MESSAGES.SomeThingWrong, 400)
                else resHndlr.apiResponder(req, res, Constants.MESSAGES.Data, 200, result)
            })
        }
    },
    'userBalance': (req, res) => {
        // console.log(req)
        if (!req.query) resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
        else {
            Currencies.findOne({
                userId: req.query['user_id']
            }).then((success) => {
                resHndlr.apiResponder(req, res, Constants.MESSAGES.Data, 200, success)
            }).catch((unsuccess) => {
                console.log(unsuccess)
                resHndlr.apiResponder(req, res, Constants.MESSAGES.SomeThingWrong, 400)
            })
        }
    },
    'userCurrencyBalance': (req, res) => {
        // console.log(req)
        if (!req.query) resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
        else {
            Currencies.findOne({
                userId: req.query['user_id'],
                'currencies.currency': req.query['currency']
            }, {
                'currencies.$': 1
            }).then((success) => {
                resHndlr.apiResponder(req, res, Constants.MESSAGES.Data, 200, success)
            }).catch((unsuccess) => {
                console.log(unsuccess)
                resHndlr.apiResponder(req, res, Constants.MESSAGES.SomeThingWrong, 400)
            })
        }
    },
    'cancelTrade': (req, res) => {
        if (!req.body.order_id || !req.body.user_id) {
            resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
        } else {
            Order.update({
                userId: req.body.user_id,
                _id: req.body.order_id
            }, {
                isCancel: true
            }, {
                new: true
            }).then((success) => resHndlr.apiResponder(req, res, 'Your' + success.type + ' cancel successfully.', 200)).catch((unsuccess) => resHndlr.apiResponder(req, res, Constants.MESSAGES.SomeThingWrong, 400))
        }
    },
    'userTransactions': (req, res) => {
        let option = {
            page: req.body.page,
            limit: Constants.MESSAGES.Limit,
            sort: {
                time: -1
            },
            lean: true
        }
        if (!req.body.user_id) return resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
        else Transactions.paginate({
            userId: req.body.user_id
        }, option).then((success) => resHndlr.apiResponder(req, res, 'Your last five transactions.', 200)).catch((unsuccess) => resHndlr.apiResponder(req, res, Constants.MESSAGES.SomeThingWrong, 400))
    },
    'sendOtp': (req, res) => {
        if (!req.body._id || !req.body.number)
         return resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
        else {
            sendMessage(req.body._id, req.body.number, 'OTP to verify your phone number:  ', (err, message) => {
                if (err)
                 resHndlr.apiResponder(req, res, err.message, 400)
                else resHndlr.apiResponder(req, res, 'OTP is send on your phone please verify.', 200)
            })
        }
    },
    'verifyOtp': (req, res) => {
        if (!req.body._id || !req.body.otp) return resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
        else User.findOne({_id: req.body._id})
            .then((success) => {
            if (success && success.otp == req.body.otp)
            {
              success.verifyPhone = true;
              success.save()
              .then((result)=>
              {
                resHndlr.apiResponder(req, res, 'OTP is virified successfully.', 200,result)
              })  
             
            }
            else resHndlr.apiResponder(req, res, 'Please provide the correct otp.', 200)
        }).catch((unsuccess) => resHndlr.apiResponder(req, res, Constants.MESSAGES.SomeThingWrong, 400))
    },
    'changePassword': (req, res) => {
        if (!req.body._id || !req.body.oldPassword || !req.body.newPassword) return resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
        else User.findOne({
            _id: req.body._id
        }).then((success) => {
            bcrypt.compare(req.body.oldPassword, success.password, function(err, isMatch) {
                if (err) resHndlr.apiResponder(req, res, Constants.MESSAGES.SomeThingWrong, 400)
                else
                if (isMatch) bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(req.body.newPassword, salt, function(err, hash) {
                        if (err) return resHndlr.apiResponder(req, res, Constants.MESSAGES.SomeThingWrong, 400)
                        else {
                            success.password = hash;
                            success.save(function(err, result) {
                                if (err) return resHndlr.apiResponder(req, res, Constants.MESSAGES.SomeThingWrong, 400)
                                else return resHndlr.apiResponder(req, res, 'Your password updated successfully.', 200)
                            })
                        }
                    });
                })
                else return resHndlr.apiResponder(req, res, 'Please provide correct password.', 400)
            });
        })
    },
    'userList':(req,res)=>{
    	User.find().select('name middleName lastName state email createdAt role loginDetails verifyPhone isTwoFactor isKYC phone verificationStatus').exec()
    	.then((success)=>{return resHndlr.apiResponder(req, res, 'User list.', 200,success)})
    	.catch((unsuccess)=>{return resHndlr.apiResponder(req, res, 'Please provide correct password.', 400)})
    },
    'verifyEmail':(req,res)=>{
        if(!req.query.userId)
        resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
    else
    { 
        let date = new Date(new Date().getTime() - 60 * 60 * 24 * 1000);
        console.log('test', date);
        User.findOne({'state.status':{$ne:'active'},_id:req.query['userId']}) 
        .then((success)=>{
            if(success)
            {
                success.state.status = 'active';
                Currencies.create({userId:success._id})
                .then((result)=>{
                    success.balance = result._id;
                    success.save(function(err,result)
                    {
                        if(err)
                            resHndlr.apiResponder(req, res, Constants.MESSAGES.SomeThingWrong, 400)
                        else
                            resHndlr.apiResponder(req, res, 'Email verified successfully.', 200)
                        // res.redirect('http://192.168.0.131/binance/trading/trade');
                    })
                })
            }
            else
            {
                resHndlr.apiResponder(req, res, 'Link expired or you have already verified your email id.', 400)
            }
        })
        .catch((unsuccess)=>console.log("unsuccess: ",unsuccess))
    }
    },
    'userProfile':(req,res)=>{
        if(!req.query._id)
           resHndlr.apiResponder(req, res, Constants.MESSAGES.RequiredField, 400)
        else 
    User.findOne({_id:req.query._id}).select('name middleName lastName phone email role')
    .then((success)=>{resHndlr.apiResponder(req, res, 'Your profile info.', 200,success)})
    .catch((unsccess)=>{resHndlr.apiResponder(req, res, 'Constants.MESSAGES.SomeThingWrong', 400)})
},
 'forgetPassword': function(req, res) {
    User.findOne({email: req.query.email}, (err, record) => {
        if (err)
            return resHndlr.apiResponder(req, res, 'Something went wrong.', 400)
        if (record) {
            var text = '';
            var otppossible = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            for (var i = 0; i < 8; i++) {
                text += otppossible.charAt(Math.floor(Math.random() * otppossible.length));
            };
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ebriks.manish@gmail.com',
                    pass: 'manish123'
                }
            });
            var mailOptions = {
                from: 'ebriks.manish@gmail.com',
                to: req.query.email,
                subject: 'Temporary password for binance.',
                html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
          <html xmlns="http://www.w3.org/1999/xhtml" xmlns="http://www.w3.org/1999/xhtml">
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
              <title>Set up a new password for [Product Name]</title>


            </head>
            <body style="-webkit-text-size-adjust: none; box-sizing: border-box; color: #74787E; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; height: 100%; line-height: 1.4; margin: 0; width: 100% !important;" bgcolor="#F2F4F6"><style type="text/css">
          body {
          width: 100% !important; height: 100%; margin: 0; line-height: 1.4; background-color: #F2F4F6; color: #74787E; -webkit-text-size-adjust: none;
          }
          @media only screen and (max-width: 600px) {
            .email-body_inner {
              width: 100% !important;
            }
            .email-footer {
              width: 100% !important;
            }
          }
          @media only screen and (max-width: 500px) {
            .button {
              width: 100% !important;
            }
          }
          </style>
              <span class="preheader" style="box-sizing: border-box; display: none !important; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; mso-hide: all; opacity: 0; overflow: hidden; visibility: hidden;">Use this link to reset your password. The link is only valid for 24 hours.</span>
              <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="box-sizing: border-box; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; margin: 0; padding: 0; width: 100%;" bgcolor="#F2F4F6">
                <tr>
                  <td align="center" style="box-sizing: border-box; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; word-break: break-word;">
                    <table class="email-content" width="100%" cellpadding="0" cellspacing="0" style="box-sizing: border-box; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; margin: 0; padding: 0; width: 100%;">


                      <tr>
                        <td class="email-body" width="100%" cellpadding="0" cellspacing="0" style="-premailer-cellpadding: 0; -premailer-cellspacing: 0; border-bottom-color: #EDEFF2; border-bottom-style: solid; border-bottom-width: 1px; border-top-color: #EDEFF2; border-top-style: solid; border-top-width: 1px; box-sizing: border-box; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; margin: 0; padding: 0; width: 100%; word-break: break-word;" bgcolor="#FFFFFF">
                          <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0" style="box-sizing: border-box; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; margin: 0 auto; padding: 0; width: 570px;" bgcolor="#FFFFFF">

                            <tr>
                              <td class="content-cell" style="box-sizing: border-box; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; padding: 35px; word-break: break-word;">
                                <h1 style="box-sizing: border-box; color: #2F3133; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 19px; font-weight: bold; margin-top: 0;" align="left">Hi,</h1>
                                <p style="box-sizing: border-box; color: #74787E; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 16px; line-height: 1.5em; margin-top: 0;" align="left">You recently requested to forgot your password for your binance account. Use the Temporary password below to reset it. <strong style="box-sizing: border-box; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;"></strong></p>

                                <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0" style="box-sizing: border-box; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; margin: 30px auto; padding: 0; text-align: center; width: 100%;">
                                  <tr>
                                    <td align="center" style="box-sizing: border-box; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; word-break: break-word;">

                                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="box-sizing: border-box; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;">
                                        <tr>
                                          <td align="center" style="box-sizing: border-box; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; word-break: break-word;">
                                             <h5 style="box-sizing: border-box; color: #2F3133; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 15px; font-weight: bold; margin-top: 0;" align="left">${text}</h5>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                                <p style="box-sizing: border-box; color: #74787E; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 16px; line-height: 1.5em; margin-top: 0;" align="left">Thanks,
                                <br />The Binance Team</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>`
            };
            transporter.sendMail(mailOptions, function(error, info) {
                if (error) 
                         return resHndlr.apiResponder(req, res, 'Something went wrong.', 400)
                 else {
                    bcrypt.hash(text, 9, function(err, hash) {
                        if (err)
                         return resHndlr.apiResponder(req, res, 'Something went wrong.', 400)
                        else User.update({email: req.query.email}, {password: hash}, {new: true}, function(err, record) {
                            if (err) 
                         return resHndlr.apiResponder(req, res, 'Something went wrong.', 400)
                         return resHndlr.apiResponder(req, res, 'Your temporary password is send on your email.', 200)
                        });
                    });
                }
            });
        }
        else
        {
            return resHndlr.apiResponder(req, res, 'Sorry this email id is not registered.', 400)
        }
    })
 }
 }