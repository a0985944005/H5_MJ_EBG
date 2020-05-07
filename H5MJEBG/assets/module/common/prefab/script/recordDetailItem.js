/** @file       recordDetailItem.js
  * @brief      訂單明細列管理.
  * @author     OreoLi
  * @date       2019/06/27 17:04 */

cc.Class({
    extends: cc.Component,

    properties: {
        BG_node: cc.Node,                   //item背景節點
        LabelNumber_label:cc.Label,         //筆數文字
        LabelBetAt_label:cc.Label,          //明細時間文字
        LabelBetAmount_label:cc.Label,      //投注金額文字
        LabelValidAmount_label:cc.Label,    //有效投注金額文字
        LabelBetResult_label:cc.Label,      //派彩文字
        LabelBetBK_label:cc.Label,          //備註文字
    },
      
    ctor: function() { 
        this.DebugMode              = false;            //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息
    },

    /**
     * [初始化節點]
     * @param {string}      _Number         筆數文字
     * @param {string}      _BetAt          明細時間文字
     * @param {string}      _BetAmount      投注金額文字
     * @param {string}      _ValidAmount    有效投注金額文字
     * @param {string}      _BetResult      派彩文字
     * @param {string}      _BetBK          備註文字
     * @param {bool}        _EnableBG       是否啟用背景 {true:開啟,false:關閉}
     */
    Init: function(_Number,_BetAt,_BetAmount,_ValidAmount,_BetResult,_BetBK,_EnableBG){
        if(this.DebugMode) {console.log("%c[recordDetailItem] => [Init] in action.",'color:'+this.DebugModeColor_FA);}

        this.LabelNumber_label.string           = _Number;      //筆數文字
        this.LabelBetAt_label.string            = _BetAt;       //明細時間文字
        this.LabelBetAmount_label.string        = _BetAmount;   //投注金額文字
        this.LabelValidAmount_label.string      = _ValidAmount; //有效投注金額文字
        this.LabelBetBK_label.string            = _BetBK;       //備註文字
        
        if(parseFloat(_BetResult) >= 0 ) {
            this.LabelBetResult_label.node.color         = new cc.Color(55, 150, 0);
            this.LabelBetResult_label.string        = "+"+_BetResult;   
        } else {
            this.LabelBetResult_label.node.color         = new cc.Color(255, 20, 21);
            this.LabelBetResult_label.string        = _BetResult;   
        }
        this.BG_node.active                     = _EnableBG;
    },
});
