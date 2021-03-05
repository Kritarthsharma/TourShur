const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // This exposes a function right away and then we pass our secret key right into that and then it will give us a stripe object from which we can work as well.
const Tour = require('../models/tourmodel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
	// 1) Get the currently booked tour
	const tour = await Tour.findById(req.params.tourId);
	// 2) Create checkout session
	const session = await stripe.checkout.sessions.create({
		// information about the session
		payment_method_types: [ 'card' ],
		success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user
			.id}&price=${tour.price}`, // not really a secure way of success page as anyone can access this route and do the booking without paying up.
		cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
		customer_email: req.user.email,
		client_reference_id: req.params.tourId, // this field is gonna allow us to pass in some data about the session we are currently creating. For hosted sites to create new booking in database.
		// information about the product that the user is about to purchase.
		line_items: [
			{
				name: `${tour.name} Tour`,
				description: tour.summary,
				images: [ `https://www.natours.dev/img/tours/${tour.imageCover}` ],
				amount: tour.price * 100,
				currency: 'inr',
				quantity: 1
			}
		]
	});
	// 3) Create session as response
	res.status(200).json({
		status: 'success',
		session
	});
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
	// This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying up.
	const { tour, user, price } = req.query;

	if (!tour && !user && !price) return next();
	await Booking.create({ tour, user, price });

	res.redirect(req.originalUrl.split('?')[0]);
});

exports.getAllBookings = factory.getAll(Booking);

exports.getSingleBooking = factory.getOne(Booking);

exports.createNewBooking = factory.createOne(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);