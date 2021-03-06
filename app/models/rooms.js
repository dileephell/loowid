var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Room schema
 */
var ttl = 3600 * 24 * (process.env.ROOM_TIMEOUT || 15); // Room expires after 15 days

var RoomSchema = new Schema({
    roomId: String,
    created: { type: Date, expires: ttl },
    dueDate: Date,
    status: String,
    access: {
    	shared:String,       	
    	title: String,
       	keywords: [String],
       	passwd: String,
       	moderated: Boolean,
        chat: {type: Boolean, default: true},
        locked: Boolean,
        permanent: Boolean,
        permanentkey: String
    },
    owner: {
		name: String, 
		sessionid: String, 
		connectionId: String,
		avatar: String
    },
    guests: [UserSchema],
    valid: [String],
    chat: [ChatSchema],
    alias: [AliasSchema]
});


var UserSchema = new Schema ({
	name: String, 
	sessionid: String, 
	connectionId: String, 
	status: String,
	avatar: String,
	source: [String]
})

var ChatSchema = new Schema ({
	id: String, 
	text: String,
	time: Date
})

var AliasSchema = new Schema ({
	id: String, 
	owner: Boolean,
	session: String,
	timestamp: Date
})

/**
 * Statics
 */
RoomSchema.statics = {
    load: function(id, sid, cb) {
    	// Only show the last 150 chat messages
    	var now = new Date();
    	this.findOne({'$or':[{roomId:id},{'alias.id':id,'alias.timestamp':{'$gte':now}},{'alias.session':sid,'alias.timestamp':{'$gte':now}}]},{chat:{'$slice':-150}}).exec(cb);
    },
    alias: function (room, sid, id) {
    	var len = room.alias.length;
    	for (var i=0; i<len; i++) {
    		if (room.alias[i].session == sid && (!id || room.alias[i].id == id)) {
    			return room.alias[i];
    		}
    	}
    	return null;
    },
    safe: function(guests) {
    	for (i=0; i<guests.length; i++) {
    		delete guests[i].sessionid;
    	}
    	return guests;
    },
    all: function(cb) {
    	this.aggregate([
		      {
		        $group : {
		           _id : { day: { $dayOfMonth: "$created" }, month: { $month: "$created" }, year: { $year: "$created" } },
		           //avgMembers: { $avg: { $add:[ { $size: "$guests" }, 1 ] } },
		           count: { $sum: 1 }
		        }
		      }, { $sort : { _id: 1 } }
    	]).exec(cb);
    }
};


mongoose.model('Room', RoomSchema);
