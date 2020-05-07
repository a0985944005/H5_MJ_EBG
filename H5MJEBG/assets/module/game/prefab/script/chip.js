/** @file       coin.js
  * @brief      跳錢預製體腳本.
  * @author     OreoLi
  * @date       2019/03/20 10:32 */

  cc.Class({
    extends: cc.Component,

    properties: {
        
        // WinCoin_node:cc.Node,                   //增加金額的節點
        // LoseCoin_node:cc.Node                   //扣除金額的節點
        Main_Atlas:cc.SpriteAtlas,
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
     *  @param      _startPosi      Node     {x:X座標位置,y:Y座標位置}
     *  @param      _num            float    籌碼面額
    */
    Init: function(_startPosi,_num){
        if(this.DebugMode) {console.log("%c[coin] => [Init] in action.",'color:'+this.DebugModeColor_FA);}
        
        var _LabelNode = this.node.getChildByName("label").getComponent(cc.Label);
        
        if(_num >= 10){
            _LabelNode.string = 10;
            this.node.getComponent(cc.Sprite).spriteFrame = this.Main_Atlas.getSpriteFrame("chip_p");
        }else{
            _LabelNode.string = 1;
            this.node.getComponent(cc.Sprite).spriteFrame = this.Main_Atlas.getSpriteFrame("chip_g");
        }

        this.node.setPosition(_startPosi);
        this.node.active = true;
        this.node.opacity = 255;
    },
});