const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

// 1) ROUTE HANDLERS

exports.setTourUserIds = (req, res, next) => {
	// Allow nested routes
	if (!req.body.tour) req.body.tour = req.params.tourId; // No need to specify tour and user in the body .
	if (!req.body.user) req.body.user = req.user.id; // from protect middleware
	next();
};

exports.getAllReviews = factory.getAll(Review);

exports.getSingleReview = factory.getOne(Review);

exports.createNewReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
