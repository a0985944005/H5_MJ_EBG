/** @file       coin.js
  * @brief      跳錢預製體腳本.
  * @author     OreoLi
  * @date       2019/03/20 10:32 */

  cc.Class({
    extends: cc.Component,

    properties: {
        
        WinCoin_node:cc.Node,                   //增加金額的節點
        LoseCoin_node:cc.Node                   //扣除金額的節點
    },

    
    ctor(){ 
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息
    },
    // onLoad () {
    // },

    /** 發送的籌碼預製體 
     *  @param      _StartPosi      Node     {x:X座標位置,y:Y座標位置}
     *  @param      _Coin           float   跳錢金額
    */
    Init: function(_StartPosi,_Coin){
        if(this.DebugMode) {console.log("%c[coin] => [Init] in action.",'color:'+this.DebugModeColor_FA);}
 
        this.WinCoin_node.active    = false;
        var _winCoinStr             = this.WinCoin_node.getComponent(cc.Label);
        _winCoinStr.string          = "";

        this.LoseCoin_node.active   = false;
        var _loseCoinStr            = this.LoseCoin_node.getComponent(cc.Label);
        _loseCoinStr.string         = "";

        this.node.setPosition(cc.v2(_StartPosi.x,_StartPosi.y));
        if(_Coin < 0){
            this.WinCoin_node.active    = false;
            this.LoseCoin_node.active   = true;
            _loseCoinStr.string         = _Coin;
        } else {
            this.WinCoin_node.active    = true;
            this.LoseCoin_node.active   = false;
            _winCoinStr.string          = "+"+_Coin;
        }
        this.node.active            = true; 
    },
});