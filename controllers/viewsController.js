const Tour = require('../models/tourmodel');
const User = require('../models/usermodel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.alerts = (req, res, next) => {
	const { alert } = req.query;
	if (alert === 'booking')
		res.locals.alert =
			"Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up here immediately, please come back later.";
	next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
	res.status(200).render('overview');
});
exports.getAllTours = catchAsync(async (req, res, next) => {
	// 1) Get tour data from collection
	const tours = await Tour.find();
	// 2) Build Template
	// 3) Render that template using tour data from (1).
	res.status(200).render('allTours', {
		title: 'All Tours',
		tours
	});
});

exports.getTour = catchAsync(async (req, res, next) => {
	// 1) Get the data, for the requested tour (including reviews and guides)
	const tour = await Tour.findOne({ slug: req.params.slug }).populate({
		path: 'reviews',
		select: 'review rating user'
	});

	if (!tour) {
		return next(new AppError('There is no tour with that name!', 404)); // operational error
	}

	// 2) Build template
	// 3) Render that template using tour data from (1).
	res.status(200).render('tour', {
		title: `${tour.name} Tour`,
		tour
	});
});

exports.getSignupForm = (req, res, next) => {
	res.status(200).render('signup', {
		title: 'Signup'
	});
};

exports.getLoginForm = (req, res) => {
	res.status(200).render('login', {
		title: 'Login'
	});
};
exports.getForgotPasswordForm = (req, res) => {
	res.status(200).render('forgotPassword', {
		title: 'Forgot Password'
	});
};
exports.getResetPasswordForm = (req, res) => {
	res.status(200).render('resetPassword', {
		title: 'Reset Password'
	});
};

exports.getAccount = (req, res) => {
	res.status(200).render('account', {
		title: 'Your account'
	});
};

exports.getMyTours = catchAsync(async (req, res, next) => {
	// 1) Find all bookings
	const bookings = await Booking.find({ user: req.user.id });
	// 2) Find tours with the returned IDs
	const tourIDs = bookings.map((el) => el.tour._id);
	const tours = await Tour.find({ _id: tourIDs });
	res.status(200).render('allTours', {
		title: 'My Tours',
		tours
	});
});

exports.updateUserData = catchAsync(async (req, res, next) => {
	const updatedUser = await User.findByIdAndUpdate(
		req.user.id,
		{
			name: req.body.name,
			email: req.body.email
		},
		{
			new: true,
			runValidators: true
		}
	);

	res.status(200).render('account', {
		title: 'Your account',
		user: updatedUser
	});
});
