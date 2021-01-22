(function() {
	function ce(tag, attr){
		var e = document.createElement(tag);
		if(attr){
			for(var a in attr){
				e.setAttribute(a, attr[a]);
			}
		}
		return e;
	}
	
	function setProgress(v, c){
		var p = document.querySelector("#tnksdl-popup progress");
		if(p) {
			if(c) p.setAttribute("max", c);
			p.value = v;
		}
	}
	
	function removePopup(){
		var d = document.getElementById("tnksdl-popup");
		if(d) d.parentNode.removeChild(d);
	}
	
	function createPopup(msg){
		var d;
	
		d = ce("div", {id: "tnksdl-popup"});
	
		var m1 = ce("div", {class:"m1"});
		m1.textContent = msg ? msg : localize("creating");
		d.appendChild(m1);
	
		var p = document.createElement("progress", {"max":0, "value":0});
		d.appendChild(p);

		var m2 = ce("input", {"id": "tnksdl-setting", "type": "button", "value":localize("setting")});
		m2.addEventListener("click", (ev)=>{
			extapi.runtime.sendMessage({ msg: Msg.OpenOption });
		});
		d.appendChild(m2);
	
		document.body.appendChild(d);
	}

	function execDownload(param){
		extapi.runtime.sendMessage({
			msg: Msg.SendHtml,
			url: document.URL,
			title: document.title,
			dltype: param.dltype,
			html:document.documentElement.innerHTML
		});

		var title = null;
		switch(param.dltype){
		case DlType.All: title = localize("defaultdl"); break;
		case DlType.KeepStyle: title = localize("stylekeep"); break;
		case DlType.Minimal: title = localize("minimaldl"); break;
		}
		createPopup(title);
	}

	extapi.runtime.onMessage.addListener(function(param, sender, sendResponse) {
		if(!param.msg) return;
		switch(param.msg){
		case Msg.ShowIcon: tnksdl_showIcon(); break;
		case Msg.Download: execDownload(param); break;
		case Msg.Progress: setProgress(param.value, param.count); break;
		case Msg.ClosePopup: removePopup(); break;
		}
	});
})();
