const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourmodel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// 1) ROUTE HANDLERS

// MIDDLEWARE
const multerStorage = multer.memoryStorage(); // This way the image will be stored as buffer in the memory.

const multerFilter = (req, file, cb) => {
	// test if the uploaded file is an image
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError('Not an image! Please upload only images.', 404), false);
	}
};

// const upload = multer({ dest: 'public/img/users' }); // destination to upload. If no option specified the uploaded image would simply be stored in memory and not saved anywhere to the disk.
const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter
}); // destination to upload. If no option specified the uploaded image would simply be stored in memory and not saved anywhere to the disk.

exports.uploadTourImages = upload.fields([
	// If there are more than single fields and multiple images then we will do this.
	{ name: 'imageCover', maxCount: 1 },
	{ name: 'images', maxCount: 3 }
]);

// upload.single('image') // req.file If there is only a single field and single image then we will do this.
// upload.array('images', 5) req.files If there is only a single field but multiple images then we will do this.

exports.resizeTourCoverImage = catchAsync(async (req, res, next) => {
	if (!req.files.imageCover) return next();

	// 1) Cover image
	req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
	await sharp(req.files.imageCover[0].buffer)
		.resize(2000, 1333) // 3/2 picture ratio
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`public/img/tours/${req.body.imageCover}`); // its best to not save the file to the disk while its processing but instead save it to the memory

	next();
});

exports.resizeTourImages = catchAsync(async (req, res, next) => {
	if (!req.files.images) return next();

	// 2) Images
	req.body.images = [];

	await Promise.all(
		// awaiting all the elements in an array once by using promise.all
		req.files.images.map(async (file, i) => {
			// async await does not works perfectly inside a loop function that's why we have used map method on it. And hence this returns a promise we save an array of promises by applying map to it.
			const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

			await sharp(file.buffer)
				.resize(2000, 1333) // 3/2 picture ratio
				.toFormat('jpeg')
				.jpeg({ quality: 90 })
				.toFile(`public/img/tours/${filename}`); // its best to not save the file to the disk while its processing but instead save it to the memory

			req.body.images.push(filename);
		})
	);

	next();
});

exports.aliasTopTours = (req, res, next) => {
	req.query.limit = '5';
	req.query.sort = 'price,-ratingsAverage';
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
	next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getSingleTour = factory.getOne(Tour, { path: 'reviews' });

exports.createNewTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
	const stats = await Tour.aggregate([
		{
			$match: { ratingsAverage: { $gte: 4.5 } }
		},
		{
			$group: {
				_id: { $toUpper: '$difficulty' },
				numTours: { $sum: 1 }, // Adds 1 for each document
				numRatings: { $sum: '$ratingsQuantity' },
				avgRating: { $avg: '$ratingsAverage' },
				avgPrice: { $avg: '$price' },
				minPrice: { $min: '$price' },
				maxPrice: { $max: '$price' }
			}
		},
		{
			$sort: {
				avgPrice: 1
			}
		}
	]);

	res.status(200).json({
		status: 'success',
		data: {
			stats
		}
	});
});

exports.getMonthlyStats = catchAsync(async (req, res, next) => {
	const year = req.params.year * 1; //2021

	const plan = await Tour.aggregate([
		{
			$unwind: '$startDates' // Deconstructs an array field from the input documents to output a document for each element.
		},
		{
			$match: {
				startDates: {
					$gte: new Date(`${year}-01-01`),
					$lte: new Date(`${year}-12-31`)
				}
			}
		},
		{
			$group: {
				// only displays the field mentioned in it.
				_id: { $month: '$startDates' }, // returns a month in a number format
				numTourStarts: { $sum: 1 },
				tours: { $push: '$name' } // push creates an array and inserts the field whatever that we define in it
			}
		},
		{
			$addFields: { month: '$_id' } // This adds a new field into the document
		},
		{
			$project: {
				_id: 0 // if i would put 1 it will show if 0 it will not show th field
			}
		},
		{
			$sort: { numTourStarts: -1 }
		},
		{
			$limit: 12
		}
	]);

	res.status(200).json({
		status: 'success',
		data: {
			plan
		}
	});
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
	const { distance, latlng, unit } = req.params;
	const [ lat, lng ] = latlng.split(',');

	const radius = unit === 'km' ? distance / 6378.1 : distance / 3663.2; // radius of earth in km and miles. ****** // radians =  distance/radius of earth in miles and km.

	if (!lat || !lng) {
		next(new AppError('Please provide Latitude and Longitude in the format lat, lng.', 400));
	}

	const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [ [ lng, lat ], radius ] } } }); // in geojson u will define longitude first and then latitude.
	/* startLocation is where we want to search about the location geoWithin will find a certain document within the specified coordinates or geometry.
	find the tours within the radius of latlng. The distance/earthRadiusInKm which is known as radians is radius. 
	 */

	res.status(200).json({
		status: 'success',
		results: tours.length,
		data: {
			data: tours
		}
	});
});

exports.getDistances = catchAsync(async (req, res, next) => {
	const { latlng, unit } = req.params;
	const [ lat, lng ] = latlng.split(',');

	const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

	if (!lat || !lng) {
		next(new AppError('Please provide Latitude and Longitude in the format lat, lng.', 400));
	}

	const distances = await Tour.aggregate([
		{
			/* For geoSpatial query there is only one stage called geoNear. And this one always
			needs to be the first one in the pipeline otherwise it will give an error . The geoNear always require which is very important that one of our 
			field index contains geoSpatial index. 
			If there's only one field with geoSpatial index then the geoNear stage will automatically use that index to perform the calculation.
			But if you have multiple fields with geoSpatial index then you need to use the keys parameter in order to define the field that you want to use for calculation.*/

			$geoNear: {
				// near is the point from which to calculate the distances and we also need to specify this point as geojson.
				near: {
					type: 'Point',
					coordinates: [ lng * 1, lat * 1 ] // converting it to number.
				},
				distanceField: 'distance',
				distanceMultiplier: multiplier
			}
		},
		{
			$project: {
				distance: 1,
				name: 1
			}
		}
	]);

	res.status(200).json({
		status: 'success',
		data: {
			data: distances
		}
	});
});
