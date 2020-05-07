/** @file       recordOrderItem.js
  * @brief      訂單列管理.
  * @author     OreoLi
  * @date       2019/06/27 17:04 */

cc.Class({
    extends: cc.Component,

    properties: {
        SystemMain_Atlas: cc.SpriteAtlas,       //系統圖片資源
        SystemMain_en_Atlas: cc.SpriteAtlas,    //系統圖片資源 (英文)
        SystemMain_tw_Atlas: cc.SpriteAtlas,    //系統圖片資源 (繁體)

        BG_node: cc.Node,               //item背景節點
        BtnDetail_node:cc.Node,         //訂單明細按鈕節點
        LabelNumber_label:cc.Label,     //筆數文字
        LabelSN_label:cc.Label,         //牌局編號文字
        LabelGameName_label:cc.Label,   //遊戲名稱文字
        LabelOrderAt_label:cc.Label,    //訂單產生時間文字
        LabelBetAmount_label:cc.Label,  //投注金額文字
        LabelBetResult_label:cc.Label,  //派彩金額文字

        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用                                 
        BtnClickOnAudio:        {  default: null,  type: cc.AudioClip  },       //按鈕點擊音效載入
    },
      
    ctor: function() { 
        this.DebugMode              = false;            //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this._Cb_Enter              = function(){};     //點擊明細按鈕的callback
    },

    /**
     * [初始化節點]
     * @param {string}      _Number         筆數文字
     * @param {string}      _SN             牌局編號文字
     * @param {string}      _GameName       遊戲名稱文字
     * @param {string}      _OrderAt        訂單產生時間文字
     * @param {string}      _BetAmount      投注金額文字
     * @param {string}      _BetResult      派彩金額文字
     * @param {bool}        _EnableBG       是否啟用背景 {true:開啟,false:關閉}
     * @param {function}    _Cb_Enter       點擊明細按鈕的callback
     */
    Init: function(_Number,_SN,_GameName,_OrderAt,_BetAmount,_BetResult,_EnableBG,_Cb_Enter){
        if(this.DebugMode) {console.log("%c[recordOrderItem] => [Init] in action.",'color:'+this.DebugModeColor_FA);}

        //語系切換
        // let _Language = cc.sys.localStorage.getItem("Language");
        // switch(_Language){
        //     case 'cn':
        //         this.BtnDetail_node.getComponent(cc.Sprite).spriteFrame = this.SystemMain_Atlas.getSpriteFrame("btn_detail");
        //         break;
        //     case 'tw':
        //         this.BtnDetail_node.getComponent(cc.Sprite).spriteFrame = this.SystemMain_tw_Atlas.getSpriteFrame("btn_detail");
        //         break;
        //     case 'en':
        //         this.BtnDetail_node.getComponent(cc.Sprite).spriteFrame = this.SystemMain_en_Atlas.getSpriteFrame("btn_detail");
        //         break;
        //     default:
        //         break;
        // }

        this.LabelNumber_label.string           = _Number;
        this.LabelSN_label.string               = _SN;
        this.LabelGameName_label.string         = _GameName;
        this.LabelOrderAt_label.string          = _OrderAt;
        this.LabelBetAmount_label.string        = _BetAmount;
        
        if(parseFloat(_BetResult) >= 0 ) {
            this.LabelBetResult_label.node.color         = new cc.Color(55, 150, 0);
            this.LabelBetResult_label.string        = "+"+_BetResult;   
        } else {
            this.LabelBetResult_label.node.color         = new cc.Color(255, 20, 21);
            this.LabelBetResult_label.string        = _BetResult;   
        }
        this.BG_node.active                     = _EnableBG;
        this._Cb_Enter                          = _Cb_Enter;
    },

    /**
     * [item] 點擊事件
     */
    BtnEnter: function(){
        if(this.DebugMode) {console.log("%c[recordOrderItem] => [BtnEnter] in action.",'color:'+this.DebugModeColor_FA);}

        if(typeof(this._Cb_Enter) == "function"){    
            cc.module.audio.playEffect(this.BtnClickOnAudio);    //撥放音效
            this._Cb_Enter(this.LabelSN_label.string,this.LabelGameName_label.string,this.LabelBetAmount_label.string);
        } else {
            if(this.DebugMode) {console.log("%ctypeof(_cb) != 'function'.",'color:'+this.DebugModeColor_FA);}
        }
    },
});
