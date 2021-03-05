/* eslint-disable */

const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('../routes/reviewRoutes');

const router = express.Router();

//router.param('id', tourController.checkId);

//POST /tour/49893439/reviews  ..... nested route. in nested route we display parent child relationship where reviews is the child of tours.
//GET /tour/49893439/reviews  ..... nested route. in nested route we display parent child relationship where reviews is the child of tours.

router.use('/:tourId/reviews', reviewRouter); // router itself is a middleware so we can implement use method on it. Also known as mounting the router. Everytime if the route is like this it will redirect to reviewRouter.

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
	.route('/monthly-stats/:year')
	.get(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide', 'guide'),
		tourController.getMonthlyStats
	);

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=miles .........query method // req.query method
// /tours-within/233/center/-40,45/unit/miles ........ url method which we are doing.

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
	.route('/')
	.get(tourController.getAllTours)
	.post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createNewTour); // We could have also added catchAsync function as these are async function handler.
router
	.route('/:id/:y?')
	.get(tourController.getSingleTour)
	.patch(
		tourController.uploadTourImages,
		tourController.resizeTourCoverImage,
		tourController.resizeTourImages,
		authController.protect,
		authController.restrictTo('admin', 'lead-guide'),
		tourController.updateTour
	)
	.delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

module.exports = router;
