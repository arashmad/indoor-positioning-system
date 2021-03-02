// -----------------------------
// developed by HanaTech Team
// Hanatech IOT Solutions
// (PERN) PostgreSQL / Express / React / Node
//------------------------------


const winston = require('winston');
const { spawn, exec } = require("child_process");
const request = require('request');

const PGService = require('./pg.db..model.js.js');
const dirs = require('../config').dirs;

const logger = winston.createLogger({
	'transports': [
		new winston.transports.File({
			filename: `${dirs.logDir}logs/log.log`
		})
	]
});

class OSService {
	constructor(serviceInfo) {
		this.id = serviceInfo.id;
		this.name = serviceInfo.name;
		this.ip = serviceInfo.ip;
		this.port = serviceInfo.port;
		this.startup_timeout = serviceInfo.startup_timeout;
		this.status = serviceInfo.status;
		this.health = serviceInfo.health;
		this.health_call = serviceInfo.health_call;
		this.start = serviceInfo.start;
		this.start_call = serviceInfo.start_call ? serviceInfo.start_call : null;
		this.icon = serviceInfo.icon;
	}

	serviceHealth(callback) {
		if (!this.health_call) {
			const pgEntity = new PGService();
			pgEntity.checkConnection(res => {
				if (!res.err) {
					return callback({ err: 0, health: true });
				} else {
					return callback({ err: 0, health: false });
				}
			})
		} else {
			request
				.get(this.health_call.uri, {
					auth: this.health_call.auth ? this.health_call.auth : '',
					headers: { "content-type": "application/json" },
					timeout: this.health_call.timeout
				})
				.on('response', res => {
					if (res.statusCode == 200) {
						return callback({ err: 0, health: true });
					} else {
						return callback({ err: 0, health: false });
					}
				})
				.on('error', err => {
					return callback({ err: 1, health: false });
				})
		}
	}

	findServiceName(callback) {
		const command = `sc queryex type= service state= all | find /i "${this.name}"`;
		exec(command, function (err, stdout) {
			if (err) {
				return callback({ err: 1 });
			} else {
				return callback({ err: 0, name: stdout.split('\n')[0].replace('SERVICE_NAME: ', '') });
			}
		});
	}

	serviceStatus(callback) {
		const command = `netStat -ano | find ":${this.port}" | findstr LISTENING`;
		exec(command, function (err, stdout) {
			if (err) {
				return callback({ err: 1, status: 'stopped', serviceInfo: null });
			} else {
				var serviceInfo = stdout.match(/("[^"]+"|[^"\s]+)/g);
				return callback({ err: 0, status: 'running', serviceInfo: serviceInfo });
			}
		});
	}

	serviceStart(callback) {
		var sName = this.name;
		var sPort = this.port;
		var times = {}
		var timeout = this.startup_timeout ? this.startup_timeout : 5000;

		// console.log('!_!_!_!__!_!_!!__!_!__!!_!_ ' , this.startup_timeout , sName , ' : ' , sPort , ' ' , 'serviceStart() _!__!_!_!_!_!_!_!_!_!_!_!_!__!!_!_!__!_')
		this.serviceStatus(res0 => {
			if (!res0.err) {
				const status = res0.serviceInfo[3];
				if (status === 'LISTENING') {
					return callback({ err: 0, msg: `service ${sName.toUpperCase()} is running now on port ${sPort}.` });
				}
			} else {
				const processor = this.start.split(':')[0];
				if (processor === 'spawn') {
					const batFile = `${dirs.batDir}${this.start.split(':')[1]}`;
					const process = spawn('cmd.exe', ['/c', batFile]);
					process.stdout.on('data', data => {
						times[sName] = Date.now();
						const stdout = data.toString();
						// console.log('stdout:' , sName , ' ' , sPort , ' ' , times[sName])
						// console.log(stdout)
						logger.log({
							message: stdout,
							level: 'info'
						});
						// if (stdout.match(this.start_call)) {
						// 	callback({ err: 0, msg: `service ${sName.toUpperCase()} was started on port ${sPort}.` });
						// }

						setTimeout(function () {
							// console.log('STTOUT timeOut Check ' + sName + ' ' , Date.now() - (times[sName] + timeout))
							if (times[sName] && times[sName] + timeout < Date.now()) {
								// console.log('\x1b[32m' , sName,' ------------------------ @@ SERVICE IDLE @@ ---------------------------')
								// console.log('STTOUT ' , Date.now() - times[sName] + 's Ago ')
								times[sName] = null;
								this.serviceStatus(res0 => {
									if (!res0.err) {
										const status = res0.serviceInfo[3];
										if (status === 'LISTENING') {
											// console.log('Running !')
											return callback({ err: 0, msg: `service ${sName.toUpperCase()} was started on port ${sPort}.` });
										}
									} else {
										// console.log('Not Running !')
										return callback({ err: 1, msg: `service ${sName.toUpperCase()} not running on port ${sPort}.` });
									}
								});
							}
						}.bind(this), timeout)
					});
					process.stderr.on('data', data => {
						times[sName] = Date.now();
						const stderr = data.toString();
						// console.log('stderr:' , sName , ' ' , sPort , ' ' ,  times[sName])
						// console.log(stderr)
						logger.log({
							message: stderr,
							level: 'error'
						});
						// if (stderr.match(this.start_call)) {
						// 	callback({ err: 0, msg: `service ${sName.toUpperCase()} was started on port ${sPort}.` });
						// }

						setTimeout(function () {
							// console.log('STDERR timeOut Check ' + sName + ' ' , Date.now() - (times[sName] + timeout))
							if (times[sName] && times[sName] + timeout < Date.now()) {
								// console.log('\x1b[32m' , sName,' ------------------------ @@ SERVICE IDLE @@ ---------------------------')
								// console.log('STDERR ' , Date.now() - times[sName] + 's Ago ')
								times[sName] = null;
								this.serviceStatus(res0 => {
									if (!res0.err) {
										const status = res0.serviceInfo[3];
										if (status === 'LISTENING') {
											// console.log('Running !')
											return callback({ err: 0, msg: `service ${sName.toUpperCase()} was started on port ${sPort}.` });
										}
									} else {
										// console.log('Not Running !')
										return callback({ err: 1, msg: `service ${sName.toUpperCase()} not running on port ${sPort}.` });
									}
								});
							}
						}.bind(this), timeout)

					});
				} else if (processor === 'exec') {
					this.findServiceName(res => {
						if (!res.err) {
							const command = `net start ${res.name}`;
							exec(command, function (err, stdout, stderr) {
								if (stdout) {
									logger.log({
										message: stdout.toString(),
										level: 'info'
									});
									callback({ err: 0, msg: `service ${sName.toUpperCase()} was started on port ${sPort}.` });
								}
								if (stderr) {
									logger.log({
										message: stderr.toString(),
										level: 'error'
									});
								}
								if (err) {
									callback({ err: 1, msg: err, status: -1 });
								}
							});
						} else {
							console.log('Error in terminating service.')
						}
					})
				}
			};
		});
	};

	serviceStop(callback) {
		var sName = this.name;
		var sPort = this.port;
		this.serviceStatus(res => {
			if (!res.err) {
				const status = res.serviceInfo[3];
				if (status === 'LISTENING') {
					const command = `taskkill /PID ${res.serviceInfo[4]} /F`;
					exec(command, function (err, stdout, stderr) {
						if (stdout) {
							logger.log({
								message: stdout.toString(),
								level: 'info'
							});
							callback({ err: 0, msg: `service ${sName.toUpperCase()} on port ${sPort} was terminated.` });
						}
						if (stderr) {
							logger.log({
								message: stderr.toString(),
								level: 'error'
							});
						}
						if (err) {
							callback({ err: 1, msg: err, status: -1 });
						}
					});
				};
			} else {
				callback({ err: 1, msg: `service ${sName.toUpperCase()} has alreay been stopped.` });
			};
		});
	};
};

module.exports = OSService;


// const winston = require('winston');
// const { spawn, exec } = require("child_process");
// const request = require('request');

// const PGService = require('./PGService');
// const dirs = require('../data/config').dirs;

// const logger = winston.createLogger({
// 	'transports': [
// 		new winston.transports.File({
// 			filename: `${dirs.logDir}logs/log.log`
// 		})
// 	]
// });

// class OSService {
// 	constructor(serviceInfo) {
// 		this.id = serviceInfo.id;
// 		this.name = serviceInfo.name;
// 		this.ip = serviceInfo.ip;
// 		this.port = serviceInfo.port;
// 		this.status = serviceInfo.status;
// 		this.health = serviceInfo.health;
// 		this.health_call = serviceInfo.health_call;
// 		this.start = serviceInfo.start;
// 		this.start_call = serviceInfo.start_call ? serviceInfo.start_call : null;
// 		this.icon = serviceInfo.icon;
// 	}

// 	serviceHealth(callback) {
// 		if (!this.health_call) {
// 			const pgEntity = new PGService();
// 			pgEntity.checkConnection(res => {
// 				if (!res.err) {
// 					callback({ err: 0, health: true });
// 				} else {
// 					callback({ err: 0, health: false });
// 				}
// 			})
// 		} else {
// 			request
// 				.get(this.health_call.uri, {
// 					auth: this.health_call.auth ? this.health_call.auth : '',
// 					headers: { "content-type": "application/json" },
// 					timeout: this.health_call.timeout
// 				})
// 				.on('response', res => {
// 					if (res.statusCode == 200) {
// 						callback({ err: 0, health: true });
// 					} else {
// 						callback({ err: 0, health: false });
// 					}
// 				})
// 				.on('error', err => {
// 					callback({ err: 1, health: false });
// 				})
// 		}
// 	}

// 	findServiceName(callback) {
// 		const command = `sc queryex type= service state= all | find /i "${this.name}"`;
// 		exec(command, function (err, stdout) {
// 			if (err) {
// 				callback({ err: 1 });
// 			} else {
// 				callback({ err: 0, name: stdout.split('\n')[0].replace('SERVICE_NAME: ', '') });
// 			}
// 		});
// 	}

// 	serviceStatus(callback) {
// 		const command = `netStat -ano | find ":${this.port}" | findstr LISTENING`;
// 		exec(command, function (err, stdout) {
// 			if (err) {
// 				callback({ err: 1, status: 'stopped', serviceInfo: null });
// 			} else {
// 				var serviceInfo = stdout.match(/("[^"]+"|[^"\s]+)/g);
// 				callback({ err: 0, status: 'running', serviceInfo: serviceInfo });
// 			}
// 		});
// 	}

// 	serviceStart(callback) {
// 		var sName = this.name;
// 		var sPort = this.port;
// 		this.serviceStatus(res0 => {
// 			if (!res0.err) {
// 				const status = res0.serviceInfo[3];
// 				if (status === 'LISTENING') {
// 					callback({ err: 1, msg: `service ${sName.toUpperCase()} is running now on port ${sPort}.` });
// 				}
// 			} else {
// 				const processor = this.start.split(':')[0];
// 				if (processor === 'spawn') {
// 					const batFile = `${dirs.batDir}${this.start.split(':')[1]}`;
// 					const process = spawn('cmd.exe', ['/c', batFile]);
// 					process.stdout.on('data', data => {
// 						const stdout = data.toString();
// 						// console.log('stdout:')
// 						// console.log(stdout)
// 						logger.log({
// 							message: stdout,
// 							level: 'info'
// 						});
// 						if (stdout.match(this.start_call)) {
// 							callback({ err: 0, msg: `service ${sName.toUpperCase()} was started on port ${sPort}.` });
// 						}
// 					});
// 					process.stderr.on('data', data => {
// 						const stderr = data.toString();
// 						// console.log('stderr:')
// 						// console.log(stderr)
// 						logger.log({
// 							message: stderr,
// 							level: 'error'
// 						});
// 						if (stderr.match(this.start_call)) {
// 							callback({ err: 0, msg: `service ${sName.toUpperCase()} was started on port ${sPort}.` });
// 						}
// 					});
// 				} else if (processor === 'exec') {
// 					this.findServiceName(res => {
// 						if (!res.err) {
// 							const command = `net start ${res.name}`;
// 							exec(command, function (err, stdout, stderr) {
// 								if (stdout) {
// 									logger.log({
// 										message: stdout.toString(),
// 										level: 'info'
// 									});
// 									callback({ err: 0, msg: `service ${sName.toUpperCase()} was started on port ${sPort}.` });
// 								}
// 								if (stderr) {
// 									logger.log({
// 										message: stderr.toString(),
// 										level: 'error'
// 									});
// 								}
// 								if (err) {
// 									callback({ err: 1, msg: err, status: -1 });
// 								}
// 							});
// 						} else {
// 							console.log('Error in terminating service.')
// 						}
// 					})
// 				}
// 			};
// 		});
// 	};

// 	serviceStop(callback) {
// 		var sName = this.name;
// 		var sPort = this.port;
// 		this.serviceStatus(res => {
// 			if (!res.err) {
// 				const status = res.serviceInfo[3];
// 				if (status === 'LISTENING') {
// 					const command = `taskkill /PID ${res.serviceInfo[4]} /F`;
// 					exec(command, function (err, stdout, stderr) {
// 						if (stdout) {
// 							logger.log({
// 								message: stdout.toString(),
// 								level: 'info'
// 							});
// 							callback({ err: 0, msg: `service ${sName.toUpperCase()} on port ${sPort} was terminated.` });
// 						}
// 						if (stderr) {
// 							logger.log({
// 								message: stderr.toString(),
// 								level: 'error'
// 							});
// 						}
// 						if (err) {
// 							callback({ err: 1, msg: err, status: -1 });
// 						}
// 					});
// 				};
// 			} else {
// 				callback({ err: 1, msg: `service ${sName.toUpperCase()} has alreay been stopped.` });
// 			};
// 		});
// 	};
// };

// module.exports = OSService;


