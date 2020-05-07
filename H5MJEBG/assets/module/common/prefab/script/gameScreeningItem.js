/** @file       gameScreeningItem.js
  * @brief      遊戲紀錄遊戲篩選item管理.
  * @author     OreoLi
  * @date       2019/06/27 17:04 */

  cc.Class({
    extends: cc.Component,

    properties: {
        Label_label: cc.Label,  //文字敘述節點
        BG_node: cc.Node,       //item背景節點

    },
      
    ctor: function() { 
        this.DebugMode              = false;            //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this._Cb_Enter              = function(){};     //點擊遊戲icon按鈕的callback
        this.Topic                  = "";               //cb要回傳的topic
    },


    /**
     * [初始化節點]
     * @param {string}      _GameName       遊戲名稱
     * @param {string}      _Topic          篩選代稱
     * @param {bool}        _EnableBG       是否啟用背景 {true:開啟,false:關閉}
     * @param {function}    _Cb_Enter       點擊item的callback
     */
    Init: function(_GameName,_Topic,_EnableBG,_Cb_Enter){
        if(this.DebugMode) {console.log("%c[gameScreeningItem] => [Init] in action.",'color:'+this.DebugModeColor_FA);}

        this.Label_label.string         = _GameName;
        this.Label_label.node.active    = true;
        this.Topic                      = _Topic;
        this.BG_node.active             = _EnableBG;
        this._Cb_Enter                  = _Cb_Enter;
    },

    /**
     * [item點擊事件] 
     */
    BtnEnter: function(){
        if(this.DebugMode) {console.log("%c[gameScreeningItem] => [BtnEnter] in action.",'color:'+this.DebugModeColor_FA);}

        if(typeof(this._Cb_Enter) == "function"){     
            this._Cb_Enter(this.Label_label.string,this.Topic);
        } else {
            if(this.DebugMode) {console.log("%ctypeof(_cb) != 'function'.",'color:'+this.DebugModeColor_FA);}
        }
    },
});
