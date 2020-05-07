/** @file       network.js
  * @brief      伺服器連線管理.
  * @author     OreoLi
  * @date       2019/04/14 16:31 */

/** 載入第三方開發模組 */
function initMgr() {  
    var mqanMgrt        = require("mqantlib"); 
    cc.module.mqant     = new mqanMgrt();
}

cc.Class({
    extends: cc.Component,
    properties: {
        GameInit_CB:        function(){},
        Disconnection_CB:   function(){},
        Connection_CB:      function(){}
    },

    ctor: function() {
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息
        
        this.CancelRejoinTopic      = "";               //取消斷線重連Topic
        this.LoginTimeout           = "";               //使用者登入逾時計時器
        this.HallVersion            = "";               //大廳版本號
        this.GameVersion            = "";               //遊戲版本號
        this.RejoinData             = "";               //重新連線的封包資料

        this.UserCloseMqtt          = false;            //使用者是否自行斷開連線 {false:連線逾時,true:手動斷開}
        this.ConnectCount           = 0;                //目前連線次數，預設為0
        this.ConnectMaxCount        = 0;                //最大連線次數目前預設為5

        this.RetryLock              = false;            //重新連線鎖
        this.LoginState             = false;            //是否已經登入成功
    },

    /**
     * [登入設置對應事件的function]
     * @param {map function } prop 
     */
    Login: function(prop) {
        
        //CallBack集合
        this.ConnectCallback            = prop["connect"];          //連線成功
        this.ErrorCallback              = prop["error"];            //連線錯誤
        this.CloseCallback              = prop["close"];            //關閉連線
        this.ReconnectCallback          = prop["reconnect"];        //重新連線
        this.RejoinIsEnding             = prop["rejoinIsEnding"];   //斷線重連 (已結算狀態)
        this.RejoinNotEnding            = prop["rejoinNotEnding"];  //斷線重連 (尚未結算狀態)
        this.ManualReconnect            = prop["manualReconnect"];  //手動重連
        this.LoginCallback              = prop["afterLogin"];       //登入成功後
        this.APItokenErrorCallback      = prop["APItokenError"];    //APIToken過期
        this.GStokenErrorCallback       = prop["GStokenError"];     //GSToken過期
       
        this.ConnectCount               = 0;                                                //目前連線次數，預設為0
        this.ConnectMaxCount            = cc.module.jsonFile["SERVER_MAX_CONNECTCOUNT"];    //最大連線次數目前預設為5

        initMgr();                      //new出mqtt物件
        this.Init();                                                                        //進入初始化階段
    },

    /**
     * [network初始化]
     */
    Init: function() {     
        if (this.DebugMode) { 
            console.log("%c[network] => [Init] In action.", 'color:' + this.DebugModeColor_FA); 
            console.log("%c[network] => [Init] HOST/PORT.",'color:'+this.DebugModeColor_Msg);
            console.log("*********************");
            console.log("* HOST:"+cc.module.jsonFile['SERVER_HOST']+" *");
            console.log("* PORT:"+cc.module.jsonFile['SERVER_PORT']+" *");
            console.log("*********************");
        }

        initMgr();                      //new出mqtt物件

        let self            = this;
        let _ConnectLock    = false;
        
        self.UserCloseMqtt = false;     //初始化手動斷線狀態

        //連線逾時手動重連處理
        self.unschedule(self.LoginTimeout_Callback);
        self.LoginTimeout_Callback = function () {
            if(self.DebugMode) {console.log("%c[network] => [Init] this.LoginTimeout_Callback In action.",'color:'+self.DebugModeColor_FA);}
            self.InitErrorFunc();
        }
        self.schedule(self.LoginTimeout_Callback, 8); 
        
        cc.module.mqant.init({
            host: cc.module.jsonFile['SERVER_HOST'], //HOST 寫在data.json數據檔案
            port: cc.module.jsonFile['SERVER_PORT'], //PORT 寫在data.json數據檔案
            useSSL: false,
            connect: function() {
                if(self.DebugMode) {console.log("%c[network] => [Init] connection success.",'color:'+self.DebugModeColor_FA);}

                cc.module.hookMQTT.Init();                      //初始化Hook
                self.unschedule(self.LoginTimeout_Callback);    //關閉登入計時器
                
                self.RetryLock  = false;                            //解開重新連線鎖
                if(!self.LoginState) {
                    self.GetHallVersion();                          //取得大廳版本號
                    self.GetGameVersion();                          //取得遊戲版本號 (若目前為大廳專案，則會直接不取得)
                    self.GetUrlParams();                            //取得url get參數
                    self.UserLogin();                               //使用者登入，若接收到的uuid為空值，則直接創建一名玩家
                    self.ConnectCallback.apply();                   //執行連線成功CallBack
                } else {
                    self.Connection_CB(); 
                    self.RetryLogin(); 
                }
            },
            error: function() {
                if(self.DebugMode) {console.log("%c[network] => [Init] connection error.",'color:'+self.DebugModeColor_FA);}
                self.InitErrorFunc();               //異常處理行為
                self.ErrorCallback.apply(); 
            },
            close: function() {
                if(self.DebugMode) {console.log("%c[network] => [Init] connection close.",'color:'+self.DebugModeColor_FA);}
                self.InitErrorFunc();               //異常處理行為
                self.CloseCallback.apply(); 
            },
            reconnect: function() {
                if(self.DebugMode) {console.log("%c[network] => [Init] reconnected.",'color:'+self.DebugModeColor_FA);}
                self.InitErrorFunc();               //異常處理行為
                self.ReconnectCallback.apply(); 
            }
        });
    },

    
    /**
     * [異常處理]
     * 針對連線初始化做異常處理
     * @param {function} _CB 回調function
     */
    InitErrorFunc: function(_CB){
        if(this.DebugMode) {console.log("%c[network] => [InitErrorFunc] In action.",'color:'+this.DebugModeColor_FA);}

        let self = this;
        self.RetryLock  = false;    //解開重新連線鎖 

        if(!self.UserCloseMqtt){ 
            if(!self.LoginState){
                self.unschedule(self.LoginTimeout_Callback);
                if(self.ConnectCount >= self.ConnectMaxCount) {
                    self.ManualReconnect.apply();
                } else {
                    self.ConnectCount++;
                    self.DestroyToConnect();
                    return;
                }
            } else {
                self.Disconnection_CB();  
                // self.DestroyToConnect();
            }
        } 
                
        //回傳錯誤訊息
        let _obj = {
            ErrorLocation : cc.module.jsonFile["SERVER_GAME_NODEID"] + "[network] => [InitErrorFunc]",
            ErrorMsg : " "
        }
        cc.module.network.ErrorTracking(cc.module.jsonFile["SERVER_GAME_NODEID"],"[network] => [InitErrorFunc] action.",_obj);
    },
    /**
     * [斷線後重新連線]
     */
    DestroyToConnect: function(){
        if(this.DebugMode) {console.log("%c[network] => [DestroyToConnect] In action.",'color:'+this.DebugModeColor_FA);}

        // let self = this;
        if(this.RetryLock) return;
        this.RetryLock = true;
        
        this.UserCloseMqtt = true;
        if(cc.module.mqant.connected()){ 
            cc.module.mqant.destroy();
        }
        this.Init();

        //爛寫法
        // this.unschedule(this.DestroyToConnect_Callback);
        // this.DestroyToConnect_Callback = function () {
        //     if(!cc.module.mqant.connected()){  
        //         self.Init();
        //         self.unschedule(self.DestroyToConnect_Callback);
        //     }
        // }
        // this.schedule(this.DestroyToConnect_Callback, 0.5); 
    },

    /**
     * [重新登入]
     * 重新配置連線後，需要重新登入
     * @param {function} _CB 
     */
    RetryLogin:function(_CB){
        if(this.DebugMode) {console.log("%c[network] => [RetryLogin] In action.",'color:'+this.DebugModeColor_FA);}

        let self        = this;
        let _Account    = cc.sys.localStorage.getItem("H5CC_Account");  //取得內存的帳號
        let _GSToken    = cc.sys.localStorage.getItem("H5CC_GSToken");  //取得內存的GSToken
        let _HDID       = "HD_RetryLogin";                            //要傳哪隻APIID
        let _LoginObj   = {GSToken:_GSToken,account:_Account};      //要傳入連線的資料格式
        
        if(self.DebugMode) {
            console.log("[network] => [ChangeConnection] connect call api:"+_HDID);
            console.log(_LoginObj);
        }
        
        //重新登入切換線路
        cc.module.mqant.request(cc.module.jsonFile['SERVER_LOGIN_TOPIC'] + "/" + _HDID,_LoginObj, function (destinationName, data) {
            if(self.DebugMode) {
                console.log("%c[network] => [ChangeConnection] destinationName:"+destinationName+" request.",'color:'+self.DebugModeColor_GET);
                console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                console.log(JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))["Result"]));
            }
            
            //重新登入切換線路
            cc.module.mqant.request(cc.module.jsonFile['SERVER_GAME_NODEID'] + "/HD_TableFlash",{}, function (destinationName, data) {
                if(self.DebugMode) {
                    console.log("%c[network] => [ChangeConnection] destinationName:"+destinationName+" request.",'color:'+self.DebugModeColor_GET);
                    console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                }
                if(JSON.parse(cc.module.mqant.parseUTF8(data))["Result"]) {
                    self.RejoinData = JSON.parse(cc.module.mqant.parseUTF8(data))["Result"]['Data'];    //轉存封包資料
                    console.log(JSON.parse(cc.module.mqant.parseUTF8(data))["Result"]);
                    console.log(JSON.parse(cc.module.mqant.parseUTF8(data))["Result"]['Data']); 

                    cc.module.userParams.NowGameAntes   = self.RejoinData['Antes'];
                    cc.module.userParams.RoomID         = self.RejoinData['BigRoomID']; 
                    cc.module.userParams.ReJoinData     = self.RejoinData;

                    if(typeof(self.GameInit_CB) == "function"){ 
                        self.GameInit_CB();  
                    }
                } else {
                    if(self.DebugMode) { console.log("HD_TableFlash Result Error",JSON.parse(cc.module.mqant.parseUTF8(data))["Error"]); }
                }
            }); 
        }); 
    },

    /** 
     * [取得大廳遊戲版本]
     *  */
    GetHallVersion: function() {
        if(this.DebugMode) {console.log("%c[network] => [GetHallVersion] In action.",'color:'+this.DebugModeColor_FA);}

        cc.module.mqant.request(cc.module.jsonFile['SERVER_LOGIN_TOPIC']+"/HD_Version", {}, function(destinationName, data) {
            if(this.DebugMode) {
                console.log(destinationName);
                console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                console.log("%c[network] => [GetHallVersion] version:"+JSON.parse(cc.module.mqant.parseUTF8(data))["Result"]+".",'color:'+this.DebugModeColor_GET);
            }
            this.HallVersion = JSON.parse(cc.module.mqant.parseUTF8(data))["Result"];
        }.bind(this));
    },

    /** 
     * [取得目前選取的遊戲版本]
     *  */
    GetGameVersion: function() {
        if(cc.module.jsonFile['SERVER_GAME_TYPE'] == "Hall" || !cc.module.jsonFile['SERVER_GAME_TYPE']) return; //大廳已經透過GetHallVersion取得版本號了

        if(this.DebugMode) {console.log("%c[network] => [GetGameVersion] In action.",'color:'+this.DebugModeColor_FA);}
        cc.module.mqant.request(cc.module.jsonFile['SERVER_GAME_NODEID'] +"/HD_Version", {}, function(destinationName, data) {
            if(this.DebugMode) {
                console.log(destinationName);
                // console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                // console.log("%c[network] => [GetGameVersion] version:"+JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))["Result"])["Data"]["Version"]+".",'color:'+this.DebugModeColor_GET);
            }
            this.GameVersion = JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))["Result"])["Data"]["Version"];
        }.bind(this));
    },

    /** 
     * [取得Url網址上的參數]
     * */
    GetUrlParams: function (){
        if (this.DebugMode) { console.log("%c[network] => [GetUrlParams] In action.", 'color:' + this.DebugModeColor_FA); }

        var url = window.location.href; //取得網址
        var paramCheck = url.indexOf("?"); //取得是否有?字元
        var paramStr = url.split("?")[1]; //取得參數陣列

        cc.module.userParams.UserID = "";
        cc.module.userParams.URLToken = "";

        if (paramCheck == -1) return; //若沒接收到參數則中斷function

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
                    case "Antes":       cc.module.userParams.NowGameAntes       = val;      break;  
                    case "token":       cc.module.userParams.URLToken           = val;      break;  //新式API
                    default: break;
                }
            }
        });

        if (this.DebugMode) {
            console.log("%c[network] => [GetUrlParams] Get url transform to user module properties.", 'color:' + this.DebugModeColor_FA);
            console.log("%c- [url:" + url + "].", 'color:' + this.DebugModeColor_FA);
        }
    },

    /** 
     * [使用者登入API] 
     * */
    UserLogin: function () {
        if (this.DebugMode) { console.log("%c[network] => [UserLogin] In action.", 'color:' + this.DebugModeColor_FA); }
        
        let self = this;
        let _HDID;                                              //要傳哪隻APIID
        let _LoginObj;                                          //要傳入連線的資料格式
        
        //判斷是否開啟測試通道，測試與正式通道不會並存
        let _Account    = cc.sys.localStorage.getItem("H5CC_Account");  //取得內存的帳號
        let _UrlToken   = cc.sys.localStorage.getItem("H5CC_URLToken"); //取得內存的網址Token
        let _GSToken    = cc.sys.localStorage.getItem("H5CC_GSToken");  //取得內存的GSToken

        if(!cc.module.userParams.URLToken || cc.module.userParams.URLToken == "") {
            if(cc.module.jsonFile["SERVER_GUEST_CHANNEL"] == 1) {
                _HDID       = "HD_GuestLogin";
                _LoginObj   = {};
            } else {
                _HDID       = "HD_APILogin";
                _LoginObj   = {GSToken:_GSToken,account:_Account}; 
            } 
        } else {
            if(cc.module.userParams.URLToken == _UrlToken) {    //若token與內存一樣則直接用GSToken登入
                _HDID       = "HD_APILogin";
                _LoginObj   = {GSToken:_GSToken,account:_Account};
            } else {
                _HDID       = "HD_APILogin";
                _LoginObj   = {token:cc.module.userParams.URLToken};
                cc.sys.localStorage.setItem("H5CC_URLToken",cc.module.userParams.URLToken);
            }
        }
        
        if(this.DebugMode) {
            console.log("[network] => [UserLogin] call api:"+_HDID);
            console.log(_LoginObj);
        }
           
        cc.module.mqant.request(cc.module.jsonFile['SERVER_LOGIN_TOPIC'] + "/" + _HDID,_LoginObj, function (destinationName, data) {
            if(this.DebugMode) {
                console.log("%c[network] => [UserLogin] destinationName:"+destinationName+" request.",'color:'+self.DebugModeColor_GET);
                console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                console.log(JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))["Result"]));
            }

            var _jsonData       = JSON.parse(cc.module.mqant.parseUTF8(data));
            var _jsonDataResult = JSON.parse(_jsonData["Result"]);

            try{
                this.LoginState     = true; //已登入，狀態轉換
                switch (parseFloat(_jsonDataResult['Code'])) {
                    case 3:
                        if(this.DebugMode) {console.log("%c[network] => [UserLogin] "+_HDID+" code = 3，Cancel Rejoin.",'color:'+this.DebugModeColor_GET);}
                        this.ReJoinCancel();
                    case 1:
                        if(this.DebugMode) {console.log("%c[network] => [UserLogin] "+_HDID+" success.",'color:'+this.DebugModeColor_GET);}
                        var _jsonDataResultData = _jsonDataResult['Data'][0];

                        cc.module.userParams.UserIP         = _jsonDataResultData["online_info"]["ip"];     //使用者IP
                        cc.module.userParams.UserID         = _jsonDataResultData["account"];               //帳號
                        cc.module.userParams.Nickname       = _jsonDataResultData["nickname"];              //暱稱
                        cc.module.userParams.HeadUrl        = parseFloat(_jsonDataResultData["head_url"]);  //使用者頭像ID => 初始化為0，僅替代本地頭像不串接，音效目前綁定頭像性別，取得頭像圖片名稱後userIcon_n，取得_n的數值，若為0則撥放女生音效，反之則男生
                        cc.module.userParams.AudioSex       = cc.module.userParams.HeadUrl % 2;             //音效性別 =>透過頭像判斷
                        cc.module.userParams.Sex            = parseFloat(_jsonDataResultData["gender"]);    //性別  {0:女生,1:男生}，但目前音效綁定是看頭像男女生
                        cc.module.userParams.Credit         = cc.module.tools.formatFloat(_jsonDataResultData["balance"],2); //登入後目前持有籌碼

                        cc.sys.localStorage.setItem("H5CC_GSToken",_jsonDataResultData["GSToken"]);
                        cc.sys.localStorage.setItem("H5CC_Account",cc.module.userParams.UserID);
                        if(this.DebugMode) {
                            console.log("**************************************");
                            console.log("%c"+_HDID+" login account:"+cc.module.userParams.UserID,'color:'+this.DebugModeColor_Msg);
                            console.log("**************************************");
                        }
                        this.GetGameSetting(function(){this.LoginCallback.apply();}.bind(this));
                        break;
                    case 2: //斷線重連
                        if(this.DebugMode) {console.log("%c[network] => [UserLogin] "+_HDID+" rejoin connection.",'color:'+this.DebugModeColor_GET);}
                        var _jsonDataResultData = _jsonDataResult['Data'][0];

                        cc.module.userParams.UserIP         = _jsonDataResultData["online_info"]["ip"];     //使用者IP
                        cc.module.userParams.UserID         = _jsonDataResultData["account"];               //帳號
                        cc.module.userParams.Nickname       = _jsonDataResultData["nickname"];              //暱稱
                        cc.module.userParams.HeadUrl        = parseFloat(_jsonDataResultData["head_url"]);  //使用者頭像ID => 初始化為0，僅替代本地頭像不串接，音效目前綁定頭像性別，取得頭像圖片名稱後userIcon_n，取得_n的數值，若為0則撥放女生音效，反之則男生
                        cc.module.userParams.AudioSex       = cc.module.userParams.HeadUrl % 2;             //音效性別 =>透過頭像判斷
                        cc.module.userParams.Sex            = parseFloat(_jsonDataResultData["gender"]);    //性別  {0:女生,1:男生}，但目前音效綁定是看頭像男女生
                        cc.module.userParams.Credit         = cc.module.tools.formatFloat(_jsonDataResultData["balance"],2); //登入後目前持有籌碼

                        cc.sys.localStorage.setItem("H5CC_GSToken",_jsonDataResultData["GSToken"]);
                        cc.sys.localStorage.setItem("H5CC_Account",cc.module.userParams.UserID);
                        if(this.DebugMode) {
                            console.log("**************************************");
                            console.log("%c"+_HDID+" login account:"+cc.module.userParams.UserID,'color:'+this.DebugModeColor_Msg);
                            console.log("**************************************");
                        }

                        this.CancelRejoinTopic = _jsonDataResultData["Topic"];
                        //確認斷線重連後，則戳Server取得重連封包資料
                        cc.module.mqant.request(_jsonDataResultData["Topic"]+"/HD_ReEnterTable", {}, function(destinationName, data) {
                            try{
                                if(this.DebugMode) {
                                    console.log("%c[network] => [HD_ReEnterTable] destinationName:"+destinationName+" request.",'color:'+self.DebugModeColor_GET);
                                    console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                                    console.log(JSON.parse(cc.module.mqant.parseUTF8(data))["Result"]);
                                }
    
                                if(JSON.parse(cc.module.mqant.parseUTF8(data))["Error"] || Object.keys(JSON.parse(cc.module.mqant.parseUTF8(data))["Result"]['Data']['GameDetail']).length == 0) {
                                    this.ReJoinCancel();
                                    this.GetGameSetting(function(){this.LoginCallback.apply();}.bind(this));
                                } else {
                                    this.RejoinData = JSON.parse(cc.module.mqant.parseUTF8(data))["Result"]['Data'];    //轉存封包資料
                                    if(this.RejoinData["Game"].toLowerCase() == cc.module.jsonFile['SERVER_GAME_TYPE'].toLowerCase()){
                                        if(this.DebugMode) {console.log("%c[network] => [UserLogin] this project start rejoin.",'color:'+this.DebugModeColor_GET);}
                                        cc.module.userParams.NowGameAntes   = this.RejoinData['Antes'];
                                        cc.module.userParams.RoomID         = this.RejoinData['BigRoomID']; 
                                        cc.module.userParams.ReJoinData     = this.RejoinData;
                                        this.GetGameSetting(function(){this.LoginCallback.apply();}.bind(this));
                                    } else {
                                        if(this.DebugMode) {console.log("%c[network] => [UserLogin] not this project jump website["+this.RejoinData["Game"]+"] project.",'color:'+this.DebugModeColor_GET);}
                                        let _GameName;  //遊戲名稱
                                        for(var gKey in cc.module.jsonFile['GAME_LIST']) {
                                            if(gKey.toLowerCase() == this.RejoinData["Game"].toLowerCase()){
                                                _GameName = cc.module.i18n.t("list_gameType."+this.RejoinData["Game"]); 
                                            }
                                        }
                                        if(this.RejoinData["IsEnding"] == 1){                   //遊戲已結算，選擇性轉跳
                                            let _SiteData;
                                            let _NowSite  = cc.module.jsonFile["SITE_SETTING"]["NowSite"];
                                            if(cc.module.jsonFile["SITE_SETTING"][_NowSite]) {
                                                _SiteData = cc.module.jsonFile["SITE_SETTING"][_NowSite];
                                            } else {
                                                _SiteData = cc.module.jsonFile["SITE_SETTING"]["Default"];
                                            }

                                            if(_SiteData["NonProject_RejoinToEndWindow"] == true) {
                                                this.RejoinIsEnding.apply(this,[_GameName]);    //斷線重連 (已結算狀態)
                                            } else {
                                                this.ReJoinCancel();
                                                this.GetGameSetting(function(){this.LoginCallback.apply();}.bind(this));
                                            }
                                        } else {                                                //尚未結算直接轉跳
                                            this.RejoinNotEnding.apply(this,[_GameName]);       //斷線重連 (尚未結算狀態)
                                        }
                                    }
                                }
                            }catch(e){
                                if(this.DebugMode) {console.log("%c[network] => [UserLogin] login err :"+e+".",'color:'+this.DebugModeColor_Msg);}
                                
                                self.LoginState     = false; //未登入，狀態轉換
                                self.InitErrorFunc();
                            }
                        }.bind(this));
                        break;
                        
                    case -1:    
                        if(this.DebugMode) {console.log("%c[network] => [UserLogin] 驗證失敗.",'color:'+this.DebugModeColor_GET);}    
                        self.LoginState     = false; //未登入，狀態轉換

                        if(_jsonData["Error"] == "loginWithAPI GSToken Error") {
                            self.GStokenErrorCallback();
                        } else if(_jsonData["Error"] == "token Timeout") {
                            self.APItokenErrorCallback();
                        } else {
                            self.InitErrorFunc();
                        }

                        //回傳錯誤訊息
                        let _obj = {
                            ErrorLocation : cc.module.jsonFile["SERVER_GAME_NODEID"] + "[network] => [UserLogin]",
                            ErrorMsg : "Call "+_HDID+" 回傳code = -1",
                            ErrorPost : _LoginObj,
                            ErrorGet : _jsonDataResult
                        }
                        cc.module.network.ErrorTracking(cc.module.jsonFile["SERVER_GAME_NODEID"],"[network] => [UserLogin] "+_HDID+" 回傳code = -1.",_obj);
                        break;
                    default:    
                        if(this.DebugMode) {console.log("%c[network] => [UserLogin] default Code:"+ _jsonDataResult['Code'],'color:'+this.DebugModeColor_GET);}     
                        break;
                }

                clearTimeout(this.LoginTimeout);
            }catch(e){
                if(this.DebugMode) {console.log("%c[network] => [UserLogin] login err :"+e+".",'color:'+this.DebugModeColor_Msg);}
                
                self.LoginState     = false; //未登入，狀態轉換
                self.InitErrorFunc();
                
                //回傳錯誤訊息
                let _obj = {
                    ErrorLocation : cc.module.jsonFile["SERVER_GAME_NODEID"] + "[network] => [UserLogin]",
                    ErrorMsg : e+" "
                }
                cc.module.network.ErrorTracking(cc.module.jsonFile["SERVER_GAME_NODEID"],"[network] => [UserLogin] try catch捕捉錯誤資訊.",_obj);
            }
        }.bind(this)); 
    },

    /**
    * [取得遊戲設定]
    * @param {function} _cb 回調函數
    */
    GetGameSetting: function(_cb){
        if (this.DebugMode) { console.log("%c[network] => [GetGameSetting] In action.", 'color:' + this.DebugModeColor_FA); }


        let _msg;
        if(cc.module.jsonFile['SERVER_GAME_TYPE'] == "Hall" || !cc.module.jsonFile['SERVER_GAME_TYPE']) {
            _msg = {};
            cc.module.userParams.GameSetting = cc.module.jsonFile['GAME_LIST'];
        } else {
            _msg = {GameType:cc.module.jsonFile['SERVER_GAME_TYPE']};
            for(var gKey in cc.module.jsonFile['GAME_LIST']) {
                if(gKey.toLowerCase() == cc.module.jsonFile['SERVER_GAME_TYPE'].toLowerCase()){
                    cc.module.userParams.GameSetting            = cc.module.jsonFile['GAME_LIST'][gKey];
                    cc.module.userParams.GameSetting["GKey"]    = gKey;
                }
            }
        }

        //取得GameSetting所有資料
        cc.module.mqant.request(cc.module.jsonFile['SERVER_HALL_TOPIC'] + "/HD_GameSetting", _msg , function (destinationName, data) {
            
            try{
                if(this.DebugMode) {
                    console.log(destinationName);
                    console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                    console.log(JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))['Result']));
                }
                var _JsonData           = JSON.parse(cc.module.mqant.parseUTF8(data));
                var _JsonDataResult     = JSON.parse(_JsonData['Result']);

                switch(parseFloat(_JsonDataResult['Code'])){
                    case 1:
                        if(Object.keys(_msg).length == 0) { //大廳
                            
                            let _ObjSort    = {};   //轉存obj sort
                            let _GSLength   = 0;    //目前開放的遊戲總長度

                            for(var jKey in _JsonDataResult['Data']){
                                for(var gsKey in cc.module.userParams.GameSetting){
                                    let _JD     = _JsonDataResult['Data'][jKey];             //取得的資料集合
                                    let _UGS    = cc.module.userParams.GameSetting[gsKey];   //目前玩家的資料集合
                                    if(_UGS['SERVER_GAME_TYPE'] == jKey){            //先比對GameType
                                        _UGS["State"]        = 0;    //預設為不開啟，{0: 停用 1: 啟用 2: 維修中 3: 尚未開放}
                                        _UGS["Tags"]         = "";   //標籤

                                        _UGS["State"]        = _JD["status"];
                                        _UGS["Tags"]         = _JD["tags"];
                                        _UGS["Levels"]       = _JD["levels"];
                                        
                                        if(_JD["status"] != 0) {
                                            _ObjSort[gsKey]         = cc.module.userParams.GameSetting[gsKey]; //轉存obj sort
                                            _ObjSort[gsKey]["GKey"] = gsKey;
                                            _GSLength++;
                                        }
                                        break;
                                    }
                                }
                            }

                            //重新配置順序如下
                            //1 2 3 4 5
                            //6 7 8 9 10
                            let _NewObj     = {};   //最後排序後的obj
                            let _RowCount   = Math.floor(_GSLength / 2);
                            let _GCount     = 0;    //目前筆數
                            for(var gsKey in _ObjSort){
                                if(_GCount < _RowCount) {   //若為第一排
                                    _NewObj[((_GCount+1) * 2)-1] = _ObjSort[gsKey];
                                } else {                    //若為第二排
                                    _NewObj[(_GCount - _RowCount)  * 2 ] = _ObjSort[gsKey];
                                }
                                _GCount++;
                            }

                            cc.module.userParams.GameSetting = _NewObj; //轉存回去

                        } else {
                            cc.module.userParams.GameSetting["State"] = 0;    //預設為不開啟，{0: 停用 1: 啟用 2: 維修中 3: 尚未開放}
                            cc.module.userParams.GameSetting["Tags"]  = "";   //標籤

                            for(var jKey in _JsonDataResult['Data']){
                                let _UGS    = cc.module.userParams.GameSetting;   //目前玩家的資料集合
                                let _JD     = _JsonDataResult['Data'][jKey];            //取得的資料集合
                                if(_UGS['SERVER_GAME_TYPE'] == jKey){            //先比對GameType
                                    cc.module.userParams.GameSetting["State"]     = _JD["status"];
                                    cc.module.userParams.GameSetting["Tags"]      = _JD["tags"];
                                    cc.module.userParams.GameSetting["Levels"]    = _JD["levels"];
                                    break;
                                }
                            }

                            //若已經有帶Antes，則直接帶入規則以及minchips
                            if(cc.module.userParams.NowGameAntes && cc.module.userParams.NowGameAntes != ""){
                                for(var lKey in cc.module.userParams.GameSetting['Levels']){
                                    if(cc.module.userParams.GameSetting['Levels'][lKey]["ante"] == cc.module.userParams.NowGameAntes){            //先比對GameType
                                        let _MinAntes       = cc.module.userParams.GameSetting["Levels"][lKey]["minichips"];
                                        let _RuleBetting    = cc.module.userParams.GameSetting["Levels"][lKey]["rule_betting"];
                                        let _RulePlaying    = cc.module.userParams.GameSetting["Levels"][lKey]["rule_playing"];
                                        let _RuleSetting    = cc.module.userParams.GameSetting["Levels"][lKey]["rule_settling"];
                                        cc.module.userParams.NowRuleID          = _RuleBetting + "," + _RulePlaying + "," + _RuleSetting;  
                                        cc.module.userParams.NowGameMinAntes    = _MinAntes;
                                        break;
                                    }
                                }

                            }
                        }
                        
                        if(typeof(_cb) == "function"){    
                            _cb();
                        }
                        break;
                    default:
                        break;
                }
            }catch(e){
                if(this.DebugMode) {console.log("%c[network] => [GetGameSetting] login err :"+e+".",'color:'+this.DebugModeColor_Msg);}
                this.ManualReconnect.apply();
                
                //回傳錯誤訊息
                let _obj = {
                    ErrorLocation : cc.module.jsonFile["SERVER_GAME_NODEID"] + "[network] => [GetGameSetting]",
                    ErrorMsg : e+" "
                }
                cc.module.network.ErrorTracking(cc.module.jsonFile["SERVER_GAME_NODEID"],"[network] => [GetGameSetting] try catch捕捉錯誤資訊.",_obj);
            }
        }.bind(this)); 
    },

    /** 
     * [手動斷開連線但不做任何跳轉動作]
     * */
    Destroy: function(){
        if(this.DebugMode) {console.log("%c[network] => [Destroy] In action.",'color:'+this.DebugModeColor_FA);}
 
        this.UserCloseMqtt  = true;     //使用者手動轉跳網址
        this.unscheduleAllCallbacks();
        if(cc.module.mqant.connected()){ 
            cc.module.mqant.destroy();
        }
    },
    
    /**
     * [離開房間，並調用_cb]
     * @param {function} _SuccessCB     回調函數，若請求成功調用
     * @param {function} _ErrorCB       回調函數，若請求失敗調用
     */
    BackAntesPlace: function(_SuccessCB,_ErrorCB){
        if(this.DebugMode) {console.log("%c[network] => [BackAntesPlace] In action.",'color:'+this.DebugModeColor_FA);}

        let self = this;
        cc.module.mqant.request(cc.module.jsonFile['SERVER_GAME_NODEID'] + "/HD_Exit", {"BigRoomID":cc.module.userParams.RoomID}, function(destinationName, data) {
            
            if(self.DebugMode) {
                console.log(destinationName);
                console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                console.log(JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))['Result']));
            }
            var jsonData = JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))['Result']);
            
            switch(parseInt(jsonData['Code'])){
                case 1:
                    if(typeof(_SuccessCB) == "function"){     
                        cc.module.userParams.RoomID  = "";   //若已經call了Exit就要清空RoomID                                          
                        _SuccessCB();
                    }
                    break;
                default:
                    if(typeof(_ErrorCB) == "function"){                                                             
                        _ErrorCB();
                    }
                    break;
            }
        });
    },

    /**
    * [斷開連線轉跳回大廳]
    * @param {function} _cb     回調函數，若請求成功再調用
    */
    DestroyBackHall: function(_cb){
        if(this.DebugMode) {console.log("%c[network] => [DestroyBackHall] In action.",'color:'+this.DebugModeColor_FA);}

        if(!cc.module.mqant.connected()) {
            this.WindowLocation("../H5Hall");
        } else {
            let self = this;
            cc.module.mqant.request(cc.module.jsonFile['SERVER_GAME_NODEID'] + "/HD_Exit", {"BigRoomID":cc.module.userParams.RoomID}, function(destinationName, data) {
                
                if(self.DebugMode) {
                    console.log(destinationName);
                    console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                    console.log(JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))['Result']));
                }
                try{
                    var jsonData = JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))['Result']);
                    
                    switch(parseInt(jsonData['Code'])){
                        case 1:
                            cc.module.userParams.RoomID  = "";   //若已經call了Exit就要清空RoomID    
                            self.WindowLocation("../H5Hall");
                            break;
                        default:
                            //若cb是function才做
                            if(typeof(_cb) == "function"){                                                             
                                _cb();
                            }
                            break;
                    }
                    return;
                }catch(e){
                    if(self.DebugMode) {console.log("%c[network] => [DestroyBackHall] login err :"+e+".",'color:'+self.DebugModeColor_Msg);}
                    if(typeof(_cb) == "function"){                                                             
                        _cb();
                    }
                }
            });
        }
    },

    /** 
     * [結束連線重load專案]
     * */
    DestroyReConnect: function(){
        if(this.DebugMode) {console.log("%c[network] => [DestroyReConnect] In action.",'color:'+this.DebugModeColor_FA);}
        this.WindowLocation(window.location.href);
    },

    /** 
     * [結束連線至404page]
     * */
    DestroyTo404Page: function(){
        if(this.DebugMode) {console.log("%c[network] => [DestroyTo404Page] In action.",'color:'+this.DebugModeColor_FA);}
        this.WindowLocation("../404.html");
    },
    
    /** 
     * [斷線重連至對應專案]
     * */
    ReJoinDestroyBackProject: function(){
        if(this.DebugMode) {console.log("%c[network] => [ReJoinDestroyBackProject] In action.",'color:'+this.DebugModeColor_FA);}

        try{
            for(var gKey in cc.module.jsonFile['GAME_LIST']) {
                if(gKey.toLowerCase() == this.RejoinData["Game"].toLowerCase()){
                    //轉跳遊戲專案
                    this.WindowLocation("../"+cc.module.jsonFile['GAME_LIST'][gKey]["HerfName"]+"/?Antes="+this.RejoinData['Antes']);
                    break;
                }
            }
        }catch(e){
            if(this.DebugMode) {console.log("%c[network] => [ReJoinDestroyBackProject] login err :"+e+".",'color:'+this.DebugModeColor_Msg);}
            this.ManualReconnect.apply();
            
            //回傳錯誤訊息
            let _obj = {
                ErrorLocation : cc.module.jsonFile["SERVER_GAME_NODEID"] + "[network] => [ReJoinDestroyBackProject]",
                ErrorMsg : e+" "
            }
            cc.module.network.ErrorTracking(cc.module.jsonFile["SERVER_GAME_NODEID"],"[network] => [ReJoinDestroyBackProject] try catch捕捉錯誤資訊.",_obj);
        }
    },
 
    /** 
     * [取消連線回原本專案]
     * (僅於重連的遊戲已經結算才可以call) */
    ReJoinCancel: function(){
        if(this.DebugMode) {console.log("%c[network] => [CancelRejoin] In action.",'color:'+this.DebugModeColor_FA);}

        let self = this;
        cc.module.mqant.request(this.CancelRejoinTopic +"/HD_CancelRejoin", {}, function(destinationName, data) {
            if(self.DebugMode) {
                console.log(destinationName);
                console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
            }
        });
    },

    /**
     * [網址轉向]
     *  會需要這樣做的原因，是在於如果轉跳網址的時候有需要觸發相關事件時可以統一管理
     *  例如現在轉跳都需要將狀態改為手動離開，才能避免在其他瀏覽器會觸發server close的cb 
     * @param {string} _href 轉跳網址
     */
    WindowLocation(_href){
        if(this.DebugMode) {console.log("%c[network] => [WindowLocation] In action.",'color:'+this.DebugModeColor_FA);}

        this.UserCloseMqtt  = true;     //使用者手動轉跳網址
        if(cc.module.mqant.connected()){ 
            cc.module.mqant.destroy();
        }
        window.location     = _href;    //轉跳網址
    },
    
    /**
     * [錯誤偵測並上傳回報]
     * @param {string}  _Title          錯誤訊息標題 => 通常用專案檔名稱
     * @param {string}  _Content        錯誤訊息內容 => 通常用腳本+方法跟部份文字描述
     * @param {obj}     _ReturnData     回傳的錯誤訊息封包資料，若是封包或者邏輯錯誤可填寫
     */
    ErrorTracking: function(_Title,_Content,_ReturnData){
        if(this.DebugMode) {console.log("%c[network] => [ErrorTracking] In action.",'color:'+this.DebugModeColor_FA);}
 
        console.log(_Title);
        console.log(_Content);
        console.log(_ReturnData); 
        if(cc.module.jsonFile["ERRORTRACKING_SETTING"] && 
           cc.module.jsonFile["ERRORTRACKING_SETTING"]["Enable"] == 1){

            switch(cc.module.jsonFile["ERRORTRACKING_SETTING"]["NowSite"]){
                case "fundebug":
                    //若有引入才執行，用來防呆本地測試
                    if(typeof(fundebug) != "undefined") { 
                        //回傳錯誤訊息
                        fundebug.notify(_Title, _Content, {
                            metaData: _ReturnData 
                        });
                    }
                    break;
                case "sentry":
                    break;
                default:
                    break;
            }
        }
    },

    /**
     * [維持心跳]
     */
    UpdateConnect: function(){
        if(this.DebugMode) {console.log("%c[network] => [UpdateConnect] In action.",'color:'+this.DebugModeColor_FA);}
 
        let self = this;
        this.unschedule(this.HeartbeatTimer_Callback);
        this.HeartbeatTimer_Callback = function () {
            cc.module.mqant.request(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/HD_HB",{}, function (destinationName, data) {
                if(self.DebugMode) {
                    console.log(destinationName);
                    console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                }
            }); 
        }
        this.schedule(this.HeartbeatTimer_Callback, 8); 

    },

    /**
     * [返回包網]
     */
    BackToBowan: function(){
        if(this.DebugMode) {console.log("%c[network] => [BackToBowan] In action.",'color:'+this.DebugModeColor_FA);}
        
        let self = this;
        cc.module.mqant.request(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/HD_RedirectBowan",{}, function (destinationName, data) {
            
            if(self.DebugMode) {
                console.log(destinationName);
                console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
            }
            let _Result     = JSON.parse(cc.module.mqant.parseUTF8(data))["Result"];
            let _ErrorMSg   = JSON.parse(cc.module.mqant.parseUTF8(data))["Error"];

            if(_ErrorMSg && _ErrorMSg != "") {
                this.DestroyTo404Page();
                return;
            }

            if(_Result && _Result != "") {
                self.WindowLocation(_Result);
            } else {
                self.BackToBowan();
            }
        }); 
    },
    
});