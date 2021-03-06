const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const MemeSchema = new Schema({
    meme_id: Number,
    url: String,
    views: Number, 
    votes: Number
});

MemeSchema.plugin(AutoIncrement, {
	inc_field: 'meme_id'
});
MemeSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Meme', MemeSchema);