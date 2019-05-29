//express_demo.js 文件
var express = require('express')
const fs = require('fs')
var app = express()
var os = require('os')
const {
	spawn
} = require('child_process')

const START_ETM_CMD = ''
const STOP_ETM_CMD = ''
const ETM_STATUS_CMD = ''
const ETM_WORK_DIR = process.env.ETM_HOME || '/Users/zhengkaihua/workspace/entanmo/etm'
const PM2_CMD = ETM_WORK_DIR + '/node_modules/pm2/bin/pm2'
const ETM_PM2_NAME = 'entanmo'

function do_rest_get(url, cb) {
	var http = null
	if (url.startsWith('https')) {
		http = require('https')
	} else {
		http = require('http')
	}

	http.get(url, res => {
		const {
			statusCode
		} = res
		const contentType = res.headers['content-type']

		let error
		if (statusCode !== 200) {
			error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`)
		} else if (!/^application\/json/.test(contentType)) {
			//  error = new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`)
		}
		if (error) {
			//console.error(error.message);
			cb(error, null)
			// Consume response data to free up memory
			res.resume()
			return
		}

		res.setEncoding('utf8')
		let rawData = ''
		res.on('data', chunk => {
			rawData += chunk
		})
		res.on('end', () => {
			try {
				const parsedData = JSON.parse(rawData)
				cb(null, parsedData)
				//console.log(parsedData);
			} catch (e) {
				//console.error(e.message);
				cb(e, null)
			}
		})
	}).on('error', e => {
		//console.error(`Got error: ${e.message}`);
		cb(e, null)
	})
}

function get_network_addresses(family = 'IPv4') {
	const addresses = []
	const os = require('os')
	// console.log()
	const networks = os.networkInterfaces()
	// array.forEach(element => {})

	//console.log(JSON.stringify(networks))
	for (key in networks) {
		//console.log("======key======")
		for (detail in networks[key]) {
			if (networks[key][detail].family == family) {
				if (networks[key][detail].internal == true) {
					continue
				}
				addresses.push({
					interface: key,
					address: networks[key][detail].address,
				})
			}
		}
	}
	return addresses
}

app.all('/api', function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS')
	res.header('Access-Control-Allow-Headers', 'X-Requested-With')
	res.header('Access-Control-Allow-Headers', 'Content-Type')
	next()
})

app.get('/api/system/networkInterfaces', function (req, res) {
	res.header('Access-Control-Allow-Origin', '*')
	var ret = get_network_addresses()
	res.json(ret)
})

app.get('/api/system/syncState', function (req, res) {
	res.header('Access-Control-Allow-Origin', '*')
	var url = "http://localhost:4096/api/loader/status/sync"
	do_rest_get(url, function (err, data) {
		if (err) {
			res.json({
				success: false,
				code: 400,
				err
			})
		} else {
			res.json({
				success: true,
				code: 0,
				data: {
					height: data['height'],
					syncing: data['syncing'],
					blocks: data['blocks']
				}
			})
		}
	})
})

/*
app.get('/api/system/info', function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  os.freemem()
  os.cpus()
  os.arch()
  os.platform()
})
*/

function run_cmd(command, arglist, cb) {
	try {
		const cmd = spawn(command, arglist)
		const buf = {
			outBuffer: '',
			errBuffer: '',
		}

		cmd.stdout.on('data', data => {
			console.log(`stdout: ${data}`)
			buf.outBuffer = buf.outBuffer + data
		})
		cmd.stderr.on('data', data => {
			console.log(`stderr: ${data}`)
			buf.errBuffer = buf.errBuffer + data
		})

		cmd.on('close', code => {
			console.log(`child process exited with code ${code}`)
			cb(null, code, buf.outBuffer, buf.errBuffer)
		})
	} catch (error) {
		console.log(error)
		cb(error)
	}
}

app.get('/api/system/display', function (req, res) {
	res.header('Access-Control-Allow-Origin', '*')
	var cmd = ''
	var args = []
	if (process.platform == 'darwin') {
		cmd = 'system_profiler'
		args = ['SPDisplaysDataType']
	} else if (process.platform == 'win32') {
		cmd = 'dxdiag'
		args = ['/t', 'dxdiag_out.txt']
	} else {
		// aix, freebsd, linux, openbsd, sunos
		cmd = 'lshw -C display'
		args = ['-C', 'display']
	}
	// 高度， 端口， ip， 工作目录，os，
	run_cmd(cmd, args, function (err, code, outData, errData) {
		if (err) {
			res.json({
				success: false,
				err,
			})
		} else {
			if (code == 0) {
				if (process.platform == 'win32') {
					fs.readFile('dxdiag_out.txt', (err, data) => {
						if (err) {
							//throw err;
							res.json({
								success: false,
								code: 1,
								err: err,
							})
						} else {}
						//console.log(data);
					})
				} else if (process.platform == 'darwin') {} else {}
				var lines = outData.split('\n')
				const data = {}
				for (idx in lines) {
					var pos = lines[idx].indexOf(':')
					if (pos > 0) {
						var key = lines[idx].substring(0, pos).trim()
						var fieldValue = lines[idx].substring(pos + 1).trim()
						data[key] = fieldValue
					} else {
						continue
					}
				}
				res.json({
					success: true,
					code: code,
					data,
				})
			} else {
				res.json({
					success: false,
					code: code,
					err: errData,
				})
			}
		}
	})
})

app.get('/api/process/start', function (req, res) {
	res.header('Access-Control-Allow-Origin', '*')
	run_cmd(PM2_CMD, ['start', ETM_PM2_NAME], function (err, code, outData, errData) {
		if (err) {
			res.json({
				success: false,
				err,
			})
		} else {
			res.json({
				success: true,
				code,
				out: outData,
				err: errData,
			})
		}
	})
})

app.get('/api/process/stop', function (req, res) {
	res.header('Access-Control-Allow-Origin', '*')
	run_cmd(PM2_CMD, ['stop', ETM_PM2_NAME], function (err, code, outData, errData) {
		if (err) {
			res.json({
				success: false,
				err,
			})
		} else {
			res.json({
				success: true,
				code,
				out: outData,
				err: errData,
			})
		}
	})
})

//

app.get('/api/process/status', function (req, res) {
	res.header('Access-Control-Allow-Origin', '*')
	// 高度， 端口， ip， 工作目录，os，
	run_cmd(PM2_CMD, ['describe', ETM_PM2_NAME], function (err, code, outData, errData) {
		if (err) {
			res.json({
				success: false,
				err,
			})
		} else {
			if (code == 0) {
				var lines = outData.split('\n')
				// var status = ''
				// var version = ''
				// var uptime = ''
				// var cwd = ''
				// var nodeVersion = ''
				// var keys = ['status', 'version', 'uptime', 'script path', 'node.js version', 'unstable restarts', 'created at']
				const data = {}
				for (idx in lines) {
					lines[idx] = lines[idx].trim()
					if (lines[idx].startsWith('│')) {
						lines[idx] = lines[idx].substring(1, lines[idx].length - 1)
						var pos = lines[idx].indexOf(' │')
						if (pos > 0) {
							var key = lines[idx].substring(0, pos).trim()
							var fieldValue = lines[idx].substring(pos + 2).trim()
							data[key] = fieldValue
							//console.log(key + ", " + fieldValue)
							// for (i in keys) {
							//   if (keys[i] == key) {
							//     data[key] = fieldValue
							//   }
							// }
						}
					} else {
						continue
					}
				}
				res.json({
					success: true,
					code: code,
					data,
				})
			} else {
				res.json({
					success: false,
					code: code,
					err: errData,
				})
			}
		}
	})
})

const etmConfig = require(ETM_WORK_DIR + '/config/config.json')
const async = require('async')
app.get('/api/chain/forgeStatus', function (req, res) {
	res.header('Access-Control-Allow-Origin', '*')
	if (etmConfig.forging.secret) {
		const secrets = JSON.parse(JSON.stringify(etmConfig.forging.secret.slice(0, 5)))
		var funcArr = new Array()
		for (var k = 0; k < secrets.length; k++) {
			funcArr[k] = callback => {
				var secret = secrets.pop()
				var etmJs = require('etm-js')
				var keyPair = etmJs.crypto.getKeys(secret)
				//var url = "https://api.entanmo.com/api/delegates/get?publicKey=" + keyPair.publicKey
				var url = 'http://localhost:4096/api/delegates/get?publicKey=' + keyPair.publicKey
				do_rest_get(url, function (err, data) {
					//console.log(data)
					callback(err, data)
				})
			}
		}
		async.parallel(funcArr, function (err, resp) {
			if (err) {
				res.json({
					success: false,
					code: 400,
					err,
				})
			} else {
				var retArr = []
				for (idx in resp) {
					if (resp[idx]['success']) {
						var obj = resp[idx]['delegate']
						retArr[idx] = {
							username: obj['username'],
							address: obj['address'],
							balance: obj['balance'] / 100000000,
							producedblocks: obj['producedblocks'],
							missedblocks: obj['missedblocks'],
							productivity: obj['productivity'],
							rewards: obj['rewards'] / 100000000,
							forged: obj['forged'] / 100000000,
						}
					}
				}

				res.json({
					success: true,
					code: 0,
					data: retArr,
				})
			}
		})
	}
})

app.get('/api/process/du', function (req, res) {
	res.header('Access-Control-Allow-Origin', '*')
	// 高度， 端口， ip， 工作目录，os，
	run_cmd('du', ['-sh', ETM_WORK_DIR], function (err, code, outData, errData) {
		if (err) {
			res.json({
				success: false,
				err,
			})
		} else {
			if (code == 0) {
				var diskUsage = outData.split('\t')[0]
				res.json({
					success: true,
					code: code,
					data: diskUsage,
				})
			} else {
				res.json({
					success: false,
					code: code,
					data: errData,
				})
			}
		}
	})
})

function mintSetup() {
	return true;
}

function mint(initValue, targetValue, cb) {
	//console.log(initValue + ", " + targetValue)
	const cost = Math.round(1000 * Math.random())
	setTimeout(function () {

		cb(null, {
			done: true,
			value: {
				src: initValue,
				cost: cost,
				difficulty: targetValue.length,
				nonce: Math.round(Math.random() * 10000),
				target: targetValue
			}
		})
	}, cost)
}

function mint_test(times, cb) {
	let beg = new Date().getTime()
	const costArr = []
	const async = require('async')
	async.timesSeries(times, function (n, next) {
		mint(n, "1111", function (err, user) {
			let cur = new Date().getTime()
			costArr[n] = cur - beg;
			beg = cur;
			// console.log("Cost " + costArr[n] + " ms")
			next(err, user);
		});
	}, function (err, users) {
		cb(err, costArr, users)
	});
}

app.get('/api/system/forgeTest', function (req, res) {
	res.header('Access-Control-Allow-Origin', '*')
	// 高度， 端口， ip， 工作目录，os，
	if (!mintSetup()) {
		res.json({
			success: true,
			code: 0,
			data: {
				support: false
			}
		})
	} else {
		mint_test(5, function (err, costArr, results) {
			var hasError = false;
			if (err) {
				hasError: true
			}
			var totalCost = 0
			for (idx in costArr) {
				totalCost += costArr[idx]
			}
			res.json({
				success: true,
				code: 0,
				data: {
					support: true,
					hasError: hasError,
					times: 5,
					passed: results.length,
					totalCost
				}
			})
		})
	}
})

app.get('/api/process/logs', function (req, res) {
	res.header('Access-Control-Allow-Origin', '*')
	// 高度， 端口， ip， 工作目录，os，
	run_cmd(PM2_CMD, ['logs', '--nostream', '--lines', '10', ETM_PM2_NAME], function (err, code, outData, errData) {
		if (err) {
			res.json({
				success: false,
				err,
			})
		} else {
			if (code == 0) {
				res.json({
					success: true,
					code: code,
					data: outData,
				})
			} else {
				res.json({
					success: false,
					code: code,
					data: errData,
				})
			}
		}
	})
})

// var etmJson = require('./config/config.json');
// if (etmJson.forging.secret) {
//   etmJson.forging.secret.forEach(function (item) {

//     //console.log(item)
//     //get_forge_status(item)
//     //process.exit(0)
//   })
// }

var server = app.listen(8081, function () {
	var host = server.address().address
	var port = server.address().port

	console.log('应用实例，访问地址为 http://%s:%s', host, port)
})