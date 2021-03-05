const mongoose = require('mongoose');
const Tour = require('./tourmodel');

const reviewSchema = new mongoose.Schema(
	{
		review: {
			type: String,
			required: [ true, 'Review can not be empty!' ]
		},
		rating: {
			type: Number,
			min: 1,
			max: 5
		},
		createdAt: {
			type: Date,
			default: Date.now,
			select: false
		},
		tour: {
			type: mongoose.Schema.ObjectId,
			ref: 'Tour',
			required: [ true, 'Review must belong to a tour.' ]
		},
		user: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: [ true, 'Review must belong to a user.' ]
		}
	},
	{
		toJSON: { virtuals: true }, // This makes sure when we have a VIRTUAL PROPERTY basically a field that is not stored in the database but calculated using some other value so we want this to also show up whenever there is a output.
		toObject: { virtuals: true }
	}
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
// The combination of tour and user has to be unique so that we can prevent user from giving a review once again to a same tour.

// Query Middleware
reviewSchema.pre(/^find/, function(next) {
	// this.populate({
	// 	/* By specifying tour here means that this field here which has
	// 	the exact same name in the schema is then going to be the one that's going to be populated based on the tour model that we have given ref to. */
	// 	path: 'tour',
	// 	select: 'name'
	// }).populate({
	// 	path: 'user',
	// 	select: 'name photo'
	// }); // populate means basically to fill up the field called guides in tourmodel. Actual database will not be populated only the query.
	this.populate({
		path: 'user',
		select: 'name photo'
	});

	next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
	// IN statics method you don,t have to create a instance of class to call a method. You can directly call it by class or model itself
	const stats = await this.aggregate([
		{
			$match: { tour: tourId } // matches all of the reviews with the particular tour id.
		},
		{
			$group: {
				_id: '$tour', // groups all the matched reviews together
				nRating: { $sum: 1 },
				avgRating: { $avg: '$rating' }
			}
		}
	]); // In statics method this points to the current model. Aggregate is only called on models.

	//console.log(stats);
	if (stats.length > 0) {
		await Tour.findByIdAndUpdate(tourId, {
			// this returns a promise.
			ratingsQuantity: stats[0].nRating,
			ratingsAverage: stats[0].avgRating
		});
	} else {
		await Tour.findByIdAndUpdate(tourId, {
			ratingsQuantity: 0,
			ratingsAverage: 4.5
		});
	}
};

//Document Middleware ....// using post here because this calculation will work only when the document is saved to the database not before that.
reviewSchema.post('save', function() {
	//this points to the current review being saved.
	this.constructor.calcAverageRatings(this.tour); // this keyword is the current document and the constructor is the model(Review).
});

// findByIdAndUpdate
// findByIdAndDelete

reviewSchema.pre(/^findOneAnd/, async function(next) {
	// findByIdAndUpdate and findByIdAndDelete is just a shorthand of findOneAndUpdate and findOneAndDelete so we can also use findOneAnd here in regex.
	this.r = await this.findOne(); // here this points to the query object and not the document. findOne just finds the first document that matches the query and returns it. Here we can execute a query and that will give us the current document.
	// We are saving the result to the query object to use it in other middlewares.
	//console.log(this.r);
});

/*So basically we couldn't have executed the calcAverageRatings function in pre middleware because the data wouldn't have loaded
till then so that's we defined the document here in the pre middleware for the delete and update functionality and then we used 
the resulted document and calcAverageRatings function in post middleware. */

reviewSchema.post(/^findOneAnd/, async function() {
	// await this.findOne(); does not work here, query has been already executed.
	await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

//POST /tour/49893439/reviews  ..... nested route. in nested route we display parent child relationship where reviews is the child of tours.
//GET /tour/49893439/reviews  ..... nested route. in nested route we display parent child relationship where reviews is the child of tours.
//GET /tour/49893439/reviews/6786878  ..... nested route. in nested route we display parent child relationship where reviews is the child of tours.

// ********For not using the pre middleware replacement code for line no 95

/* 
reviewSchema.post(/^findOneAnd/, async function(doc, next) {
  await doc.constructor.calcAverageRating(doc.tour);
  next();
}); // the post method also gets the resolved doc as an argument and if there is one argument given
mongoose automatically assumes it and provides next in the second argument.

************ replacement of both the document and query middleware.
reviewSchema.post(/save|^findOne/, async (doc, next) => {
    await doc.constructor.calcAverageRating(doc.tour);
    next();
});

*********** Check post if there is no id provided or if there is an invalid id.
reviewSchema.post(/^findOneAnd/, async function (docs) {
    if (docs) await docs.constructor.calcAverageRatings(docs.tour);
});

save middleware doesn't takes time and it doesn't return a value that we need hence 
we have not used async await in that middleware.
*/
