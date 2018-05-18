const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let product = new Schema({
		createdBy : {type:String,required:true },
		productTitle:{type:String,required:true},
		productName:{type:String,required:true},
		productNo:{type:Number,unique: true},
		productStatus:{type:String,default:true},
		productQuntity:{type:Number,required:true},
		productPrice:{type:Number,required:true},
		actionStartedDate:{type:Number},//Save Date in milliseconds getTime()
		actionCloseDate:{type:Number},
		productBid:[{
			userId:{type: mongoose.Schema.Types.ObjectId,ref: 'User',required:true},
			amount:{type:Number,required:true},
			status:{type:Boolean,default:false},
			bidtime:{type:Number},
			isEngaged:{type:Boolean,default:false},
			cancel:{type:Boolean,default:false},
			}]
});
module.exports = mongoose.model('Product',product);


