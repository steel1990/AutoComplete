//server side code(node.js)
var http = require('http'),
	Url = require("url"),
	fs = require('fs');

http.createServer(function (request, response) {
	var pathname = Url.parse(request.url).pathname;
	console.log(pathname);
	if(/^\/random\/?$/i.test(pathname)){
		randomHandler(request, response);
		return;
	}else if(/^\/city\/?$/i.test(pathname)){
		cityHandler(request, response);
		return;
	}else if(/^\/?$/.test(pathname)){
		pathname = "index.html";
	}
	
	getFile(response, './' + pathname);
}).listen(80);

console.log('Server running at http://127.0.0.1/');

function getFile(res, path){
	fs.readFile(path, function (err, data) {
		var match = /.([\w]+)$/.exec(path),
			t,
			Type = {
				"js" : "application/x-javascript",
				"htm" : "text/html",
				"html" : "text/html",
				"json" : "application/json",
				"css" : "text/css"
			};
		if (err){
			data = "error";
		}
		t = match ? match[1] : "html";
		if(t){
			res.writeHead(200, {'Content-Type': Type[t.toLowerCase()] });
		}else{
			res.writeHead(200, {'Content-Type': 'text/html'});
		}
		res.end(data);
	});
}

function randomHandler(req, res){
	var s = Url.parse(req.url, true).query.s,
		str = '百度拥有数千名研发工程师这是中国乃至全球最为优秀的技术团队这' + 
			'支队伍掌握着世界上最为先进的搜索引擎技术使百度' + 
			'成为中国掌握世界尖端科学核心技术的中国高科技企业也使中国成为美国' + 
			'俄罗斯和韩国之外全球仅有的4个拥有搜索引擎核心技术的国家之一',
		result = {},
		i,
		len = createRandom(1, 10);
	result.status = 0;
	result.data = [];
	for(i = 0; i < len; i += 1){
		result.data.push({
			"id" : i,
			"text" : s + str[createRandom(0, str.length)]
		});
	}
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
	res.end(JSON.stringify(result));
}

function cityHandler(req, res){
	var s = Url.parse(req.url, true).query.s;
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
	res.end(JSON.stringify(getCityInfo(s)));
}

function getCityInfo(s){
	var allCity = require("./js/areaJson.js").area,
		result = {},
		i, len;
	result.status = 0;
	result.data = [];
	for(i = 0, len = allCity.length; i < len; i += 1){
		if(allCity[i].text.indexOf(s) === 0){
			result.data.push(allCity[i]);
		}
	}
	return result;
}

function createRandom(min, max){
	return Math.floor(Math.random() * (max - min)) + min;
}