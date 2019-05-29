const ENTANMO_API_HOST = 'api.entanmo.com'

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
          'interface': key,
          address: networks[key][detail].address
        })
      }
    }
  }
  return addresses
}

function is_dns_ok(cb) {
  const dns = require('dns')
  dns.lookup(ENTANMO_API_HOST, (err, address, family) => {
    // if (err) {
    //   console.log('DNS Loookup failed');
    // } else {
    //   console.log(`address: ${address}`);
    //   console.log(`family:${family}`);
    // }
    cb(err, address, family)
  })
}

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

function do_get(url, cb) {
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
    }
    if (error) {
      //console.error(error.message);
      cb(error, null)
      // Consume response data to free up memory
      res.resume()
      return
    }

    // res.setEncoding('utf8');
    let rawData = ''
    res.on('data', chunk => {
      rawData += chunk
    })
    res.on('end', () => {
      try {
        cb(null, rawData)
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

function get_mainnet_status(cb) {
  const url = 'https://api.entanmo.com/api/blocks/getStatus'
  do_rest_get(url, cb)
}

function get_delegates_count(cb) {
  const url = 'https://api.entanmo.com/api/delegates/count'
  do_rest_get(url, cb)
}

function get_loader_status(cb) {
  const url = 'https://api.entanmo.com/api/loader/status'
  do_rest_get(url, cb)
}

function get_loader_syn_status(cb) {
  const url = 'https://api.entanmo.com/api/loader/status/sync'
  do_rest_get(url, cb)
}

function get_dapp_list(cb) {
  const url = 'https://api.entanmo.com/api/dapps/'
  do_rest_get(url, cb)
}

function get_issuers_list(cb) {
  const url = 'https://api.entanmo.com/api/uia/issuers'
  do_rest_get(url, cb)
}

function get_asset_list(cb) {
  const url = 'https://api.entanmo.com/api/uia/assets'
  do_rest_get(url, cb)
}

function get_unconfirmed_trs(cb) {
  const url = 'https://api.entanmo.com/api/transactions/unconfirmed'
  do_rest_get(url, cb)
}

function get_peer_list(cb) {
  const url = 'https://api.entanmo.com/api/peers'
  do_rest_get(url, cb)
}

function get_testnet_status(cb) {
  const url = 'http://120.77.168.107:5000/api/blocks/getStatus'
  do_rest_get(url, cb)
}

function get_pub_ip(cb) {
  //const url = "http://pv.sohu.com/cityjson"
  //const url = "http://ip.ws.126.net/ipquery"
  const url = 'http://ip-api.com/json/'
  console.log(url)
  do_rest_get(url, cb)
}

function get_forge_status(secret, cb) {
  var etmJs = require("etm-js")
  var keyPair = etmJs.crypto.getKeys(secret)
  //var url = "https://api.entanmo.com/api/delegates/get?publicKey=" + keyPair.publicKey
  var url = "http://localhost:5000/api/delegates/get?publicKey=" + keyPair.publicKey
  do_rest_get(url, function (err, data) {
    cb(err, data)
    // if (err) {
    //   console.log(err.message)
    // } else {
    //   data = data.delegate
    //   console.log("======== " + data.username + " 出快情况如下")
    //   console.log("Rewards: " + data.rewards)
    //   console.log("Forged: " + data.producedblocks)
    //   console.log("Missed: " + data.missedblocks)
    //   console.log("Productivity:: " + data.productivity + "\n")
    // }
  })
}
/*
var addresses = get_network_addresses()
console.log("======== 本机IP 为： " + addresses + "\n")
get_pub_ip(function (err, data) {
  if (err) {
    console.log("获取公网ip失败")
    process.exit(0)
  } else {
    console.log("======== 获取公网ip成功, 信息如下 ========")
    console.log("IP： " + data.query)
    console.log("网络提供商： " + data.isp)
    console.log("地址： " + data.country + " " + data.regionName + " " + data.city + "\n")
  }
})

is_dns_ok(function (err, address, family) {
  if (err) {
    console.log('DNS Loookup failed');
  } else {
    //console.log(`address: ${address}`);
    //console.log(`family:${family}`);
    console.log('======== 与 ' + ENTANMO_API_HOST + "  网络连接正常\n");
  }
})


var etmJs = require("etm-js")
var etmJson = require('./config/config.json');
if (etmJson.forging.secret) {
  etmJson.forging.secret.forEach(function (item) {

    //console.log(item)
    get_forge_status(item)
    //process.exit(0)
  })
}

*/
// get_pub_ip(function (err, data) {
//   if (err) {
//     console.log("获取公网ip失败")
//     process.exit(0)
//   } else {
//     console.log("======== 获取公网ip成功, 信息如下 ========")
//     console.log("IP： " + data.query)
//     console.log("网络提供商： " + data.isp)
//     console.log("地址： " + data.country + " " + data.regionName + " " + data.city + "\n")
//   }
// })


var async = require('async');
// var values = new Array(1, 2, 3, 4);
// var vlen = values.length;
// var funcArr = new Array();
// for (var k = 0; k < vlen; k++) {
//   funcArr[k] = (callback) => {
//     //var m = values[k] //.pop();
//     return callback(null, k);
//   }
// }

// async.parallel(funcArr, function (err, resp) {
//   console.log(resp)
// });
// console.log("values..", values);

module.exports = {
  get_network_addresses,
  get_pub_ip,
  do_rest_get,
  do_get,
  is_dns_ok
}