class DownloadTask{
	static tasks = [];

	static create(param){
		DownloadTask.dispose(param.id);

		var task = new DownloadTask(param);
		this.tasks.push(task);
		return task;
	}

	static dispose(id){
		var ts = this.tasks;
		for(var i = 0, l = ts.length; i < l; i++){
			var task = ts[i];
			if(task.id == id){
				task.close();
				ts.splice(i, 1);
				return;
			}
		}
	}

	id;
	url;
	title;
	dltype;
	doc = null;

	elemcount = 0;
	elemrest = 0;

	xhrs = [];

	constructor(param){
		const t = this;
		t.id = param.id;
		t.url = param.url;
		t.title = param.title;
		t.dltype = param.type;
		
		var parser = new DOMParser();
		t.doc = parser.parseFromString(param.html, "text/html");
		var base = t.doc.createElement("base");
		base.href = t.url;
		t.doc.head.appendChild(base);
	}

	close(){
		const t = this;
		for(var i = 0, l = t.xhrs.length; i < l; i++){
			var x = t.xhrs[i];
			if(x && x.readyState !== XMLHttpRequest.DONE) x.abort();			
		}
		t.xhrs = [];
	}

	removeMeta() {
		const t = this;
		var metas = t.doc.getElementsByTagName("meta");
		for(var i = 0, l = metas.length; i < l; i++){
			var csattr = metas[i].getAttribute("charset");
			if(csattr){
				t.doc.getElementsByTagName("head")[0].removeChild(metas[i]);
				break;
			}else{
				csattr = metas[i].getAttribute("content");
				if(csattr){
					if(csattr.toLowerCase().indexOf("charset") != -1) {
						t.doc.getElementsByTagName("head")[0].removeChild(metas[i]);
						break;
					}
				}
			}
		}
	}

	removeTags(){
		if(this.dltype == DlType.All) return;

		const doc = this.doc;

		var tagnames, tags, tag;
		tags = doc.getElementsByTagName("noscript");

		while(tags.length > 0){
			var t = tags[0], p = t.parentNode;
			var ih = t.innerHTML.replaceAll("&lt;", "<").replaceAll("&gt;", ">").trim();
			t.insertAdjacentHTML("afterend", ih);
			p.removeChild(t);
		}

		tagnames = ["meta", "script", "iframe", "link", "style"];
		for(var i = 0, il = tagnames.length; i < il; i++){
			if(i == 4 && this.dltype == DlType.KeepStyle) continue;
			var ks = (i == 3 && this.dltype == DlType.KeepStyle) ? true : false;
			
			tags = doc.getElementsByTagName(tagnames[i]);
			for(j = tags.length - 1; j >= 0; j--){
				tag = tags[j];
				if(ks == true && tag.getAttribute("rel") == "stylesheet") continue;
				tag.parentNode.removeChild(tag);					
			}
		}

		tags = doc.getElementsByTagName("a");
		for(var i = tags.length - 1; i >= 0; i--){
			tag = tags[i];
			var cns = tag.childNodes;
			if(cns.length == 1){
				var cn = cns[0];
				var tagname = cn.tagName;
				if(!tagname || tagname.toLowerCase() != "img") continue;
				var p = tag.parentNode;
				cn.removeAttribute("width");
				cn.removeAttribute("height");
				p.insertBefore(cn, tag);
				p.removeChild(tag);
			}				
		}
		
		var found;
		tagnames = ["div", "span", "p"];
		do{
			found = false;
			for(var n = 0, nl = tagnames.length; n < nl; n++){
				tags = doc.getElementsByTagName(tagnames[n]);
				for(var i = tags.length - 1; i >= 0; i--){
					tag = tags[i];
					if(!tag.innerHTML){
						tag.parentNode.removeChild(tag);
						found = true;					
					}
				}
			}
		}while(found == true);

		var removeComments = function(elem) {
			for(var i = elem.childNodes.length - 1; i >= 0; i--) {
				tag = elem.childNodes[i];
				if(tag.nodeType === Node.COMMENT_NODE) {
					tag.parentNode.removeChild(tag);
				}else{
					removeComments(tag);
				}
			}
		};
		removeComments(doc);

		tags = doc.getElementsByTagName("*");
		for(var i = 0, l = tags.length; i < l; i++){
			tag = tags[i];
			for(var j = tag.attributes.length - 1; j >= 0; j--){
				var attr = tag.attributes[j].name.toLowerCase();
				if((this.dltype != DlType.KeepStyle && (attr == "class" || attr == "style"))
				|| (this.dltype == DlType.Minimal && attr == "id") || attr.substr(0, 2) == "on"){
					tag.removeAttribute(attr);
				}
			}
		}
	}

	convertPre(){
		const doc = this.doc;
		var tags, tag;
		tags = doc.getElementsByTagName("pre");
		for(var i = 0, l = tags.length; i < l; i++){
			tag = tags[i];
	
			var brs = tag.getElementsByTagName("br");
			for(var j = brs.length - 1; j >= 0; j--){
				var tn = doc.createTextNode("\x0A");
				brs[j].parentNode.replaceChild(tn, brs[j]);
			}
		}
	}

	checkFinish(){
		const t = this;
	
		t.elemrest--;

		var prog = t.elemcount - t.elemrest;
		var max = (t.elemcount == t.elemrest - 1) ? t.elemcount : 0;
		extapi.tabs.sendMessage(t.id, { msg: Msg.Progress, value: prog, max: max });


		if(t.elemrest > 0) return;

		var dhtml = "<!DOCTYPE html><html><head>"+
			"<base href=\""+ encodeURI(t.url) +"\">" +
			"<meta charset=\"utf-8\">";
		dhtml += t.doc.documentElement.innerHTML.substring
			(t.doc.documentElement.innerHTML.indexOf(">") + 1);

		extapi.tabs.sendMessage(t.id, { msg: Msg.ClosePopup });

		var fobj = createDownloadableFile(t.title, dhtml);
		fobj.saveAs = settings.showsave;
		extapi.downloads.download(fobj);

		DownloadTask.dispose(t.id);
	}

	getScheme(url){
		var sp = url.indexOf("://");
		if(sp != -1){
			return url.substring(0, sp);
		}else{
			return "";
		}
	}

	getExactlyUrl(target, baseurl){
		const t = this;
		if(!baseurl) baseurl = t.url;
		var url = new URL(target, baseurl);
		return url.href;
	}

	checkDownloadSize(xhr, size){
		var ctype = xhr.getResponseHeader("content-type");
		if(typeof ctype == "string"){
			var cltype = ctype.toLowerCase();
			for(var i = 0, l = mimeTypes.length; i < l; i++){
				if(cltype.indexOf(mimeTypes[i]) != -1){
					var name = extTypes[i] + "_max";
					if(size <= settings[name] * 1024){
						return true;
					}else{
						return false;
					}
				}
			}
		}
	
		if(size <= settings["others_max"] * 1024){
			return true;
		}else{
			return false;
		}
	}

	downloadContent(is_text, url, pm, done){
		var src = this.getExactlyUrl(url);
		var check_length = false;
	
		var xhr = new XMLHttpRequest();
	
		this.xhrs.push(xhr);
	
		if(is_text == true){
			xhr.responseType = "text";
			xhr.overrideMimeType("text/css; charset=utf-8");
		}else{
			xhr.responseType = "arraybuffer";
		}
	
		if(settings["timeout"] > 0){
			xhr.timeout = settings["timeout"] * 1000;
		}
	
		xhr.open("GET", src, true);
		xhr.ontimeout = (ev)=>{
			done({
				success: false,
				param: pm,
				errmsg: "Timeout. skipped."
			});
		};
		xhr.onprogress = (ev)=>{
			if(check_length == false && ev.total > 0){
				if(this.checkDownloadSize(xhr, ev.total) == false){
					done({
						success: false,
						param: pm,
						errmsg: "file size exceeds the value. Skipped."
					});
					xhr.abort();
				}else{
					check_length = true;
				}
			}
		};
		xhr.onload = function() {
			var resp = this.response;
			if(is_text == false){
				var ctype = xhr.getResponseHeader("content-type");
				var buffer = new Uint8Array(resp), buflen = buffer.length, str = "";
				for(var i = 0; i < buflen; i++) str += String.fromCharCode(buffer[i]);
				resp = "data:" + ctype + ";base64," + btoa(str);
			}
			done({
				success: true,
				data: resp,
				param: pm,
			});
		};
		xhr.onerror = function(e){
			done({
				success:false,
				errmsg: e.message,
				param: pm,
			});
		};
		try{
			xhr.send();
		}catch(ex){
			done({
				success:false,
				errmsg: e.message,
				param: pm,
			});
		}
	}

	downloadText(url, param, done){
		this.downloadContent(true, url, param, done);
	}
	
	downloadImage(url, param, done){
		this.downloadContent(false, url, param, done);
	}
	
	convertCssUrl(cssurl, css, done){
		var res = [], regres;
		var regex = /url\((['"]?)(.+?)\1\)/ig;
		while((regres = regex.exec(css)) !== null){
			res.push({start:regres.index, fulllen:regres[0].length, url:regres[regres.length - 1], data:""});
		}
	
		var rest = res.length;
		var checkFinish = function(){
			rest--;
			if(rest <= 0){
				var str = "", pos = 0;
				for(var i = 0, l = res.length; i < l; i++){
					str += css.substring(pos, res[i].start);
					str += "url(\"" + res[i].data + "\")";
					pos = res[i].start + res[i].fulllen;
				}
				str += css.substr(pos);
				done(str);
			}
		};
	
		if(rest == 0){
			checkFinish();
			return;
		}
	
		for(var i = 0, l = res.length; i < l; i++){
			var target = res[i].url;
			if(target.substr(0, 4) == "data"){
				res[i].data = target;
				checkFinish();
				continue;
			}else{
				target = this.getExactlyUrl(target, cssurl);
			}
	
			this.downloadImage(target, i, (r)=>{
				res[r.param].data = r.data;
				checkFinish();
			});
		}
	}
	
	getSubFiles(){
		const t = this;

		var tagnames, tags, tag;
		var elems = [], add, src
		tagnames = ["img", "script", "link"];
		for(var i = 0, il = tagnames.length; i < il; i++){
			tags = t.doc.getElementsByTagName(tagnames[i]);
			for(var j = 0, jl = tags.length; j < jl; j++){
				tag = tags[j]; add = false;
				switch(i){
				case 0:
					src = (typeof tag.currentSrc == "string" && tag.currentSrc != "") ? tag.currentSrc : tag.src;
					add = (src.substring(0, 4) == "http");
					break;
				case 1:
					add = (tag.src !== undefined && tag.src != "");
					break;
				case 2:
					if(tag.href){
						var rel = tag.rel.toLowerCase();
						add = (rel == "stylesheet" || rel == "shortcut icon" || rel == "preload");
					}
					break;
				}
				if(add == true) elems.push(tag);
			}
		}

		t.elemcount = elems.length;
		t.elemrest = t.elemcount;
		if(t.elemcount == 0){
			t.checkFinish();
			return;
		}

		for(var i = 0, el = t.elemcount; i < el; i++){
			var tagName = elems[i].tagName.toLowerCase();
			if(tagName == "img" || (tagName == "link" && elems[i].rel.toLowerCase() != "stylesheet")){
				var src = (tagName == "img") ? elems[i].src : elems[i].href;
				t.downloadImage(src, i, (res)=>{
					if(res.success){
						var index = res.param;
						if(elems[index].src){
							elems[index].src = res.data;
						} else {
							elems[index].href = res.data;
						}
					}
					t.checkFinish();
				});
			}else if(tagName == "script"){
				t.downloadText(elems[i].src, i, (res)=>{
					if(res.success == true){
						var index = res.param;
						var em = elems[index];
						em.removeAttribute("src");
						em.textContent = res.data;
					}
					t.checkFinish();
				});
			}else{	// style
				t.downloadText(elems[i].href, i, (res)=>{
					if(res.success){
						var index = res.param;
						var em = elems[index];
						var p = em.parentNode;

						t.convertCssUrl(em.href, res.data, (str)=>{
							if(str !== null){
								var css = t.doc.createElement("style");
								css.textContent = str;
								p.insertBefore(css, em);
								p.removeChild(em);
							}

							t.checkFinish();
						});
					}else{
						t.checkFinish();
					}
				});
			}
		}
	}

	convert(){
		const t = this;	
		t.removeMeta();
		t.removeTags();
		t.convertPre();
		t.getSubFiles();
	}
}

function download(tabid, param){
	try{
		task = DownloadTask.create({
			id: tabid,
			url: param.url,
			title: param.title,
			html: param.html,
			type: param.dltype
		});
		task.convert();
	}catch(ex){
		throw ex;
	}
}