
import { Emitter } from './Emitter.mjs';
import { URL     } from './parser/URL.mjs';
import { Blocker } from './request/Blocker.mjs';
// import { Downloader } from './request/Downloader.mjs';


let _id = 0;

const Request = function(data, stealth) {

	let settings = Object.assign({}, data);


	Emitter.call(this);


	this.id       = 'request-' + _id++;
	this.config   = settings.config || null;
	this.prefix   = settings.prefix || '/stealth/';
	this.ref      = null;
	this.response = null;
	this.stealth  = stealth;
	this.url      = null;
	this.timeline = {
		init:     null,
		kill:     null,
		cache:    null,
		connect:  null,
		download: null,
		filter:   null,
		optimize: null,
		error:    null,
		ready:    null
	};


	let ref = settings.ref || null;
	let url = settings.url || null;

	if (ref !== null) {

		this.ref = ref;
		this.url = this.ref.url;

	} else if (url !== null) {

		this.ref = URL.parse(url);
		this.url = this.ref.url;

	}


	// this.emit('error', [ { type: 'url' } ]);
	// this.emit('ready', [ { headers: {}, payload: null } ]);

	this.on('cache', _ => {

		this.stealth.server.services.cache.read(this.ref, response => {

			this.timeline.cache = Date.now();

			if (response.payload !== null) {
				this.response = response;
				this.emit('ready', [ this.response ]);
			} else {
				this.emit('block');
			}

		});

	});

	this.on('block', _ => {

		let blockers = this.stealth.settings.blockers || null;
		if (blockers !== null) {

			Blocker.check(blockers, this.ref, blocked => {

				if (blocked === true) {
					this.emit('ready', [ null ]);
				} else {
					this.emit('connect');
				}

			});

		}

	});

	this.on('connect', _ => {

		if (this.ref.host !== null) {

			this.timeline.connect = Date.now();
			this.emit('download');

		} else {

			this.stealth.server.services.host.read(this.ref, response => {

				this.timeline.connect = Date.now();

				if (response.payload !== null) {

					if (response.ipv6 !== null) {
						this.ref.host = response.ipv6;
					} else if (response.ipv4 !== null) {
						this.ref.host = response.ipv4;
					}

				}

				if (this.ref.host !== null) {
					this.emit('download');
				} else {
					this.emit('error', [{
						type: 'connect'
					}]);
				}

			});

		}

	});

	this.on('download', _ => {

		// TODO: download stuff via net.Socket()
		// TODO: After download is completed, call cache.save()
		// TODO: If download was partial, resume download

		this.emit('error', [{
			type: 'connect'
		}]);
		console.log(this.url, this.config);

	});

	this.on('filter', _ => {

		// TODO: filter stuff via optimizer/<MIME>.mjs#filter()

	});

	this.on('optimize', _ => {

		// TODO: optimize stuff via optimizer/<MIME>.mjs#optimize()

	});

	this.on('render', _ => {
		// TODO: render stuff with different URLs
		// and prefix everything to /stealth
	});

};


Request.prototype = Object.assign({}, Emitter.prototype, {

	init: function() {

		if (this.timeline.init === null) {
			this.timeline.init = Date.now();
			this.emit('cache');
		}

	},

	kill: function() {

		// TODO: Stop download(s)

	}

});


export { Request };

