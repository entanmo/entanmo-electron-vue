系统结构：  
  采用 express 创建 http-server 提供 http 服务  
  利用 jquery 来请求 http 服务， 并在界面显示数据  
  采用 electron 来生成界面  

依赖的库：  
  express  
  electron  
  electron-forge  
  async  

主要的文件:  
  package.json  
  http-server.js  
  src/index.js  
  src/index-jquery.html  

关键技术难点：  

1. 一些数据获取， 比如说 磁盘空间，显卡类型， 需要调用系统的 shell 命令， 根据不同系统，命令会有差别  
2. 进程的启动和重启，获取状态。 这个是采用了 pm2。 在运行之前， 需要初始化 pm2  
   ETM_HOME/node_modules/pm2/bin/pm2 update  
   ETM_HOME/node_modules/pm2/bin/pm2 start ETM_HOME/app.js --name entanmo  

    为了简化， 在运行前， 需要设置环境变量 ETM_HOME  

3. 获取本地 delegate 出快情况  
   加载 ETM_HOME/config/config.json， 然后获取里边的 secret， 利用 async.parallel 请求获取出快状态，最后返回  
4. 显卡出快检查  
   由于自己的电脑显卡没法通过检查， 索引我写了两个虚拟的函数 mintSetup 和 mint， 生产环境时替换成 node-pow-addon 里边的就可以了。 mint_test 这个函数，会调用 mint，并将结果统计  

启动前准备工作：  

1.  npm install  
    npm install electron -g  
    npm install express -g  
    npm install electron-forge -g  
    2.  设置环境变量 ETM_HOME， 指向 ETM 的源代码路径  
    3.  ETM_HOME/node_modules/pm2/bin/pm2 update  
    4.  ETM_HOME/node_modules/pm2/bin/pm2 start ETM_HOME/app.js --name entanmo  
    5.  electron-forge start (这个会同时启动 http-server 和 界面程序)  

文件说明：  

1.  http-server.js  
    这个文件是服务文件， 所有的服务都在这一个文件里边， 不依赖其他的源代码文件  


    包含的接口：  
    1.1 获取本地网口状态  
    url ：/api/system/networkInterfaces
    返回   [{"interface":"en0","address":"10.234.22.104"}]  
  
    1.2 获取本地区块链同步状态  
    url: /api/system/syncState  
    返回  
    {  
        "success": true,  
        "code": 0,  
        "data": {  
            "height": 15051,  
            "syncing": false,  
            "blocks": 0  
        }  
    }  
  
    1.3 获取显卡状态  
    url: /api/system/display  
    返回  
    {  
        "success": true,  
        "code": 0,  
        "data": {  
            "Chipset Model": "Intel Iris",  
            "VRAM (Dynamic, Max)": "1536 MB",  
            "Vendor": "Intel",  
            "Display Type": "Built-In Retina LCD",  
            "Resolution": "2560 x 1600 Retina"  
        }  
    }  
    
    1.4 启动区块链进程  
    url: /api/process/start  
    {  
        "success": true,  
        "code": 0,  
        "out": "",  
        "err": ""  
    }  
    
    1.5 停止区块链进程  
    url: /api/process/stop  
    {  
        "success": true,  
        "code": 0,  
        "out": "",  
        "err": ""  
    }  
    
    1.6 获取进程状态  
    url: /api/process/status  
    {  
        "success": true,  
        "code": 0,  
        "data": {  
            "status": "online",  
            "version": "1.3.6",  
            "uptime":  "100s",  
            "script path" :"/Users/zhengkaihua/workspace/entanmo/etm/app.js",  
            "node.js version": "8.4.0",  
            "unstable restarts": "0"  
        }  
    }  
    
    1.7 本区块链出快状态  
    url: /api/chain/forgeStatus  
    {  
        "success": true,  
        "code": 0,  
        "data": [{  
            "username": "asch_g5",  
            "address": "5277565260144300464",  
            "balance": 532,  
            "producedblocks": 154,  
            "missedblocks": 3,  
            "productivity": 98.09,  
            "rewards": 532,  
            "forged": 532  
        }]  
    }  
    
    1.8 磁盘使用情况  
    url: /api/process/du  
    {  
        "success": true,  
        "code": 0,  
        "data": "319M"  
    }  
    
    1.9 显卡测试  
    url: /api/system/forgeTest  
    {  
        "success": true,  
        "code": 0,  
        "data": {  
            "support": true,  
            "hasError": false,  
            "times": 5,  
            "passed": 5,  
            "totalCost": 2330  
        }  
    }  
  
    1.10 查看日志  
    url: /api/process/logs  
  
    2.  src/index.js  
    这个是用 electron-forge 的 vue 模块生产的文件, 我只是把里边加载的 index.html 换成了index-jquery.html， 并添加了一句
    webPreferences: {  
      nodeIntegration: false  
    }， 以便支持 jquery 库的加载  
    
    3.  src/index-jquery.html  
      这个文件，主要是使用 jquery， 来异步调用http 接口， 并修改页面内容  
  
