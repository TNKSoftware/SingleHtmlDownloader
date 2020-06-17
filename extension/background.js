var settings = getDefaultSettings();

function updateSetting(s){
	settings = s;
}

function executeDownload(tabid, dltype){
	extapi.tabs.sendMessage(tabid, 
		{
			msg: Msg.Download,
			tabid: tabid,
			dltype:dltype
		});
}

var mainmenu = extapi.contextMenus.create({
	title: localize("title"),
}, ignoreError);

extapi.contextMenus.create({
	title: localize("defaultdl"),
	parentId:mainmenu,
	onclick: function(info, tab){
		executeDownload(tab.id, DlType.All);
	}
}, ignoreError);

extapi.contextMenus.create({
	title: localize("stylekeep"),
	parentId:mainmenu,
	onclick: function(info, tab){
		executeDownload(tab.id, DlType.KeepStyle);
	}
}, ignoreError);

extapi.contextMenus.create({
	title: localize("minimaldl"),
	parentId:mainmenu,
	onclick: function(info, tab){
		executeDownload(tab.id, DlType.Minimal);
	}
}, ignoreError);

extapi.browserAction.onClicked.addListener(function(tab){
	executeDownload(tab.id, settings.dltype);
});

function enableButton(enable){
	if(enable == false){
		extapi.browserAction.disable();
		extapi.contextMenus.update(mainmenu, {enabled:false});
	}else{
		extapi.browserAction.enable();
		extapi.contextMenus.update(mainmenu, {enabled:true});
	}
}

function showIcon(tab, param){
	var btext = "", title = localize("title");

	if(param.nothtml5 === true || param.notutf8 === true){
		title += "\n" + localize("convnotice");
	}
	if(param.nothtml5 === true){
		btext += "H";
		title += "\n" + localize("nothtml5");
	}
	if(param.notutf8 === true){
		btext += "U";
		title += "\n" + localize("notutf8");
	}
	extapi.browserAction.setBadgeBackgroundColor({color:"red", tabId: tab.id});
	extapi.browserAction.setBadgeText({text:btext, tabId: tab.id});
	extapi.browserAction.setTitle({title:title, tabId: tab.id});

	enableButton(param.ishttp);
}

extapi.runtime.onMessage.addListener((param, sender, sendResponse) => {
	switch(param.msg){
	case Msg.ShowIcon:
		showIcon(sender.tab, param);
		break;
		
	case Msg.UpdateSetting:
		updateSetting(param.setting);
		break;

	case Msg.SendHtml:
		download(sender.tab.id, param);
		break;

	case Msg.Close: 
		DownloadTask.dispose(sender.tab.id);
		break;
	}
});

extapi.tabs.onRemoved.addListener((tabid, info)=>{
	DownloadTask.dispose(tabid);
});

extapi.tabs.onActivated.addListener((tab)=>{
	extapi.tabs.get(tab.tabId, (tab)=>{
		var ishttp = (tab.url.indexOf("http") == 0);
		enableButton(ishttp);
	});
});

loadSettings((res)=>{ updateSetting(res); });
