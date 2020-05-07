/** @file       loginMain.js
  * @brief      登入主邏輯.
  * @author     OreoLi
  * @date       2019/03/19 20:02 */

/** 載入第三方開發模組 */
function initMgr() {  
    cc.module.i18n  = require('LanguageData');
	  
    var audioMgr = require("audio");
    cc.module.audio = new audioMgr();

    var userParamsMgr = require("userParams");
    cc.module.userParams = new userParamsMgr();

    var toolsMgr = require("tools");
    cc.module.tools = new toolsMgr();

    var networkMgr = require("network");
    cc.module.network = new networkMgr();
	
    var hookMQTTMgr = require("hookMQTT");
    cc.module.hookMQTT = new hookMQTTMgr();
    
    var joinroomMgr = require("joinroom");
    cc.module.joinroom = new joinroomMgr();
}

cc.Class({
    extends: cc.Component,

    properties: {
        TableBG_node: cc.Node,                  //logo主節點
        SystemPanel_node:   cc.Node,		    //系統訊息節點
        tipsWindow_prefab:  cc.Prefab,          //視窗預置體

        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用     
        BtnClickOnAudio:    { default: null,    type: cc.AudioClip  },       //按鈕點擊音效載入
        BtnClickOffAudio:   { default: null,    type: cc.AudioClip  },       //按鈕無法點點擊音效載入
    },

    ctor(){
        cc.module = {};							        //宣告全局obj，使其場景切換時，仍然能夠保留資訊
        console.clear();                                //預先清除所有console
        initMgr();	                                    //模組載入

        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this._preloadScene          = "";               //目前要轉換的場景

		//判斷是否為行動裝置，若是則將網絡資源轉存位置到行動裝置上
        if (cc.sys.isNative){
            window.localStorage = cc.sys.localStorage;
        }

        this._SetLanguage();
    },
    
    onLoad () {
        cc.module.tools.windowOnResize(cc.find('Canvas').getComponent(cc.Canvas));
        //載入jsonFile資料，確認載入後，才繼續做相關事件
        let self = this;
        cc.loader.loadRes("config", function( err, res) {
            if(!err){
                cc.module.jsonFile = res.json;

                if(cc.module.jsonFile["SYSTEM_SETTING"]["DebugMode"] == false) {
                    console.clear();                                //預先清除所有console
                    Object.assign(console, {                        //複寫console不讓手動設置的console顯示
                        log: function(){},
                        /* ... */
                    })
                }

                if(self.DebugMode) {console.log("%c[loginMain] => [onLoad] in action.",'color:'+self.DebugModeColor_FA);}

                self.SystemPanel_node.getChildByName("version").getComponent(cc.Label).string = cc.module.jsonFile["Version"];
                self._SITE_Init();                      //針對不同商戶的初始化設定
                self._SystemLabelAD();                  //進度條下方的亂數動態文字
                self._Preload();                        //預加載場景
                self._ConnectToServer();                //連到toServer
            } else {
                //回傳錯誤訊息
                let _obj = {
                    ErrorLocation : cc.module.jsonFile["SERVER_GAME_NODEID"] + "[loginMain] => [onLoad] cc.loader.loadRes 'config' error.",
                    ErrorMsg : err+" "
                }
                cc.module.network.ErrorTracking(cc.module.jsonFile["SERVER_GAME_NODEID"],"[loginMain] => [_PreloadScene] cc.loader.loadRes加載config報錯.",_obj);
            }
        });

        if(this.DebugMode) {console.log("%c[loginMain] => [onLoad] in action.",'color:'+this.DebugModeColor_FA);}

        cc.module.tools.windowOnResize(cc.find('Canvas').getComponent(cc.Canvas));

    },

    /**
     * [語系設置]
     */
    _SetLanguage: function(){

        //預設語系設置，判斷內存是否已有儲存語系，若無則預設為cn
        let _Language = cc.sys.localStorage.getItem("Language");
        
        //確認是否有Get語系參數
        var url = window.location.href; //取得網址
        var paramCheck = url.indexOf("?"); //取得是否有?字元
        var paramStr = url.split("?")[1]; //取得參數陣列
        if (paramCheck != -1) {
            var tempArr = paramStr.split("&"); //字串分割所有參數
            var self = this; 
            tempArr.forEach(function (e, idx) {
                var check = tempArr[idx].indexOf("=");
                if (check > 0) {
                    var key = e.split("=")[0];
                    var val = e.split("=")[1];
                    if(!val || val == "") { key = 'error' }

                    //獲取每一項參數
                    switch (key) {
                        case "lang": _Language = val;  break;  
                        default: break;
                    }
                }
            });
        }

        //語系設置
        if(!_Language || _Language == "") {
            cc.module.i18n.init('cn');
            cc.sys.localStorage.setItem("Language",'cn'); //設置語系
        } else {
            cc.module.i18n.init(_Language);
        }
        cc.module.userParams.Language = _Language;  //轉存語系至全域變數

    },

    /**
     * [針對不同商戶的初始化設定]
     */
    _SITE_Init: function(){
        if(this.DebugMode) {console.log("%c[apSystemPanel] => [_SITE_Init] In action.",'color:'+this.DebugModeColor_FA);}

        //這塊是因為GT原本使用舊版本logo但其他商戶使用新log
        //不過現在都統一了，這塊暫時先不用理會，
        return;
        let _SiteData = {};
        let _NowSite  = cc.module.jsonFile["SITE_SETTING"]["NowSite"];
        if(cc.module.jsonFile["SITE_SETTING"][_NowSite]) {
            _SiteData = cc.module.jsonFile["SITE_SETTING"][_NowSite];
        } else {
            _SiteData = cc.module.jsonFile["SITE_SETTING"]["Default"];
        }
        
        this.TableBG_node.getChildByName("logo"+_SiteData["Logo"]).active = true; 
    },
    

    /** 
     * [預加載場景] 
     * */
    _Preload(){
        if(this.DebugMode) {console.log("%c[loginMain] => [_PreloadScene] in action.",'color:'+this.DebugModeColor_FA);}

        //需要判斷目前是否已選擇Antes若沒有則開啟選擇盤口畫面
        var self = this; 
        let _SceneName = cc.director.getScene().name;

        //若沒接收到參數則中斷function
        var _Url            = window.location.href;
        var _ParamStr = _Url.split("?")[1];
        if (_ParamStr)  {
            var tempArr = _ParamStr.split("&");
            tempArr.forEach(function(e, idx) {
                var _Check = tempArr[idx].indexOf("=");
                if (_Check > 0) {
                    var key = e.split("=")[0];
                    var val = e.split("=")[1];
                    if(!val || val == "") { key = 'error' }
                    //獲取每一項參數，有些是先寫著放，目前僅用到uuid、Antes、GameRule
                    switch (key) {
                        case "Antes":  
                            self._preloadScene = cc.module.jsonFile["PRELOAD_SCENE_LIST"][_SceneName][1];
                            break;  
                        default:      
                            self._preloadScene = cc.module.jsonFile["PRELOAD_SCENE_LIST"][_SceneName][0];    
                            break;
                    }
                }
            }); 
        } else {
            self._preloadScene = cc.module.jsonFile["PRELOAD_SCENE_LIST"][_SceneName][0];    
        }
        
        //若為純遊戲版本，則直接載入遊戲圖集資源
        let _NowSite  = cc.module.jsonFile["SITE_SETTING"]["NowSite"];
        if(_NowSite == "OnlyGame"){
            self._preloadScene = cc.module.jsonFile["PRELOAD_SCENE_LIST"][_SceneName][1];
        }

        cc.director.preloadScene(
            self._preloadScene, 
            
            //目前加載場景進度
            function(completedCount, totalCount, item) {
                self.SystemPanel_node.getChildByName("slider").getComponent("slider").SetProgress(completedCount / totalCount);
            },
            
            //目前加載的場景數
            function(err) {
                err = err+"";
                if(err != "null") {
                    if(self.DebugMode) {
                        console.log("%c[loginMain] => [_PreloadScene] cc.director.preloadScene error.",'color:'+self.DebugModeColor_FA);
                        console.log(err);
                        console.log(self._preloadScene);
                    }
                    //回傳錯誤訊息
                    let _obj = {
                        ErrorLocation : cc.module.jsonFile["SERVER_GAME_NODEID"] + "[loginMain] => [_PreloadScene]",
                        ErrorMsg : err+" ",
                        ErrorPreloadScene : self._preloadScene
                    }
                    cc.module.network.ErrorTracking(cc.module.jsonFile["SERVER_GAME_NODEID"],"[loginMain] => [_PreloadScene] cc.director.preloadScene報錯.",_obj);
                }
            }
        );
    },
	
	/** 
     * [目前系統訊息文字顯示...] 
     * 目前沒用到該方法，但以前有用到過，就先留著吧
	 * @param {bool}   _state 	    {true:開啟計時器,false:關閉計時器}
	 * @param {string} _str	        欲顯示的文字內容
	*/
	_SystemLabelPoint(_state,_str){
        if(this.DebugMode) {console.log("%c[loginMain] => [_SystemLabelPoint] in action.",'color:'+this.DebugModeColor_FA);}

        // let _SceneName = cc.director.getScene().name;
        // if(_SceneName != "loginMain") return;

		// this.SystemPanel_node.getChildByName("label").getComponent(cc.Label).unscheduleAllCallbacks(); //停止該組件所有計時器

		// if(_state) {
		// 	let noPointStr 	= _str.substring(0, _str.length-3);
		// 	let pointNumber = 0;
		// 	let _pstr = "";

		// 	this.callback = function () {
		// 		if(pointNumber > 2) {
		// 			pointNumber = 0;
		// 			_pstr		= "";
		// 		} else {
		// 			pointNumber++;
		// 			_pstr += ".";
		// 		}

		// 		this.SystemPanel_node.getChildByName("label").getComponent(cc.Label).string = noPointStr + _pstr;
        //     }.bind(this)
            
		// 	this.SystemPanel_node.getChildByName("label").getComponent(cc.Label).schedule(this.callback, 0.3);
		// } else {
		// 	this.SystemPanel_node.getChildByName("label").getComponent(cc.Label).string = _str;
		// }
	},

    /** 
     * [系統亂數跑公告] 
     * */
    _SystemLabelAD(){
        if(this.DebugMode) {console.log("%c[loginMain] => [_SystemLabelAD] in action.",'color:'+this.DebugModeColor_FA);}

        let _MaxStrIndex    = cc.module.jsonFile["SystemLabelAD"]["MaxStrIndex"];
        let _Timer          = cc.module.jsonFile["SystemLabelAD"]["Timer"];
        let _SysLabel       = this.SystemPanel_node.getChildByName("label").getComponent(cc.Label);
        _SysLabel.string    = cc.module.i18n.t("login_systemLabelAD."+cc.module.tools.getRandom(0,_MaxStrIndex));     //設置預設文字

        //定時修改文字
        _SysLabel.schedule(function() {
            _SysLabel.string = cc.module.i18n.t("login_systemLabelAD."+cc.module.tools.getRandom(0,_MaxStrIndex));
        }, _Timer);
    },

	/** 
     * [向伺服器取得連線] 
     * */
    _ConnectToServer: function() {
        if(this.DebugMode) {console.log("%c[loginMain] => [_ConnectToServer] in action.",'color:'+this.DebugModeColor_FA);}

        var self = this;
        cc.module.network.Login({
            connect: function() {
                if(self.DebugMode) {console.log("%c[loginMain] => [onLoad] _ConnectToServer connect.",'color:'+self.DebugModeColor_FA);}
            },
            error: function() {
                if(self.DebugMode) {console.log("%c[loginMain] => [onLoad] _ConnectToServer error.",'color:'+self.DebugModeColor_FA);}
                
                //回傳錯誤訊息
                let _obj = {
                    ErrorLocation : "H5DiceDTCN [loginMain] => [_PreloadScene]",
                    ErrorMsg : " "
                }
                cc.module.network.ErrorTracking("H5DiceDTCN","[loginMain] => [_PreloadScene] cc.director.preloadScene報錯.",_obj);
            },
            close: function() {
                if(self.DebugMode) {console.log("%c[loginMain] => [onLoad] _ConnectToServer close.",'color:'+self.DebugModeColor_FA);}
            },
            reconnect: function() {
                if(self.DebugMode) {console.log("%c[loginMain] => [onLoad] _ConnectToServer reconnect.",'color:'+self.DebugModeColor_FA);}
            },
            rejoinIsEnding: function(_GameName) {
                if(self.DebugMode) {console.log("%c[loginMain] => [onLoad] _ConnectToServer rejoinIsEnding.",'color:'+self.DebugModeColor_FA);}
                self.SetWindows("RejoinToEnd",_GameName+cc.module.i18n.t('login_tipsWindow_RejoinToEnd'));
            },
            rejoinNotEnding: function(_GameName) {
                if(self.DebugMode) {console.log("%c[loginMain] => [onLoad] _ConnectToServer rejoinNotEnding.",'color:'+self.DebugModeColor_FA);}
                self.SetWindows("RejoinToPlay",_GameName+cc.module.i18n.t('login_tipsWindow_RejoinToPlay'));
            },
            manualReconnect: function(){
                if(self.DebugMode) {console.log("%c[loginMain] => [onLoad] _ConnectToServer manualReconnect.",'color:'+self.DebugModeColor_FA);}
                self.SetWindows("ManualReconnect",cc.module.i18n.t('login_tipsWindow_ManualReconnect')+" (0x01)");
            },
            APItokenError: function(){
                if(self.DebugMode) {console.log("%c[loginMain] => [onLoad] _ConnectToServer APItokenError.",'color:'+self.DebugModeColor_FA);}
                self.SetWindows("TokenError","您的登录已过期，请重新开启游戏 (0x01)");
            },
            GStokenError: function(){
                if(self.DebugMode) {console.log("%c[loginMain] => [onLoad] _ConnectToServer GStokenError.",'color:'+self.DebugModeColor_FA);}
                self.SetWindows("TokenError","您的登录已过期，请重新开启游戏 (0x02)");
            },
            afterLogin: function() {
                if(self.DebugMode) {console.log("%c[loginMain] => [onLoad] _ConnectToServer afterLogin.",'color:'+self.DebugModeColor_FA);}
                self.EnterScene();
            }
        });

        cc.module.network.UpdateConnect();  //維持心跳別死
	},

	/** 
     * [加載遊戲大廳，待完成後直接轉跳場景]
     * */
    EnterScene: function() {
        if(this.DebugMode) {console.log("%c[loginMain] => [EnterScene] in action.",'color:'+this.DebugModeColor_FA);}

        //需要判斷目前是否已選擇Antes若沒有則開啟選擇盤口畫面
        let _SceneName = cc.director.getScene().name;
        if(cc.module.userParams.NowGameAntes || (cc.module.userParams.TableCustom != "" && cc.module.userParams.TableCustom)) { //若有取得底注籌碼則載入遊戲場景
            this._preloadScene = cc.module.jsonFile["PRELOAD_SCENE_LIST"][_SceneName][1];
        } else {
            this._preloadScene = cc.module.jsonFile["PRELOAD_SCENE_LIST"][_SceneName][0];
        }


		this.SystemPanel_node.getChildByName("slider").getComponent("slider").SetProgress(1);
        cc.director.loadScene(this._preloadScene);
        
        cc.loader.load(cc.url.raw('resources/sounds/background.mp3'), function (err, assets) {
            cc.module.audio.init(assets); 	//初始化音樂音效管理模組
        }.bind(this));
	},

    /**
     * [視窗] 事件
     * @param {string} _State           哪一種狀況下顯示的視窗   {"RejoinToEnd","RejoinToPlay","ManualReconnect"}
     * @param {string} _ContentStr      要顯示的視窗預置體內容     
     */
    SetWindows: function(_State,_ContentStr){
        if(this.DebugMode) {console.log("%c[loginMain] => [SetWindows] in action.",'color:'+this.DebugModeColor_FA);}

        let self = this; 

        let _Windows_Node = this.SystemPanel_node.getChildByName("windows");
        _Windows_Node.removeAllChildren(true);                                  //清空所有子節點
        
        var _NewNode = cc.instantiate(this.tipsWindow_prefab);
        _Windows_Node.addChild(_NewNode);
        
        switch(_State){
            case "RejoinToEnd":         //斷線重連 (已結束牌局，非強制連線，有確認、取消按鈕)
                var _Cb_Enter = function(){
                    cc.module.audio.playEffect(self.BtnClickOnAudio); 
                    cc.module.network.ReJoinDestroyBackProject();
                }
                var _Cb_Cancel = function(){
                    cc.module.audio.playEffect(self.BtnClickOnAudio);
                    cc.module.network.ReJoinCancel();
                    cc.module.network.GetGameSetting(function(){
                        self.EnterScene();
                    });
                }
                _NewNode.getComponent("tipsWindow").ConfirmInit(_ContentStr,_Cb_Enter,_Cb_Cancel);
                break;
            case "RejoinToPlay":        //斷線重連 (尚未結束牌局，強制連線，僅確認按鈕)
                var _Cb_Enter = function(){
                    cc.module.audio.playEffect(self.BtnClickOnAudio); 
                    cc.module.network.ReJoinDestroyBackProject();
                }
                _NewNode.getComponent("tipsWindow").AlertInit(_ContentStr,_Cb_Enter);
                break;
            case "ManualReconnect":     //手動重連 (資料異常，強制連線，僅確認按鈕)
                var _Cb_Enter = function(){
                    cc.module.network.DestroyReConnect();
                }
                _NewNode.getComponent("tipsWindow").AlertInit(_ContentStr,_Cb_Enter);
                break;
            case "TokenError":          //TokenError手動重連 (資料異常，強制連線，僅確認按鈕)，要返回上一頁
                var _Cb_Enter = function(){
                    
                    let _SiteData = {};
                    let _NowSite  = cc.module.jsonFile["SITE_SETTING"]["NowSite"];
                    if(cc.module.jsonFile["SITE_SETTING"][_NowSite]) {
                        _SiteData = cc.module.jsonFile["SITE_SETTING"][_NowSite];
                    }
                    if(_SiteData["Game_BtnBackHall_ToBowan"] == true) {
                        window.history.back();
                    } else {
                        cc.module.network.DestroyReConnect();
                    }
                }
                _NewNode.getComponent("tipsWindow").AlertInit(_ContentStr,_Cb_Enter);
                break;
            default:
                if(self.DebugMode) {console.log("%c[loginMain] => [SetWindows] _State default.",'color:'+this.DebugModeColor_FA);}
                break;
        }
        
    },
});
