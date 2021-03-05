const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./usermodel'); // for embedded method
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
	{
		// Defines the logical representation or structure of the document
		name: {
			type: String,
			required: [ true, 'A tour must have a name' ], // Validator
			unique: true,
			trim: true,
			maxlength: [ 40, 'A tour name must have less or equal than 40 characters' ], // These validators are only available in strings type.
			minlength: [ 10, 'A tour name must have more or equal than 10 characters' ]
			//validate: [ validator.isAlpha, 'Tour name must only contain characters' ] // this is a validator module. You can also put a object as your own preference. We can also use regex here to validate.
		},
		slug: String,
		duration: {
			type: Number,
			required: [ true, 'A tour must have a duration' ]
		},
		maxGroupSize: {
			type: Number,
			required: [ true, 'A tour must have a group size' ]
		},
		difficulty: {
			type: String,
			required: [ true, 'A tour must have a difficulty' ],
			enum: {
				values: [ 'easy', 'medium', 'hard' ],
				message: 'Difficulty is either: easy, medium or hard'
			} // User can only put these three values or otherwise it will give an error and this only works in a string type not a number type.
		},
		ratingsAverage: {
			type: Number,
			default: 4.5,
			min: [ 1, 'Rating must be equal or above 1.0' ], // This also works in Date type.
			max: [ 5, 'Rating must be equal or below 5.0' ],
			set: (val) => Math.round(val * 10) / 10 //This function will be run each time a value is set for this ratingsAverage field.
		},
		ratingsQuantity: {
			type: Number,
			default: 0
		},
		price: {
			type: Number,
			required: [ true, 'A tour must have a price' ]
		},
		priceDiscount: {
			type: Number,
			validate: {
				validator: function(val) {
					return val < this.price; // opposite will trigger an validation error and the this will only point to the new document created it will be of no use when updating a document.
					// this only points to current doc on NEW document creation.
				},
				message: 'Discount price ({VALUE}) should be below the regular price' // This message also has access to the value that is inputed
			}
		},
		summary: {
			type: String,
			trim: true,
			required: [ true, 'A tour must have a summary' ]
		},
		description: {
			type: String,
			trim: true
		},
		imageCover: {
			type: String,
			required: [ true, 'A tour must have a cover image' ]
		},
		images: [ String ],
		createdAt: {
			type: Date,
			default: Date.now(), // in mongoose it is immediately converted into a normal date
			select: false
		},
		startDates: [ Date ],
		secretTour: {
			type: Boolean,
			default: false
		},
		startLocation: {
			// GeoJson
			type: {
				type: String,
				default: 'Point', // We can specify multiple geometries in mongo db like polygon, lines etc. The default one is point.
				enum: [ 'Point' ]
			},
			coordinates: [ Number ],
			address: String,
			description: String
		},
		locations: [
			{
				// By specifying an array it will create documents in mongo db instead of objects.
				type: {
					type: String,
					default: 'Point',
					enum: [ 'Point' ]
				},
				coordinates: [ Number ],
				address: String,
				description: String,
				day: Number
			}
		],
		guides: [
			// sub documents
			// type: Array embedded option works only for creating new documents not updating them
			{
				// Reference method referencing from user collection. This wiil be of more help because if the user gets updated then we don't have to come and also update the tour itself.
				type: mongoose.Schema.ObjectId, // a type for mongoose object id
				ref: 'User'
			}
		]
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

// Single field index
// tourSchema.index({ price: 1 }); // indexing to make the query process shorter. sets the index for the property defined and the number sets order of sorting ascending or descending.

// Compound index
// While using compound keep in mind that if you use only the first specified value of it then it will return indexation of that particular element but if you tried you use the second element only then the indexation won,t work.
tourSchema.index({ price: 1, ratingsAverage: -1 }); // indexing to make the query process shorter. sets the index for the property defined and the number sets order of sorting ascending or descending.
tourSchema.index({ slug: 1 }); // indexing to make the query process shorter. sets the index for the property defined and the number sets order of sorting ascending or descending.
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
	//  defining virtual property virtual property will be created everytime that we get data from the database.
	return this.duration / 7; //value of the property
});

// Virtual populate
tourSchema.virtual('reviews', {
	ref: 'Review',
	foreignField: 'tour', // a field in the reviewModel where ref to the current model(Tour) is stored.
	localField: '_id' // Provided the id this specifies that where is the id stored in current model.
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function(next) {
	// Pre save hook or middleware
	this.slug = slugify(this.name, { lower: true });
	next();
});

// *************** embedded method ***********
// tourSchema.pre('save', async function(next) {
// 	// embedded option works only for creating new documents not updating them
// 	const guidesPromises = this.guides.map(async (id) => await User.findById(id));
// 	this.guides = await Promise.all(guidesPromises); // Run every promises together and then assign it to guides.
// 	next();

// 	// const ids = this.guides;
// 	// this.guides = await User.find({ _id: { $in: ids } });
// });

// tourSchema.pre('save', function(next) {
// 	console.log('Will save document...');
// 	next();
// });

// tourSchema.post('save', function(doc, next) {
// 	console.log(doc);
// 	next();
// });

// QUERY middleware
//tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
	this.find({ secretTour: { $ne: true } });

	this.start = Date.now(); // see post middleware
	next();
});

tourSchema.pre(/^find/, function(next) {
	this.populate({
		path: 'guides',
		select: '-__v -passwordChangedAt'
	}); // populate means basically to fill up the field called guides in tourmodel. Actual database will not be populated only the query.

	next();
});

tourSchema.post(/^find/, function(docs, next) {
	console.log(`Query took ${Date.now() - this.start} milliseconds!`);
	next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
	// if (!(this.pipeline().length > 0 && '$geoNear' in this.pipeline()[0])) // in is a operator in js to check for the key in object.
	if (!(Object.keys(this.pipeline()[0])[0] === '$geoNear'))
		this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

	next();
});

const Tour = mongoose.model('Tour', tourSchema); // the variable name is defined in uppercase letter so that we can know that it is a model

module.exports = Tour;
