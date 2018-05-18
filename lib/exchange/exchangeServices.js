const Constants = require('./exchangeConstants');
const Currencies = require('../currency/currencies');
const globalFunction = require('../global/globalFunctions');
const resHndlr = require("../global/Responder");
const Exchanges = require("./exchangeFunctions");
const RuleBook = require("../admin/ruleBook");
const NodeCache = require("node-cache");
const myCache = new NodeCache();
const Order = require("./order");
const BigNumber = require('bignumber.js');
const Product = require('../product/product');
//*********************** required functions ***********************
//  myCache.del("5a682ba43fd2fa19ddfe3ded", function(err, count) {
//     if (!err) console.log(count);
// });
//****************************** API *******************************
module.exports = {
"exchange":(req, res) => {
    if (!req.body.amount || !req.body.userId )
        return resHndlr.apiResponder(req, res, 'Please fill the required fields.', 400)
     else {

        globalFunction.isUserExsist(req.body.userId, (err, User) => {
         if (err) return resHndlr.apiResponder(req, res, "Something went wrong1", 500, err)
             //console.log('req.body.userId:::::::::',req.body.userId)
            else if (User) {
                   globalFunction.isAddressExsist(User._id, 'ETH', function(err, result){
                    if (err) return resHndlr.apiResponder(req, res, err, 500, err)
                    else if (result) {
                        if (result.balance < req.body.amount)
                            return resHndlr.apiResponder(req, res, "Don't have sufficient amount for this bidding.", 500, err)
                        else {
                            let fee = new BigNumber(req.body.amount)//2
                            let percent = (fee.multipliedBy(.001))//2*.001=0.002
                            percent = new BigNumber(percent)//0.002
                            fee = percent.plus(fee);//0.002+2=2.002
                            fee = parseFloat(fee);//2.002
                            fz = new BigNumber(result.freezeBalance)//0
                            bln = new BigNumber(result.balance)//45
                            dec = fz.plus(req.body.amount)//0+2=2
                            inc = bln.minus(fee)//45-2.002=42.998
                            parseFloat(dec);//2
                            parseFloat(inc);//42.998
                            Currencies.findOneAndUpdate({'currencies.currency': 'ETH',userId: req.body.userId},
                             {$set: {'currencies.$.freezeBalance': dec,'currencies.$.balance': inc}}, {new: true}).then((success) => {
                                if (success) {
                                  console.log('javeddddddddddddddddddddddddddddddddddd');
                                  //  console.log("1")
                                    Product.findOneAndUpdate({_id: req.body._id,actionStartedDate:{$lt:req.body.bidtime},actionCloseDate:{$gt:req.body.bidtime}}, {$push: {
                                                productBid: {
                                                    'userId': req.body.userId,
                                                    'amount': req.body.amount,
                                                    'bidtime': new Date().getTime()
                                                }

                                            }
                                        }, {new: true}).sort({'productBid.bidtime': -1})
                                        .then((response) => {
                                           console.log("response:   ",response)
                                           if(response == null)
                                            return resHndlr.apiResponder(req, res, "Bidding Time Ended.", 400)

                                        else{
                                         if (response.productBid.length < 2)
                                            return resHndlr.apiResponder(req, res, "successfully happened.", 200)//First time user
                                            else {
                                              //  console.log('responseTest for second user ',req.body.userId)
                                                for (var n = response.productBid.length-2; n >=0; n--) {
                                                    //console.log("3333: ",response.productBid[n])
                                                    if (response.productBid[n].status == false && response.productBid[n].isEngaged == false && response.productBid[n].cancel == false) {
                                                        response.productBid[n].cancel = true;
                                                    //   console.log('responseTest for second user ',req.body.userId)
                                                            globalFunction.bid(response,response.productBid[n], req, res, function(err, res) {
                                                         //   console.log('test!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                                                            if (err) return resHndlr.apiResponder(req, res, err, 500, err)
                                                            else {
                                                                //     console.log('Error !!!!!!!!!!!',res);
                                                                return resHndlr.apiResponder(req, res, 'Your bid amount return successfully.', 200, res)
                                                            }
                                                        })
                                                        break;
                                                    }
                                                }
                                                if (n < 0)
                                                 return resHndlr.apiResponder(req, res, 'Bid successfully.', 500)
                                            }}
                                        }).catch((unsuccess) => {
                                           // console.log("unsuccess:::::",unsuccess)
                                            return resHndlr.apiResponder(req, res, 'Something went wrong.', 500, unsuccess)
                                        })
                                } else
                                {
                                   // console.log("2")
                                    return resHndlr.apiResponder(req, res, 'something went wrong.', 500)
                                }
                            })
                        }
                    } else return resHndlr.apiResponder(req, res, "Sorry, you don't have sufficient balance, please try again later!!", 500, err)
                })
            }
        })

    }

},
    'graph': (req, res) => {
        var BigNumber = require('bignumber.js');
        var data = 0.5;
        data = BigNumber(data)
        console.log(data);
        console.log(parseFloat(data))
    },
    'cancelBid':(req,res)=>{
        if(!req.body.bidId)
            return resHndlr.apiResponder(req, res, 'Please fill the required fields.', 400)
        else
        {
            Order.findOneAndUpdate({_id:req.body.bidId,status:false,isEngage:false,isCancel:false},{isCancel:true},{new:true})
            .then((Bid)=>{
                if(Bid)
                {
                    Currencies.findOne({'currencies.currency':Bid.amount.currency,userId:Bid.userId},{'currencies.$':1})
                    .then((result)=>{
                        userCurrency = result.currencies[0];
                       // console.log('userCurrency:  ',userCurrency);
                        let fee = new BigNumber(Bid.amount.value)
                        let percent = (fee.multipliedBy(.001))
                        percent = new BigNumber(percent)
                        fee = percent.plus(fee);
                        fee = parseFloat(fee);
                        fz = new BigNumber(userCurrency.freezeBalance)
                        bln = new BigNumber(userCurrency.balance)
                        inc = bln.plus(fee)
                        dec = fz.minus(Bid.amount.value)
                        parseFloat(dec);
                        parseFloat(inc);
                    Currencies.findOneAndUpdate({'currencies.currency':Bid.amount.currency,userId:Bid.userId},{$set:{'currencies.$.freezeBalance':dec,'currencies.$.balance':inc}},{new:true})
                    .then((success)=>{
                       return resHndlr.apiResponder(req, res, 'Your bid canceled successfully.', 200)
                    })
                 })
                }
                else
                 return resHndlr.apiResponder(req, res, 'Sorry not able to cancel your bid.', 400)
            })
            .catch((unsuccess)=>{return resHndlr.apiResponder(req, res, 'Something went wrong.', 400,unsuccess)})
        }
    },
    'cancelAsk':(req,res)=>{
        if(!req.body.askId)
            return resHndlr.apiResponder(req, res, 'Please fill the required fields.', 400)
        else
        {
            Order.findOneAndUpdate({_id:req.body.askId,status:false,isEngage:false,isCancel:false,type:'ASK'},{isCancel:true},{new:true})
            .then((Ask)=>{
                if(Ask)
                {
                    Currencies.findOne({'currencies.currency':Ask.volume.currency,userId:Ask.userId},{'currencies.$':1})
                    .then((result)=>{
                        userCurrency = result.currencies[0];
                        console.log('userCurrency:  ',userCurrency);
                        let fee = new BigNumber(Ask.volume.value)
                        let percent = (fee.multipliedBy(.001))
                        percent = new BigNumber(percent)
                        fee = percent.plus(fee);
                        fee = parseFloat(fee);
                        fz = new BigNumber(userCurrency.freezeBalance)
                        bln = new BigNumber(userCurrency.balance)
                        inc = bln.plus(fee)
                        dec = fz.minus(Ask.volume.value)
                        parseFloat(dec);
                        parseFloat(inc);
                    Currencies.findOneAndUpdate({'currencies.currency':Ask.volume.currency,userId:Ask.userId},{$set:{'currencies.$.freezeBalance':dec,'currencies.$.balance':inc}},{new:true})
                    .then((success)=>{
                       return resHndlr.apiResponder(req, res, 'Your Ask canceled successfully.', 200)
                    })
                        })
                }
                else
                 return resHndlr.apiResponder(req, res, 'Sorry not able to cancel your Ask.', 400)
            })
            .catch((unsuccess)=>{return resHndlr.apiResponder(req, res, 'Something went wrong.', 400,unsuccess)})
        }
    }
}
