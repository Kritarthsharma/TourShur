import axios from 'axios';
import { showAlert } from './alerts';

export const forgotPassword = async (email) => {
	try {
		const res = await axios({
			method: 'POST',
			url: '/api/v1/users/forgotPassword',
			data: {
				email
			}
		});

		if (res.data.status === 'success') {
			showAlert('success', 'Please Check Your Email');
			window.setTimeout(() => {
				location.reload();
			}, 3000);
		}
	} catch (err) {
		showAlert('error', err.response.data.message);
	}
};
