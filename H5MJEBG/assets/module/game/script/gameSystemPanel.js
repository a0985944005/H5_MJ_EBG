/** @file       gameSystemPanel.js
  * @brief      遊戲專案-視窗總管理.
  * @author     OreoLi
  * @date       2019/03/14 11:53 */

  cc.Class({
    extends: cc.Component,

    properties: {
        //節點下，有用到的子節點
        BtnFullScreen_node: cc.Node,            //全屏按鈕節點
        BtnMenu_node: cc.Node,                  //選單按鈕節點
        MenuGroup_node:cc.Node,                 //按鈕選單群組節點
        Windows_node:cc.Node,                  //視窗節點

        SettingWindow_prefab: cc.Prefab,       //設置視窗預製體
        RuleWindow_prefab: cc.Prefab,          //遊戲玩法視窗預製體
        RecordWindow_prefab: cc.Prefab,        //遊戲紀錄視窗預製體
        TipsWindow_prefab: cc.Prefab,          //提示訊息視窗預製體

        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用     
        BtnClickOnAudio:    {default: null, type: cc.AudioClip},        //按鈕點擊音效載入
        BtnClickOffAudio:   {default: null, type: cc.AudioClip},        //按鈕無法點點擊音效載入
    },

    ctor: function() {
        this.DebugMode              = false;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息
        
        this.WindowsObj            = {};               //儲存所有視窗的預製體，以便後續開啟視窗好調用
        
    },

    onLoad () {
        this.node.active            = true;             //開啟 系統訊息節點
        this.Windows_node.active   = true;             //開啟 視窗節點

        console.log(navigator);

        //設置視窗陣列
        this.WindowsObj['settingWindow']          = this.SettingWindow_prefab;
        this.WindowsObj['ruleWindow']             = this.RuleWindow_prefab;
        this.WindowsObj['recordWindow']           = this.RecordWindow_prefab;
    },
    /** 
     * [腳本初始化] 
     * */
    Init(){
        if(this.DebugMode) {console.log("%c[gameSystemPanel] => [Init] in action.",'color:'+this.DebugModeColor_FA);}

        //目前僅PC端能做到全屏的功能
        let _FullScreenEnable = false;
        if(cc.module.tools.GetDeviceType() == "PC"){
            _FullScreenEnable = true;
        }

        this.node.active                = true;                     //開啟 主視窗
        this.BtnFullScreen_node.active  = _FullScreenEnable;        //開啟 全屏按鈕
        this.BtnMenu_node.active        = true;                     //開啟 主選單按鈕
        this.MenuGroup_node.active      = false;                    //關閉 子選單結構
        this.Windows_node.active       = true;                     //開啟 視窗節點
    },

    /**
     * [開關電腦版全屏按鈕事件]
     */
    BtnFullScreen: function(){
        if(this.DebugMode) {console.log("%c[gameSystemPanel] => [BtnFullScreen] in action.",'color:'+this.DebugModeColor_FA);}

        cc.module.audio.playEffect(this.BtnClickOnAudio);       //撥放音效
        if(cc.screen.fullScreen()){
            cc.screen.exitFullScreen();
        } else {
            cc.screen.requestFullScreen();
        }
    },
    
    /**
     * [子選單按鈕點擊事件] 
     * @param {obj} event    點擊事件對象
     * @param {int} _State   {0:關閉,1:開啟}
     */  
    BtnSubMenu: function(event,_State){
        if(this.DebugMode) {console.log("%c[gameSystemPanel] => [BtnSubMenu] in action.",'color:'+this.DebugModeColor_FA);}

        if(_State == 1){
            cc.module.audio.playEffect(this.BtnClickOnAudio);   //撥放音效
            this.MenuGroup_node.active      = true;             //開啟 子選單結構
        } else {
            this.MenuGroup_node.active      = false;            //關閉 子選單結構
        }
    },

    /**
     * [開啟視窗按鈕事件] (若需要不同組件視窗則再撰寫委派事件即可)
     * @param {obj}         event           點擊對象 
     * @param {string}      _WindowName     預開啟的視窗名稱
     * @param {function}    _cb             回調事件
     */
    BtnOpenWindow: function(event, _WindowName,_cb) { 
        if(this.DebugMode) {console.log("%c[gameSystemPanel] => [BtnOpenWindow] in action.",'color:'+this.DebugModeColor_FA);}
        
        let self = this;
        this.MenuGroup_node.active      = false;                //關閉 子選單結構
        this.Windows_node.removeAllChildren(true);             //清空所有子節點
        cc.module.audio.playEffect(this.BtnClickOnAudio);       //撥放音效
        
        //若不是視窗預製體，則有可能是提示型視窗，查看是否有對應的提示視窗字串
        switch(_WindowName){
            case "waitingTimeout":
                var _Prefab = cc.instantiate(this.TipsWindow_prefab);
                this.Windows_node.addChild(_Prefab);
                var _Cb_Enter = function(){     //等待，重新joinroom
                    _cb();
                }
                var _Cb_Cancel = function(){    //返回
                    cc.module.userParams.GameEndCheck  = true;
                    self.BtnBackHall();
                }
                _Prefab.getComponent("tipsWindow").ConfirmInit_Wait(cc.module.i18n.t("tipsWindow_waiting"),_Cb_Enter,_Cb_Cancel);
                break;
            case "settingWindow":
                var _Prefab = cc.instantiate(this.WindowsObj[_WindowName]);   //實例化預製體
                _Prefab.getComponent(_WindowName).Init(cc.module.network.GameVersion);                      //初始化預製體節點
                this.Windows_node.addChild(_Prefab);                           //加入至視窗節點底下
                _Prefab.getComponent(_WindowName).OpenAnim();                  //播放視窗開啟動畫
                break;
            case "ruleWindow":
            // case "userIconChangeWindow":
            case "recordWindow":
                var _Prefab = cc.instantiate(this.WindowsObj[_WindowName]);   //實例化預製體
                _Prefab.getComponent(_WindowName).Init();                      //初始化預製體節點
                this.Windows_node.addChild(_Prefab);                           //加入至視窗節點底下
                _Prefab.getComponent(_WindowName).OpenAnim();                  //播放視窗開啟動畫
                break;
            // case "noCredit":
            //     var _Prefab = cc.instantiate(this.TipsWindow_prefab);
            //     this.Windows_node.addChild(_Prefab);
            //     var _Cb_Enter = function(){
            //         cc.module.audio.playEffect(self.BtnClickOnAudio);       //撥放音效
            //     }
            //     _Prefab.getComponent("tipsWindow").AlertInit("金额不足，无法进入游戏",_Cb_Enter);
            //     break;
            case "reload":
                var _Prefab = cc.instantiate(this.TipsWindow_prefab);
                this.Windows_node.addChild(_Prefab);
                var _Cb_Enter = function(){
                    cc.module.audio.playEffect(self.BtnClickOnAudio);       //撥放音效
                    cc.module.network.DestroyReConnect();
                }
                _Prefab.getComponent("tipsWindow").AlertInit(cc.module.i18n.t('tipsWindow_reload'),_Cb_Enter);
                break;
            // case "tips":
            //     var _Prefab = cc.instantiate(this.TipsWindow_prefab);
            //     this.Windows_node.addChild(_Prefab);
            //     var _Cb_Enter = function(){
            //         cc.module.audio.playEffect(self.BtnClickOnAudio);       //撥放音效
            //     }
            //     _Prefab.getComponent("tipsWindow").AlertTitleInit("贴心提醒","足智多谋的小伙伴们\n详阅玩法说明后，开始斗智斗勇吧",_Cb_Enter);
            //     break;
            default:
                if(this.DebugMode) {console.log("%c[hallSystemPanel] => [BtnOpenWindow] 出現例外狀況.",'color:'+this.DebugModeColor_FA);}
                break;
        }
    }, 

	/** 點擊盤口介面的返回，回到大廳專案 */
	BtnBackHall: function(){
        if(this.DebugMode) {console.log("%c[gameSystemPanel] => [BtnBackHall] in action.",'color:'+this.DebugModeColor_FA);}

        let self = this;
        let _Prefab = cc.instantiate(this.TipsWindow_prefab);

        self.BtnSubMenu({},0);

        //返回盤口介面要執行的動作
        let _GoToAntesPlace = function(){
            cc.module.joinroom.CloseJoinRoom();         //中斷配桌腳本
            cc.module.userParams.GamePeriod     = 0;    //目前遊戲進程 {-1:其他狀態/尚未配桌,0:結算,1:成功坐下牌桌,2:遊戲中}
            _Prefab.getComponent("tipsWindow").AlertPointInit(cc.module.i18n.t("tipsWindow_backHall")); 
            
            let _BackHallErrorCB = function(){
                _CantBackAntesPlace();
            }.bind(this);

            let _BackHallSuccessCB = function(){
                
                let _SiteData = {};
                let _NowSite  = cc.module.jsonFile["SITE_SETTING"]["NowSite"];
                if(cc.module.jsonFile["SITE_SETTING"][_NowSite]) {
                    _SiteData = cc.module.jsonFile["SITE_SETTING"][_NowSite];
                }

                //因為GT_site並沒有大廳的設置，因此盤口需要增加貼心提醒功能，並且只開啟一次
                if(_SiteData["Game_BtnBackHall_ToBowan"] == true) {
                    cc.module.network.BackToBowan();
                } else {
                    cc.director.loadScene("antesPlaceMain");
                }
            }.bind(this);
            
            cc.module.network.BackAntesPlace(_BackHallSuccessCB,_BackHallErrorCB);         //轉跳回盤口
        }

        //遊戲進行中無法返回大廳
        let _CantBackAntesPlace = function(){
            let _Cb_Enter = function(){
                cc.module.audio.playEffect(self.BtnClickOnAudio);       //撥放音效
            }
            _Prefab.getComponent("tipsWindow").AlertInit(cc.module.i18n.t("tipsWindow_cantBackHall"),_Cb_Enter);
        }

        if(cc.module.userParams.GameEndCheck  == true) {    //遊戲已結束可返回大廳
            _GoToAntesPlace();
        } else {
            _CantBackAntesPlace();
        }
        
        this.Windows_node.addChild(_Prefab);
    },



});
