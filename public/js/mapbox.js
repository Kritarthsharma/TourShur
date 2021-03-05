/* eslint-disable */
export const displayMap = (locations) => {
	mapboxgl.accessToken =
		'pk.eyJ1Ijoia3JpdGFydGgtc2hhcm1hIiwiYSI6ImNra3NkYTdpMTBkaWcyb3BpZDE1eXFjcHgifQ.hS1iiDZM7DvvyBAjf_47Sw';

	var map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/streets-v11',
		scrollZoom: false
		// center: [ 77.63122176003927, 12.938036706702515 ], // lnglat
		// zoom: 16
		// interactive: false
		// 	style: 'mapbox://styles/kritarth-sharma/ckksh5nkc16pa17nzjhtpe62m',
	});

	map.addControl(new mapboxgl.NavigationControl());

	const bounds = new mapboxgl.LngLatBounds(); // area that will be displayed on the maps.

	locations.forEach((location) => {
		// Create marker
		const el = document.createElement('div');
		el.className = 'marker';

		// Add marker
		new mapboxgl.Marker({
			element: el,
			anchor: 'bottom' // the part of the marker that points to the location in this case the bottom of the pin.
		})
			.setLngLat(location.coordinates)
			.addTo(map);

		//Add popup
		new mapboxgl.Popup({
			focusAfterOpen: false,
			offset: 30,
			closeOnClick: false
		})
			.setLngLat(location.coordinates)
			.setHTML(`<p>Day ${location.day}: ${location.description}</p>`) // content for the popup
			.addTo(map);

		// Extend map bounds to include current location
		bounds.extend(location.coordinates);
	});

	map.fitBounds(bounds, {
		padding: {
			// padding in map from the coordinates
			top: 200,
			bottom: 150,
			left: 100,
			right: 100
		}
	}); // it moves and zooms the map right to the bounds
};
