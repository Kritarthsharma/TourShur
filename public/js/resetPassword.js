import axios from 'axios';
import { showAlert } from './alerts';

export const resetPassword = async (password, confirmPassword) => {
	const params = window.location.search.split('?')[1];
	try {
		const res = await axios({
			method: 'PATCH',
			url: `/api/v1/users/resetPassword/${params}`,
			data: {
				password,
				confirmPassword
			}
		});

		if (res.data.status === 'success') {
			showAlert('success', 'Password Changed Successfully!');
			window.setTimeout(() => {
				location.assign('/allTours');
			}, 3000);
		}
	} catch (err) {
		showAlert('error', err.response.data.message);
	}
};
