/** @file       apSystemPanel.js
  * @brief      遊戲專案-視窗總管理.
  * @author     OreoLi
  * @date       2019/03/04 11:53 */

  cc.Class({
    extends: cc.Component,

    properties: {
        //節點下，有用到的子節點
        MenuGroup_node:cc.Node,                 //按鈕選單群組節點
        Windows_node:cc.Node,                   //視窗節點

        Marquee_prefab: cc.Prefab,              //跑馬燈預製體
        SettingWindow_prefab: cc.Prefab,        //設置視窗預製體
        RuleWindow_prefab: cc.Prefab,           //遊戲玩法視窗預製體
        UserIconChangeWindow_prefab: cc.Prefab, //頭像切換視窗預製體
        RecordWindow_prefab: cc.Prefab,         //遊戲紀錄視窗預製體
        TipsWindow_prefab: cc.Prefab,           //提示訊息視窗預製體
        LanguageWindow_prefab: cc.Prefab,       //語系切換視窗預製體

        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用     
        BtnClickOnAudio:    {default: null, type: cc.AudioClip},        //按鈕點擊音效載入
        BtnClickOffAudio:   {default: null, type: cc.AudioClip},        //按鈕無法點點擊音效載入
    },

    ctor: function() {
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息
        
        this.WindowsObj             = {};               //儲存所有視窗的預製體，以便後續開啟視窗好調用
    },

    onLoad () {
        this.node.active            = true;             //開啟 系統訊息節點
        this.Windows_node.active   = true;             //開啟 視窗節點

        //設置視窗陣列
        this.WindowsObj['settingWindow']            = this.SettingWindow_prefab;
        this.WindowsObj['ruleWindow']               = this.RuleWindow_prefab;
        this.WindowsObj['userIconChangeWindow']     = this.UserIconChangeWindow_prefab;
        this.WindowsObj['recordWindow']             = this.RecordWindow_prefab;
        this.WindowsObj['languageWindow']           = this.LanguageWindow_prefab;
    },

    /**
    * [腳本初始化]
    */
    Init(){
        if(this.DebugMode) {console.log("%c[apSystemPanel] => [Init] in action.",'color:'+this.DebugModeColor_FA);}

        this.node.active    = true;             

        //目前僅PC端能做到全屏的功能
        let _FullScreenEnable = false;
        if(cc.module.tools.GetDeviceType() == "PC"){
            _FullScreenEnable = true;
        }

        this.MenuGroup_node.getChildByName("btn_fullScreen").active     = _FullScreenEnable;
        this.MenuGroup_node.getChildByName("btn_setting").active        = true;
        this.MenuGroup_node.getChildByName("btn_record").active         = true;
        this.MenuGroup_node.getChildByName("btn_rule").active           = true;
        this.MenuGroup_node.getChildByName("btn_back").active           = true;
        this.MenuGroup_node.getChildByName("btn_language").active       = cc.module.jsonFile["SYSTEM_SETTING"]["language"] 
        if(!this.MenuGroup_node.getChildByName("btn_language").active) {
            this.MenuGroup_node.getChildByName("btn_fullScreen").getComponent(cc.Widget).right = this.MenuGroup_node.getChildByName("btn_language").getComponent(cc.Widget).right;
        }

        //加載跑馬燈預製體，跑馬燈的資訊會依照使用者不同而有所差異
        let _Marquee = cc.instantiate(this.Marquee_prefab);
        _Marquee.getComponent('marquee').Init(cc.module.userParams.UserID);
        if(this.MenuGroup_node.getChildByName(_Marquee.name)){
            this.MenuGroup_node.getChildByName(_Marquee.name).destroy();
        }
        this.MenuGroup_node.addChild(_Marquee);

        this._SITE_Init();   //針對商戶初始化介面
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

        this.MenuGroup_node.getChildByName("btn_back").active = _SiteData["AntesPlace_BtnBackHall_Enable"];
    },

    /**
     * [開關電腦版全屏按鈕事件]
     */
    BtnFullScreen: function(){
        if(this.DebugMode) {console.log("%c[apSystemPanel] => [BtnFullScreen] in action.",'color:'+this.DebugModeColor_FA);}

        cc.module.audio.playEffect(this.BtnClickOnAudio);       //撥放音效
        if(cc.screen.fullScreen()){
            cc.screen.exitFullScreen();
        } else {
            cc.screen.requestFullScreen();
        }
    },
    
    /**
     * [開啟視窗按鈕事件] (若需要不同組件視窗則再撰寫委派事件即可)
     * @param {obj}     event           點擊對象 
     * @param {string}  _WindowName    預開啟的視窗名稱
     */
    BtnOpenWindow: function(event, _WindowName) { 
        if(this.DebugMode) {console.log("%c[apSystemPanel] => [BtnOpenWindow] in action.",'color:'+this.DebugModeColor_FA);}
        
        let self = this;
        this.Windows_node.removeAllChildren(true);             //清空所有子節點
        cc.module.audio.playEffect(this.BtnClickOnAudio);       //撥放音效
        
        //若不是視窗預製體，則有可能是提示型視窗，查看是否有對應的提示視窗字串
        switch(_WindowName){
            case "settingWindow":
                var _Prefab = cc.instantiate(this.WindowsObj[_WindowName]);   //實例化預製體
                _Prefab.getComponent(_WindowName).Init(cc.module.network.HallVersion);  //初始化預製體節點
                this.Windows_node.addChild(_Prefab);                           //加入至視窗節點底下
                _Prefab.getComponent(_WindowName).OpenAnim();                  //播放視窗開啟動畫
                break;
            case "languageWindow":
            case "ruleWindow":
            case "userIconChangeWindow":
            case "recordWindow":
                var _Prefab = cc.instantiate(this.WindowsObj[_WindowName]);    //實例化預製體
                _Prefab.getComponent(_WindowName).Init();                      //初始化預製體節點
                this.Windows_node.addChild(_Prefab);                           //加入至視窗節點底下
                _Prefab.getComponent(_WindowName).OpenAnim();                  //播放視窗開啟動畫
                break;
            case "noCredit":
                var _Prefab = cc.instantiate(this.TipsWindow_prefab);
                this.Windows_node.addChild(_Prefab);
                var _Cb_Enter = function(){
                    cc.module.audio.playEffect(self.BtnClickOnAudio);       //撥放音效
                }

                _Prefab.getComponent("tipsWindow").AlertInit(cc.module.i18n.t('tipsWindow_noCredit'),_Cb_Enter);
                break;
            case "reload":
                var _Prefab = cc.instantiate(this.TipsWindow_prefab);
                this.Windows_node.addChild(_Prefab);
                var _Cb_Enter = function(){
                    cc.module.audio.playEffect(self.BtnClickOnAudio);       //撥放音效
                    cc.module.network.DestroyReConnect();
                }
                _Prefab.getComponent("tipsWindow").AlertInit(cc.module.i18n.t('tipsWindow_reload'),_Cb_Enter);
                break; 
            case "tips":
                var _Prefab = cc.instantiate(this.TipsWindow_prefab);
                this.Windows_node.addChild(_Prefab);
                var _Cb_Enter = function(){
                    cc.module.audio.playEffect(self.BtnClickOnAudio);       //撥放音效
                }
                _Prefab.getComponent("tipsWindow").AlertTitleInit(cc.module.i18n.t('tipsWindow_tips.title'),cc.module.i18n.t('tipsWindow_tips.content'),_Cb_Enter);
                break;
            default:
                if(this.DebugMode) {console.log("%c[apSystemPanel] => [BtnOpenWindow] 出現例外狀況.",'color:'+this.DebugModeColor_Msg);}
                break;
        }
    }, 
    
	/** 
     * [點擊盤口介面的返回，回到大廳專案]
     * */
	BtnBackHall: function(){
        if(this.DebugMode) {console.log("%c[apSystemPanel] => [BtnBackHall] in action.",'color:'+this.DebugModeColor_FA);}
		cc.module.network.DestroyBackHall();
	},
}); 
