/** @file       tipsWindown.js
  * @brief      視窗管理.
  * @author     OreoLi
  * @date       2019/06/27 17:04 */

  cc.Class({
    extends: cc.Component,

    properties: {
        SystemMain_Atlas: cc.SpriteAtlas,       //系統圖片資源
        SystemMain_en_Atlas: cc.SpriteAtlas,    //系統圖片資源 (英文語系)
        SystemMain_tw_Atlas: cc.SpriteAtlas,    //系統圖片資源 (繁體語系)
        BtnEnter_node:cc.Node,                  //確認按鈕節點
        BtnCancel_node:cc.Node,                 //取消按鈕節點
        Title_label:cc.Label,                   //標題文字
        Content_label:cc.Label,                 //文字
    },
      
    ctor: function() { 
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this._Cb_Enter              = function(){};     //確認按鈕的callback
        this._Cb_Cancel             = function(){};     //取消按鈕的callback

        //按鈕位置定義
        this.Confirm_Enter_x        = -240;
        this.Confirm_Cancel_x       = 240;
        this.Alert_Enter_x          = 0;
        this.Alert_Content_y        = 45;
        this.AlertTitle_Content_y   = -14;
        this.AlertPoint_Content_y   = -5;
    },

    /**
     * [基本初始化]
     * 不使用onload是因為，透過預置體加載onload會跑在其他方法後方，因此變成我開啟的按鈕，被onload關閉
     * 
     * @param {string} _BtnState 按鈕狀態
     * - basic      基本按鍵(btn_enter、btn_cancel)
     * - waitting   等待按鍵(btn_rejoinrrom、btn_back_window)
     */
    Init: function(_BtnState){
        if(this.DebugMode) {console.log("%c[tipsWindown] => [Init] in action.",'color:'+this.DebugModeColor_FA);}
        this.BtnEnter_node.active       = false;
        this.BtnCancel_node.active      = false;
        this.Title_label.node.active    = false;
        this.Content_label.node.active  = false;
        this.Content_label.unscheduleAllCallbacks(); //停止該組件所有計時器
        
        let _Atlas;
        
        let _Language = cc.sys.localStorage.getItem("Language");
        if(!_Language || _Language == "") {
            _Language = 'cn';
        } 
        switch(_Language){
            case 'cn':  //系統圖片資源 (簡體語系)
                _Atlas = this.SystemMain_Atlas;
                break;
            case 'tw':  //系統圖片資源 (英文語系)
                _Atlas = this.SystemMain_tw_Atlas;
                break;
            case 'en':  //系統圖片資源 (繁體語系)
                _Atlas = this.SystemMain_en_Atlas;
                break;
            default:
                break;
        }

        switch(_BtnState){
            default:
            case "basic":
                this.BtnEnter_node.getComponent(cc.Sprite).spriteFrame  = _Atlas.getSpriteFrame("btn_enter");
                this.BtnCancel_node.getComponent(cc.Sprite).spriteFrame = _Atlas.getSpriteFrame("btn_cancel");
                break;
            case "waitting":
                this.BtnEnter_node.getComponent(cc.Sprite).spriteFrame  = _Atlas.getSpriteFrame("btn_rejoinrrom");
                this.BtnCancel_node.getComponent(cc.Sprite).spriteFrame = _Atlas.getSpriteFrame("btn_back_window");
                break
        }
    },

    /**
     * [設定畫面初始化] (確認、取消)
     * @param {string}      _ContentStr     //文字內容
     * @param {function}    _Cb_Enter       //確認按鈕的callback
     * @param {function}    _Cb_Cancel      //取消按鈕的callback
     */
    ConfirmInit: function(_ContentStr,_Cb_Enter,_Cb_Cancel){
        if(this.DebugMode) {console.log("%c[tipsWindown] => [ConfirmInit] in action.",'color:'+this.DebugModeColor_FA);}

        this.Init("basic");
        this._Cb_Enter              = _Cb_Enter;
        this._Cb_Cancel             = _Cb_Cancel;
        this.BtnEnter_node.x        = this.Confirm_Enter_x;
        this.BtnCancel_node.x       = this.Confirm_Cancel_x;

        this.BtnEnter_node.active   = true;
        this.BtnCancel_node.active  = true;
        this.Content_label.string   = _ContentStr;
        this.Content_label.node.active = true;
    },

    /**
     * [設定畫面初始化] (等待、返回)
     * @param {string}      _ContentStr     //文字內容
     * @param {function}    _Cb_Enter       //確認按鈕的callback
     * @param {function}    _Cb_Cancel      //取消按鈕的callback
     */
    ConfirmInit_Wait: function(_ContentStr,_Cb_Enter,_Cb_Cancel){
        if(this.DebugMode) {console.log("%c[tipsWindown] => [ConfirmInit_Wait] in action.",'color:'+this.DebugModeColor_FA);}

        this.Init("waitting");
        this._Cb_Enter              = _Cb_Enter;
        this._Cb_Cancel             = _Cb_Cancel;
        this.BtnEnter_node.x        = this.Confirm_Enter_x;
        this.BtnCancel_node.x       = this.Confirm_Cancel_x;

        this.BtnEnter_node.active   = true;
        this.BtnCancel_node.active  = true;
        this.Content_label.string   = _ContentStr;
        this.Content_label.node.active = true;
    },


    /**
     * [設定畫面初始化] (確認)
     * @param {string}      _ContentStr     //文字內容
     * @param {function}    _Cb_Enter       //確認按鈕的callback
     */
    AlertInit: function(_ContentStr,_Cb_Enter){
        if(this.DebugMode) {console.log("%c[tipsWindown] => [AlertInit] in action.",'color:'+this.DebugModeColor_FA);}
        
        this.Init("basic");
        this._Cb_Enter              = _Cb_Enter;

        this.BtnEnter_node.x        = this.Alert_Enter_x;
        this.BtnEnter_node.active   = true;

        this.Content_label.string   = _ContentStr;
        this.Content_label.node.y   = this.Alert_Content_y;
        this.Content_label.node.active = true;
    },

    /**
     * [設定畫面初始化] (確認含標題)
     * @param {string}      _TitleStr       //標題文字內容
     * @param {string}      _ContentStr     //文字內容
     * @param {function}    _Cb_Enter       //確認按鈕的callback
     */
    AlertTitleInit: function(_TitleStr,_ContentStr,_Cb_Enter){
        if(this.DebugMode) {console.log("%c[tipsWindown] => [AlertInit] in action.",'color:'+this.DebugModeColor_FA);}
        
        this.Init("basic");
        this._Cb_Enter              = _Cb_Enter;
        this.BtnEnter_node.x        = this.Alert_Enter_x;
        this.BtnEnter_node.active   = true;

        this.Title_label.string     = _TitleStr;
        this.Title_label.node.active= true;

        this.Content_label.node.y   = this.AlertTitle_Content_y;
        this.Content_label.string   = _ContentStr;
        this.Content_label.node.active = true;
    },

    /**
     * [純提示訊息，含文字點點點動畫]
     * @param {string}      _ContentStr     //文字內容
     */
    AlertPointInit: function(_ContentStr){
        if(this.DebugMode) {console.log("%c[tipsWindown] => [AlertPointInit] in action.",'color:'+this.DebugModeColor_FA);}

        this.Init("basic");

        this.Content_label.node.y   = this.AlertPoint_Content_y;
        this.Content_label.string   = _ContentStr;
        this.Content_label.node.active = true;

        let noPointStr 	= _ContentStr.substring(0, _ContentStr.length-3);
        let pointNumber = 0;
        let _pstr = "";

        let self = this;
        let _Callback = function () {
            if(pointNumber > 2) {
                pointNumber = 0;
                _pstr		= "";
            } else {
                pointNumber++;
                _pstr += ".";
            }

            self.Content_label.string = noPointStr + _pstr;
        }.bind(this)
        this.Content_label.schedule(_Callback, 0.3);
    },

    /**
     * [確認按鈕] 點擊事件
     */
    BtnEnter: function(){
        if(this.DebugMode) {console.log("%c[tipsWindown] => [BtnEnter] in action.",'color:'+this.DebugModeColor_FA);}
        if(typeof(this._Cb_Enter) == "function"){     
            this._Cb_Enter();
        } else {
            if(this.DebugMode) {console.log("%ctypeof(_cb) == 'undefined'.",'color:'+this.DebugModeColor_FA);}
        }
        this.node.active = false;
    },

    /**
     * [取消按鈕] 點擊事件
     */
    BtnCancel: function(){
        if(this.DebugMode) {console.log("%c[tipsWindown] => [BtnCancel] in action.",'color:'+this.DebugModeColor_FA);}
        if(typeof(this._Cb_Enter) == "function"){     
            this._Cb_Cancel();
        } else {
            if(this.DebugMode) {console.log("%ctypeof(_cb) == 'undefined'.",'color:'+this.DebugModeColor_FA);}
        }
        this.node.active = false;
    },

    /**
     * [關閉所有視窗]
     */
    CloseWindowns:function(){
        if(this.DebugMode) {console.log("%c[tipsWindown] => [CloseWindowns] in action.",'color:'+this.DebugModeColor_FA);}
        this.node.active = false;
    },
});
