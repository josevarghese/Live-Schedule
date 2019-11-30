'use strict';
/**
 * Service Worker of WordCamp Kochi
 * @author: Jose Varghese
 * @twitter: IamJoseVarghese
 */
const cacheName = 'wordcampkochi.20.19';
const startPage = 'https://wc.wpkochi.org/';
const offlineFallbackPage = 'https://wc.wpkochi.org/';
const filesToCache = [startPage, offlineFallbackPage, 'https://wc.wpkochi.org/'];

// Install stage sets up the offline page in the cache and opens a new cache
self.addEventListener('install', function(e) {
	console.log('[WordCamp Kochi]: service worker installation progress');
	e.waitUntil(
		caches.open(cacheName).then(function(cache) {
			console.log('[WordCamp Kochi]: service worker caching dependencies');
			filesToCache.map(function(url) {
				return cache.add(url).catch(function (reason) {
					return console.log('[WordCamp Kochi]: ' + String(reason) + ' ' + url);
				});
			});
		})
	);
});

// Activate
self.addEventListener('activate', function(e) {
	console.log('[WordCamp Kochi]: service worker activate');
	e.waitUntil(
		caches.keys().then(function(keyList) {
			return Promise.all(keyList.map(function(key) {
				if ( key !== cacheName ) {
					console.log('[WordCamp Kochi]: old cache removed', key);
					return caches.delete(key);
				}
			}));
		})
	);
	return self.clients.claim();
});

// If any fetch fails, it will show the offline page.
self.addEventListener('fetch', function(e) {
	
	if ( e.request.method !== 'GET' ) {
		e.respondWith(
			fetch(e.request).catch( function() {
				return caches.match(offlineFallbackPage);
			})
		);
		return;
	}
	
	// Revive
	if ( e.request.mode === 'navigate' && navigator.onLine ) {
		e.respondWith(
			fetch(e.request).then(function(response) {
				return caches.open(cacheName).then(function(cache) {
					cache.put(e.request, response.clone());
					return response;
				});  
			})
		);
		return;
	}

	e.respondWith(
		caches.match(e.request).then(function(response) {
			return response || fetch(e.request).then(function(response) {
				return caches.open(cacheName).then(function(cache) {
					cache.put(e.request, response.clone());
					return response;
				});  
			});
		}).catch(function() {
			return caches.match(offlineFallbackPage);
		})
	);
	
});
