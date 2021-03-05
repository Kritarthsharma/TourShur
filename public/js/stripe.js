/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
	const stripe = Stripe(
		'pk_test_51ILVYNEcZYRfwMwQR0nP1FTsM94OzKdbpURFSbKzah1Hq5S7M4gX97fLn9IDl4zbixEhuaXyJvPG0WhOiFYMsFd300Bsn2jWVq'
	);

	try {
		// 1) Get checkout session from api from server
		const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
		console.log(session);
		// 2) Create checkout form + charge the credit card
		await stripe.redirectToCheckout({
			// this will redirect to client side checkout.
			sessionId: session.data.session.id
		});
	} catch (err) {
		console.log(err);
		showAlert('error', err);
	}
};
