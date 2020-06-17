function tnksdl_showIcon(){
	var metas = document.getElementsByTagName("meta");
	var cset = "unknown";
	for(var i = 0, l = metas.length; i < l; i++){
		cset = metas[i].getAttribute("charset");
		if(cset){
			cset = cset.toLowerCase().replace("-", "");
			break;
		}else{
			cset = metas[i].getAttribute("content");
			if(cset){
				cset = cset.toLowerCase();
				var csp = cset.indexOf("charset=");
				if(csp != -1) {
					cset = cset.substr(csp + 8).replace("-", "").substr(0, 4);
					break;
				}
			}
		}
	}

	var ishttp = (document.URL.indexOf("http") == 0);

	var notutf8 = (cset != "utf8");
	var nothtml5 = (document.doctype.publicId != "" || document.doctype.systemId != "");
	extapi.runtime.sendMessage({
		msg: Msg.ShowIcon, 
		notutf8: notutf8,
		nothtml5: nothtml5,
		ishttp: ishttp
	});
}

window.addEventListener("load", (ev)=>{
	tnksdl_showIcon();
});

window.addEventListener("beforeunload", (ev)=>{
	extapi.runtime.sendMessage({
		msg: Msg.ShowIcon, 
		notutf8: false,
		nothtml5: false,
		ishttp: false
	});
});
