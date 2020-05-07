/** @file       joinroom.js
  * @brief      配桌模組.
  * @author     OreoLi
  * @date       2019/06/04 15:03 */

  cc.Class({
    extends: cc.Component,
    properties: {
    },

    ctor: function() {
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this.IsEnterRoom            = false;            //玩家是否已經進入牌桌
        this.CreateAITimeout        = {};               //CreatorAI計時器
        this.RejectBool             = false;            //是否中斷配桌
    },

    /**
     * [設定Property]
     * @param {*} prop      callback function obj
     */
    SetProp: function(prop) {
        if(this.DebugMode) {console.log("%c[joinroom] => [SetProp] In action.",'color:'+this.DebugModeColor_FA);}

        //CallBack集合
        this.JoinRoomCallback           = prop["joinRoom"];         //加入房間
        this.GetTableCallback           = prop["getTable"];         //取得房號
        this.SitDownCallback            = prop["sitDown"];          //坐入牌桌
        this.SitDownSuccessCallback     = prop["sitDownSuccess"];   //成功坐入牌桌

        //初始化
        this.IsEnterRoom            = false;            //玩家是否已經進入牌桌
        this.CreateAITimeout        = {};               //CreatorAI計時器
        this.RejectBool             = false;            //是否中斷配桌

        //開啟配桌
        this.UserJoinRoom();                             
    },

    /** 
     * [用戶加入牌桌流程]
     * */
    UserJoinRoom: function() {
        if(this.DebugMode) {console.log("%c[joinroom] => [UserJoinRoom] In action.",'color:'+this.DebugModeColor_FA);}
        var self = this;
        cc.module.userParams.RoomID = ""; //進入配桌，須將牌桌編號清空
        
        //Promise寫法 
        function Promise_OnGetNodeID(){
            return new Promise(function(resolve, reject){
                resolve("Promise_OnGetNodeID Success");     //回調成功訊息，進入下一個階段
                if(self.DebugMode) {console.log("%c[joinroom] => [UserJoinRoom] [Promise_OnGetNodeID] hook open.",'color:'+self.DebugModeColor_FA);}
                
                cc.module.mqant.on(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/OnGetNodeID", function(destinationName, data) {
                    
                    if(self.RejectBool) {reject("Promise_OnGetNodeID OnGetNodeID 遭強制中斷"); return;} 
                    if(self.DebugMode) {
                        console.log("%c[joinroom] => [UserJoinRoom] [Promise_OnGetNodeID] destinationName:"+destinationName+" request.",'color:'+self.DebugModeColor_GET);
                        console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                    }
                    var _jsonData  = JSON.parse(cc.module.mqant.parseUTF8(data));
                    
                    //訊息驗證
                    if(_jsonData['Code'] != 1){                 //若請求失敗，也需要轉跳回大廳
                        self.ErrorFunc();
                    } else {
                        cc.module.jsonFile["SERVER_GAME_NODEID"] = _jsonData["Data"];
                    } 
                });
            });    
        }


        function Promise_OnSitdowm(){
            return new Promise(function(resolve, reject){
                if(self.DebugMode) {console.log("%c[joinroom] => [UserJoinRoom] [Promise_OnSitdowm] hook open.",'color:'+self.DebugModeColor_FA);}
                
                
                cc.module.mqant.on(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/OnSitdowm", function(destinationName, data) {
                    
                    if(self.RejectBool) {reject("Promise_OnSitdowm OnSitdowm 遭強制中斷"); return;} 
                    if(self.DebugMode) {
                        console.log("%c[joinroom] => [UserJoinRoom] [Promise_OnSitdowm] destinationName:"+destinationName+" request.",'color:'+self.DebugModeColor_GET);
                        console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                    }

                    var _jsonData  = JSON.parse(cc.module.mqant.parseUTF8(data));
                    
                    //只要入座，就停止所有計時器
                    clearTimeout(self.CreateAITimeout);

                    //轉換進入房間狀態
                    self.IsEnterRoom = true;

                    //訊息驗證
                    if(_jsonData['Code'] != 1){                 //若請求失敗，也需要轉跳回大廳
                        self.ErrorFunc();
                    } else {
                        self.SitDownCallback.apply();  
                        self.SitDownSuccessCallback.apply(); 
                    } 
                });
                
                resolve("Promise_OnSitdowm Success");     //回調成功訊息，進入下一個階段
            });    
        }


        function Promise_HD_JoinRoom(){
            return new Promise(function(resolve,reject){
                if(self.DebugMode) {console.log("%c[joinroom] => [UserJoinRoom] [Promise_HD_JoinRoom] In action.",'color:'+self.DebugModeColor_FA);}

                self.JoinRoomCallback.apply(); 

                let _Obj = {"UserAntes":cc.module.userParams.NowGameAntes+"", "UserRules":cc.module.userParams.NowRuleID+""};
                console.log("_Obj:",_Obj);
                cc.module.mqant.request(cc.module.jsonFile['SERVER_GAME_NODEID'] + "/HD_JoinRoom",_Obj , function(destinationName, data) {
                    
                    if(self.RejectBool) {reject("Promise_HD_JoinRoom HD_JoinRoom遭強制中斷"); return;} 

                    if(self.DebugMode) {
                        console.log(cc.module.userParams.NowGameAntes);
                        console.log("%c[joinroom] => [UserJoinRoom] [Promise_HD_JoinRoom] destinationName:"+destinationName+" request.",'color:'+self.DebugModeColor_GET);
                        console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                        console.log(JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))['Result']));
                    }
                              
                    var _jsonData            = JSON.parse(cc.module.mqant.parseUTF8(data));
                    var _jsonData_result     = JSON.parse(_jsonData['Result']);
                    
                    if(_jsonData['Error']){     //若接收到錯誤訊息
                        self.ErrorFunc();
                    } else {
                        if(_jsonData_result['Code'] != 1){              //若請求失敗，也需要轉跳回大廳
                            self.ErrorFunc();
                        } else {
                            self.GetTableCallback.apply();              
                            resolve("Promise_HD_JoinRoom Success");     //回調成功訊息，進入下一個階段
                        } 
                    }
                });
            });
        }

        function Promise_HD_CreateAI(){
            return new Promise(function(resolve,reject){
                if(self.DebugMode) {console.log("%c[joinroom] => [UserJoinRoom] [Promise_HD_CreateAI] In action.",'color:'+self.DebugModeColor_FA);}

                resolve("Promise_HD_CreateAI Success"); //回掉成功訊息，進入下一個階段

                //若等待配桌時間過長(預設2秒)則call HD_CreateAI
                self.CreateAITimeout = setTimeout(function () {                 
                    
                    if(self.RejectBool) {reject("Promise_HD_CreateAI CreateAITimeout 遭強制中斷"); return;} 

                    if(self.DebugMode) {
                        console.log("%c[joinroom] => [UserJoinRoom] [Promise_HD_CreateAI] setTimeout.",'color:'+self.DebugModeColor_Msg);
                        if(!self.IsEnterRoom && cc.module.jsonFile['CREATE_AI_ENABLE'] == 1){
                            console.log("on HD_Create**");
                        } else {
                            console.log("off HD_Create**");
                        }
                    }

                    let _Obj = {"UserAntes":cc.module.userParams.NowGameAntes+"", "UserRules":cc.module.userParams.NowRuleID+""};
                    if(!self.IsEnterRoom && cc.module.jsonFile['CREATE_AI_ENABLE'] == 1){
                        cc.module.mqant.request(cc.module.jsonFile['SERVER_GAME_NODEID'] +"/HD_CreateAI", _Obj, function(destinationName, data) {
                            
                            if(self.DebugMode) {
                                console.log("%c[joinroom] => [UserJoinRoom] [Promise_HD_CreateAI] destinationName:"+destinationName+" request.",'color:'+self.DebugModeColor_GET);
                                console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                                console.log(JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))['Result']));
                            }

                            var _jsonData           = JSON.parse(cc.module.mqant.parseUTF8(data));
                            var _jsonData_result    = JSON.parse(_jsonData['Result']);
        
                            if(_jsonData_result['Code'] == 1) {
                                if(self.DebugMode) {console.log("%c[joinroom] => [UserJoinRoom] [Promise_HD_CreateAI] HD_CreateAI success.",'color:'+self.DebugModeColor_GET);}
                            } else {
                                console.log("AI創建失敗 code:"+_jsonData_result['Code']);
                                if(self.DebugMode) {
                                    console.log("[joinroom] => [UserJoinRoom] [Promise_HD_CreateAI] HD_CreateAI Code : " + _jsonData_result['Code']);
                                    console.log("[joinroom] => [UserJoinRoom] [Promise_HD_CreateAI] HD_CreateAI Error : " + _jsonData_result['Error']);
                                }
                            }
                        });
                    }
                }, cc.module.jsonFile['CREATE_AI_TIMER']);
            });   
        }

        //獲取log訊息
        function _catch(e){
            if(self.DebugMode) {
                console.log("%c[joinroom] => [UserJoinRoom] [Promise_OnSitdowm] _catch:",'color:'+self.DebugModeColor_GET);
                console.log(e);
            }
        }

        Promise_OnGetNodeID().then(Promise_OnSitdowm).then(Promise_HD_JoinRoom).then(Promise_HD_CreateAI).catch(_catch);
    },

    /**
     * [錯誤動作重新導向]
     */
    ErrorFunc: function(){
        if(this.DebugMode) {console.log("%c[joinroom] => [ErrorFunc] In action.",'color:'+this.DebugModeColor_FA);}

        let _BackHallErrorCB = function(){
        }.bind(this);

        let _BackHallSuccessCB = function(){
            this.CloseJoinRoom(); //中斷配桌腳本
            cc.director.loadScene("antesPlaceMain");
        }.bind(this);

        cc.module.network.BackAntesPlace(_BackHallSuccessCB,_BackHallErrorCB);         //轉跳回盤口
    },

    /**
     * [取消配桌]
     * 基本上只會發生再返回antesPlace場景的時候
     */
    CloseJoinRoom: function(){
        if(this.DebugMode) {console.log("%c[joinroom] => [CloseJoinRoom] In action.",'color:'+this.DebugModeColor_FA);}
        this.RejectBool = true;
        clearTimeout(this.CreateAITimeout);
    },
})
