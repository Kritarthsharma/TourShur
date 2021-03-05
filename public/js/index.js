/* eslint-disable */
import 'babel-polyfill';
import { displayMap } from './mapbox';
import { signup } from './signup';
import { login, logout } from './login';
import { forgotPassword } from './forgotPassword';
import { resetPassword } from './resetPassword';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// // DOM ELEMENTS
const mapBox = document.getElementById('map');
const signupForm = document.querySelector('.form--signup');
const loginForm = document.querySelector('.form--login');
const overviewSignupForm = document.querySelector('.formOverview--signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const forgotPasswordForm = document.querySelector('.form--forgotPassword');
const resetPasswordForm = document.querySelector('.form--resetPassword');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// //Delegation
if (mapBox) {
	const locations = JSON.parse(mapBox.dataset.locations);
	displayMap(locations);
}

if (signupForm) {
	signupForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const name = document.getElementById('name').value;
		const email = document.getElementById('email').value;
		const password = document.getElementById('password').value;
		const confirmPassword = document.getElementById('confirm-password').value;
		signup(name, email, password, confirmPassword);
	});
}
if (overviewSignupForm) {
	overviewSignupForm.addEventListener('submit', (e) => {
		e.preventDefault();
		document.querySelector('.btn--overviewSignup').textContent = 'processing...';
		const name = document.getElementById('name').value;
		const email = document.getElementById('email').value;
		const password = document.getElementById('password').value;
		const confirmPassword = document.getElementById('confirm-password').value;
		signup(name, email, password, confirmPassword);
	});
}
if (loginForm) {
	loginForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const email = document.getElementById('email').value;
		const password = document.getElementById('password').value;
		login(email, password);
	});
}

if (forgotPasswordForm) {
	forgotPasswordForm.addEventListener('submit', (e) => {
		e.preventDefault();
		document.querySelector('.btn--forgot-password').textContent = 'processing...';
		const email = document.getElementById('email').value;
		forgotPassword(email);
	});
}
if (resetPasswordForm) {
	resetPasswordForm.addEventListener('submit', (e) => {
		e.preventDefault();
		document.querySelector('.btn--reset-password').textContent = 'processing...';
		const password = document.getElementById('password').value;
		const confirmPassword = document.getElementById('confirm-password').value;
		resetPassword(password, confirmPassword);
	});
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm) {
	userDataForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const form = new FormData();
		form.append('name', document.getElementById('name').value);
		form.append('email', document.getElementById('email').value);
		form.append('photo', document.getElementById('photo').files[0]); // These files are actually an array.
		setTimeout(() => {
			location.reload();
		}, 2000);

		// const name = document.getElementById('name').value;
		// const email = document.getElementById('email').value;
		updateSettings(form, 'data');
	});
}

if (userPasswordForm) {
	userPasswordForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		document.querySelector('.btn--save-password').textContent = 'Updating...';

		const currentPassword = document.getElementById('current-password').value;
		const password = document.getElementById('password').value;
		const confirmPassword = document.getElementById('confirm-password').value;
		await updateSettings({ currentPassword, password, confirmPassword }, 'password');

		document.querySelector('.btn--save-password').textContent = 'Save password';
		document.getElementById('current-password').value = '';
		document.getElementById('password').value = '';
		document.getElementById('confirm-password').value = '';

		setTimeout(() => {
			location.reload();
		}, 2000);
	});
}

if (bookBtn)
	bookBtn.addEventListener('click', (e) => {
		e.target.textContent = 'processing...';
		const { tourId } = e.target.dataset; // e.target is element which was clicked. e.target = #book-tour
		bookTour(tourId);
	});
