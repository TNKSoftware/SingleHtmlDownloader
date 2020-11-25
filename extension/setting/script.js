function notifyUpdate(setting){
	extapi.runtime.sendMessage({
		msg: Msg.UpdateSetting,
		setting: setting
	});
}

function resetParam(){
	setSetting(getDefaultSettings());
}

function saveParam(){
	var setting = {};

	var ftype = document.getElementsByClassName("fsize");
	for(var i = 0, l = ftype.length; i < l; i++){
		var v = ftype[i];
		var type = v.getAttribute("data-type");
		var val = parseInt(v.value);
		setting[type + "_max"] = val;
	}

	var dlelem = document.getElementsByName("dltype");
	for (i = 0, l = dlelem.length; i < l; i++) {
		if (dlelem[i].checked == true) {
			setting["dltype"] = i;
			break;
		}
	}

	var selem;

	setting["emdate"] = (document.getElementsByName("emdate")[0].checked === true);
	setting["emsrc"] = (document.getElementsByName("emsrc")[0].checked === true);
	
	selem = document.getElementsByName("showsave")[0];
	setting["showsave"] = (selem.checked === true); 

	selem = document.getElementsByName("noscript")[0];
	setting["noscript"] = (selem.checked === true);

	selem = document.getElementsByName("loadlazy")[0];
	setting["loadlazy"] = (selem.checked === true);

	var tmel = document.getElementsByName("timeout")[0];
	var tmout = parseInt(tmel.value);
	if(tmout <= 0) tmout = 0; else if(tmout > 3600) tmout = 3600;
	setting["timeout"] = tmout;

	storage.save(setting);
	notifyUpdate(setting);
}

function setSetting(s){
	var v;
	var ftype = document.getElementsByClassName("fsize");
	for(var i = 0, l = ftype.length; i < l; i++){
		var elem = ftype[i];
		var type = elem.getAttribute("data-type");
		v = s[type + "_max"];
		if(typeof v == "number") elem.value = v;
	}

	v = s["dltype"];
	if(typeof v == "number") {
		document.getElementsByName("dltype")[v].checked = true;
	}

	var pms = ["emdate", "emsrc", "showsave", "loadlazy", "noscript"];
	for(var p of pms){
		v = s[p];
		if(typeof v == "boolean") {
			document.getElementsByName(p)[0].checked = v;
		}
	}

	v = s["timeout"];
	if(typeof v == "number") {
		document.getElementsByName("timeout")[0].value = v;
	}
}

window.onload = function(){
	document.title = localize("title");

	var lc = document.getElementsByClassName("tnk_mrm_lc");
	for(var i = 0, l = lc.length; i < l; i++){
		lc[i].innerText = localize(lc[i].getAttribute("data-lc"));
	}

	var save = document.getElementById("save");
	save.value = localize("save");
	save.addEventListener("click", saveParam);

	var reset = document.getElementById("reset");
	reset.value = localize("reset");
	reset.addEventListener("click", ()=>{ resetParam(true); });

	resetParam();

	loadSettings((res)=>{
		setSetting(res);
	});
};