const Msg = {
	Download: 1,
	ShowIcon: 2,
	UpdateSetting: 4,
	Close: 5,
	Document: 6,
	Progress: 7,
	ClosePopup: 8
};

const extTypes = [
	"image", "font", "js", "css", "others"
];
const mimeTypes = [
	"image", "font", "script", "css", "stream"
];

const DlType = {
	All : 0,
	KeepStyle : 1,
	Minimal : 2
};

var extapi = null;
if(typeof browser != "undefined") extapi = browser;
else if(typeof chrome != "undefined") extapi = chrome;
else extapi = window;


String.prototype.replaceAll = function (from, to) {
	var n = this.indexOf(from);
	if (n == -1) return this;

	var len = from.length, s = 0, res = "";
	while (n != -1) {
		res += this.substring(s, n) + to;
		s = n + len;
		n = this.indexOf(from, s);
	}
	return res + this.substring(s);
};

function ignoreError(){
	var rt = extapi.runtime;
	if(rt.lastError) delete rt.lastError;
}

function localize(name){
	var str = extapi.i18n.getMessage(name);
	if(!str) return "(\"" + name + "\" is not defined)";
	return str;
}

function getDefaultMaxValue(type){
	var pos = type.indexOf("_max");
	if(pos != -1) type = type.substring(0, pos);

	switch(type){
	case "image": return 10000;
	case "font": return 1000;
	case "js": return 260;
	case "css": return 260;
	default: return 0;
	}
}

var storage = {
	usesync: false,
	api: function(){
		var s = extapi.storage;
		if(!s) return null;
		return (storage.usesync === true && s.sync) ? s.sync : s.local;
	},
	syncSupport: function(){
		var s = extapi.storage;
		return (s && s.sync) ? true : false;
	},
	save: function(json, callback){
		var s = this.api();
		if(s){
			s.set(json, callback);
		}else{
			callback();
		}
	},
	load: function(keys, callback){
		var s = this.api();
		if(s){
			s.get(keys, callback);
		}else{
			callback(null);
		}
	},
	clear: function(callback){
		var s = this.api();
		if(s){
			s.clear(callback);
		}else{
			callback();
		}	
	}
}

function getDefaultSettings(){
	var ds = {};
	for(var i = 0, l = extTypes.length; i < l; i++){
		ds[extTypes[i] + "_max"] = getDefaultMaxValue(extTypes[i]);
	}
	ds.showsave = true;
	ds.dltype = DlType.All;
	ds.timeout = 60;
	ds.noscript = false;
	ds.loadlazy = true;
	return ds;
}

function loadSettings(callback){
	var ds = getDefaultSettings();

	var setting_keys = [];
	for(var n in ds) setting_keys.push(n);

	storage.load(setting_keys, (res)=>{
		var ds = getDefaultSettings();
		for(var n in ds){
			if(typeof res[n] === "undefined"){
				res[n] = ds[n];
			}
		}

		if(typeof res["jpeg_max"] == "number"){
			res["jpg_max"] = res["jpeg_max"];
		}

		callback(res);
	});
}

function addContentFile(tabid, path, start){
	var ra = start ? "document_start" : "document_idle";
	if(path.substring(path.length - 3) == "css"){
		extapi.tabs.insertCSS(tabid, {
			file: path,
			runAt: ra
		});
	}else{
		extapi.tabs.executeScript(tabid, {
			file: path,
			runAt: ra
		});
	}
}

function createDownloadableFile(title, html){
	var ttl = title.
		replace(/[\r\n]/g, "").
		replace(/[\\\/\:\*\?\"<>\|~.]/g, "_").
		trim();
	if(ttl.length > 45) ttl = ttl.substring(0, 50);
	if(!ttl) ttl = "webpage";
	var filename = ttl + ".html";

	var blob = new Blob([html], { type: "text/html" });
	var url = URL.createObjectURL(blob);

	return {
		filename: filename,
		url: url
	}
}