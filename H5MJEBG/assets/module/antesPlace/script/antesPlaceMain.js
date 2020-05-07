/** @file       antesPlaceMain.js
  * @brief      盤口選擇主邏輯.
  * @author     OreoLi
  * @date       2019/03/04 12:30 */

  cc.Class({
    extends: cc.Component,

    properties: {
		UserPanel_node: 	cc.Node,	//使用者資訊管理
		AntesPanel_node: 	cc.Node,	//遊戲盤口管理
		SystemPanel_node: 	cc.Node,	//遊戲視窗管理
    },

    ctor(){
        this.RealTimeArr;                               //即時處理[陣列]
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息
    },

	onLoad () { 
        cc.module.tools.windowOnResize(cc.find('Canvas').getComponent(cc.Canvas));
      
		this.UserPanel_node.getComponent("apUserPanel").Init();		        //初始化使用者資訊管理模組
		this.AntesPanel_node.getComponent("apAntesPanel").Init();			//初始化遊戲盤口管理模組
		this.SystemPanel_node.getComponent("apSystemPanel").Init();	        //初始化訊息視窗模組
        this.AntesPanel_node.getComponent("apAntesPanel").SetAntes(true);	//開啟盤口畫面
        
        this._SetDelegation();      //相關委派設置
        this._Preload();            //預加載
        this._SITE_Init();          //針對不同商戶的初始化設定

	},

    /**
     * [針對不同商戶的初始化設定]
     */
    _SITE_Init: function(){
        if(this.DebugMode) {console.log("%c[apSystemPanel] => [_SITE_Init] In action.",'color:'+this.DebugModeColor_FA);}

        let _SiteData = {};
        let _NowSite  = cc.module.jsonFile["SITE_SETTING"]["NowSite"];
        if(cc.module.jsonFile["SITE_SETTING"][_NowSite]) {
            _SiteData = cc.module.jsonFile["SITE_SETTING"][_NowSite];
        } else {
            _SiteData = cc.module.jsonFile["SITE_SETTING"]["Default"];
        }
        
        //因為GT_site並沒有大廳的設置，因此盤口需要增加貼心提醒功能，並且只開啟一次
        if(_SiteData["AntesPlace_Tips"] == true && _SiteData["AntesPlace_First"] == true) {
            this.SystemPanel_node.getComponent("apSystemPanel").BtnOpenWindow({},"tips");
            _SiteData["AntesPlace_First"] = false;
        }
    },

    
    /** 
     * [預加載場景]
     *  */
    _Preload: function(){
        
        if(this.DebugMode) {console.log("%c[antesPlaceMain] => [_Preload] in action.",'color:'+this.DebugModeColor_FA);}

        let self = this;
        //預加載遊戲畫面
        cc.director.preloadScene(
            cc.module.jsonFile["PRELOAD_SCENE_LIST"][cc.director.getScene().name],
            
            //目前加載場景進度
            function(completedCount, totalCount, item) {
                // if(self.DebugMode) {console.log("%c正在預加载场景资源 (" + completedCount + "/" + totalCount + ").",'color:'+self.DebugModeColor_FA);}
            },
            
            //目前加載的場景數
            function(err) {
                
                err = err+"";
                if(err != "null") {
                    if(self.DebugMode) {
                        console.log("%c[antesPlaceMain] => [_PreloadScene] cc.director.preloadScene報錯.",'color:'+self.DebugModeColor_FA);
                        console.log(err);
                        console.log(cc.module.jsonFile["PRELOAD_SCENE_LIST"][cc.director.getScene().name]);
                    }
                    //回傳錯誤訊息
                    let _obj = {
                        ErrorLocation : cc.module.jsonFile["SERVER_GAME_NODEID"] + "[antesPlaceMain] => [_PreloadScene]",
                        ErrorMsg : err+" ",
                        ErrorPreloadScene : cc.module.jsonFile["PRELOAD_SCENE_LIST"][cc.director.getScene().name]
                    }
                    cc.module.network.ErrorTracking(cc.module.jsonFile["SERVER_GAME_NODEID"],"[antesPlaceMain] => [_PreloadScene] cc.director.preloadScene報錯.",_obj);
                }
            }
        );
    },
    
    /**
     * [相關委派設置]
     */
    _SetDelegation: function(){
        if(this.DebugMode) {console.log("%c[antesPlaceMain] => [_SetDelegation] In action.",'color:'+this.DebugModeColor_FA);}

        //在盤口選擇畫面時，若沒有錢的回調函式
        this.AntesPanel_node.getComponent("apAntesPanel").SetDelegation(()=>{
            this.SystemPanel_node.getComponent("apSystemPanel").BtnOpenWindow({},"noCredit");
        });
    },

    /** 
     * [通知點數變更]
     * [Subscriber] Gate/ChangeCredit
      * @param {obj} _JsonData 封包資料
     * Payload:
     *  Code	            string	        1: 請求成功 -1: 請求失敗 -2: 餘額不足
     *  Data	            array	        回傳資料 Content-Type: application/json => map
     *  Time	            int	            回傳時間
     * 
     * Data:
     *  credit	            float	        金額
     */
    _CallChangeCredit: function(_JsonData){
        if(this.DebugMode) {console.log("%c[antesPlaceMain] => [_CallChangeCredit] In action.",'color:'+this.DebugModeColor_FA);}

        var _Payload    = _JsonData[1];             //轉存Payload至jsonData變數中
        var _Data       = _Payload["Data"];         //取得回傳的陣列資料
        
        cc.module.userParams.Credit = cc.module.tools.formatFloat(_Data["credit"],2); //取得點數轉入金額
        if(this.DebugMode) {console.log("%c[antesPlaceMain] => [_CallChangeCredit] 接收到點數轉入，目前持有金額為:"+cc.module.userParams.Credit+".",'color:'+this.DebugModeColor_FA);}
    },
    
    /** 
     * [通知強制踢你下線哈哈]
     * [Subscriber] Gate/PowerKick
      * @param {obj} _JsonData 封包資料
     */
    _CallPowerKick: function(_JsonData){
        if(this.DebugMode) {console.log("%c[antesPlaceMain] => [_CallPowerKick] In action.",'color:'+this.DebugModeColor_FA);}

        var _Payload    = _JsonData[1];             //轉存Payload至jsonData變數中
        switch(parseInt(_Payload["Code"])) {
            case -2:    //帳號重複登入
                cc.module.hookMQTT.Destroy();
                cc.module.network.Destroy();
                this.SystemPanel_node.getComponent("apSystemPanel").BtnOpenWindow({},"reload");
                break;
            case -1:    //直接導向404頁面
                cc.module.network.DestroyTo404Page();  //導向404頁面
                
                //回傳錯誤訊息
                var _obj = {
                    ErrorLocation : cc.module.jsonFile["SERVER_GAME_NODEID"] + "[antesPlaceMain] => [_CallPowerKick]",
                    ErrorMsg : "[antesPlaceMain] => [_CallPowerKick] 接收到powerKick code = -1.",
                    ErrorGet : _Payload
                }
                cc.module.network.ErrorTracking(cc.module.jsonFile["SERVER_GAME_NODEID"],"[antesPlaceMain] => [_CallPowerKick] 接收到powerKick code = -1.",_obj);
                break;
            default:
                if(this.DebugMode) {console.log("%c[hallMain] => [_CallPowerKick] 進入例外狀況:code="+_Payload["Code"]+".",'color:'+this.DebugModeColor_FA);}
                
                //回傳錯誤訊息
                var _obj = {
                    ErrorLocation : cc.module.jsonFile["SERVER_GAME_NODEID"] + "[antesPlaceMain] => [_CallPowerKick]",
                    ErrorMsg : "[antesPlaceMain] => [_CallPowerKick] 接收到powerKick code = default 進入例外狀況.",
                    ErrorGet : _Payload
                }
                cc.module.network.ErrorTracking(cc.module.jsonFile["SERVER_GAME_NODEID"],"[antesPlaceMain] => [_CallPowerKick] 接收到powerKick code = default 進入例外狀況.",_obj);
                break;
        }
    },

    update (dt) {
        this.RealTimeArr    = cc.module.hookMQTT.ReturnRealTimeArr();
        for(var rCount = 0 ; rCount < this.RealTimeArr.length ; rCount++){      //跑所有待處理的即時處理事件
            switch(this.RealTimeArr[rCount][0]){                                //call對應的動作function
                case "ChangeCredit":
                    var _intput = this.RealTimeArr[rCount];
                    cc.module.hookMQTT.DeleteRealTimeArr(rCount);
                    this._CallChangeCredit(_intput);
                    return;
                    break;
                case "PowerKick":
                    var _intput = this.RealTimeArr[rCount];
                    cc.module.hookMQTT.DeleteRealTimeArr(rCount);
                    this._CallPowerKick(_intput);
                    return;
                    break;
                default:
                    break;
            }
        }
    },
});
