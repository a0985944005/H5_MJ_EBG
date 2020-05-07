/** @file       apAntesPanel.js
  * @brief      遊戲專案-盤口管理.
  * @author     OreoLi
  * @date       2019/03/04 12:00 */

  cc.Class({
    extends: cc.Component,

    properties: {
        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用     
        BtnClickOnAudio:    {default: null, type: cc.AudioClip},        //按鈕點擊音效載入
    },

    ctor: function() {
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this.NoCreditAler_cb;                           //金額不足時的回調
    },

    onLoad () {
    },

    /** 
     * [選擇盤口初始化]  
     * */
    Init: function(){
        if(this.DebugMode) {console.log("%c[apAntesPanel] => [Init] in action.",'color:'+this.DebugModeColor_FA);}
        this.node.active  = false;                              //關閉 盤口節點
    },

    /**
     * [金額不足時的alert動畫委派]
     * @param {function} _cb 金額不足時的回調
     */
    SetDelegation: function(_cb){
        if(this.DebugMode) {console.log("%c[apAntesPanel] => [SetDelegation] in action.",'color:'+this.DebugModeColor_FA);}
        this.NoCreditAler_cb = _cb;
    },

    /**
     * [盤口介面(開啟/關閉)]
     * @param {bool} _State     {true:開啟,false:關閉}
     */
    SetAntes: function(_State){
        if(this.DebugMode) {console.log("%c[apAntesPanel] => [SetAntes] in action.",'color:'+this.DebugModeColor_FA);}

        if(_State) {
            
            let _DataLevels = cc.module.userParams.GameSetting["Levels"];
            console.log("_DataLevels",_DataLevels);
            for(var aCount = 0 ; aCount < this.node.getChildByName("antesGroup").children.length; aCount++){
                if(!_DataLevels[(aCount+1)] || _DataLevels[(aCount+1)]['status'] != 1) {
                    this.node.getChildByName("antesGroup").children[aCount].active = false;
                } else { 
                    switch(cc.module.userParams.GameName){
                        case "pokerDZPK":
                            this.node.getChildByName("antesGroup").children[aCount].getChildByName("group").y = 0;
                            this.node.getChildByName("antesGroup").children[aCount].getChildByName("group").getChildByName("label_maxAntes").active = true;
                            this.node.getChildByName("antesGroup").children[aCount].getChildByName("group").getChildByName("maxAntesNumber").active = true;
    
                            this.node.getChildByName("antesGroup").children[aCount].getChildByName("group").getChildByName("antesNumber").getComponent(cc.Label).string = cc.module.tools.formatFloat(_DataLevels[(aCount+1)]["ante"] / 2,2) + "/" + _DataLevels[(aCount+1)]["ante"];
                            this.node.getChildByName("antesGroup").children[aCount].getChildByName("group").getChildByName("minAntesNumber").getComponent(cc.Label).string = _DataLevels[(aCount+1)]["minichips"];
                            this.node.getChildByName("antesGroup").children[aCount].getChildByName("group").getChildByName("maxAntesNumber").getComponent(cc.Label).string = cc.module.tools.formatFloat(_DataLevels[(aCount+1)]["ante"],2) * 100;
                            break;
                        default: 
                            this.node.getChildByName("antesGroup").children[aCount].getChildByName("group").y = -30;
                            this.node.getChildByName("antesGroup").children[aCount].getChildByName("group").getChildByName("label_maxAntes").active = false;
                            this.node.getChildByName("antesGroup").children[aCount].getChildByName("group").getChildByName("maxAntesNumber").active = false;
                            
                            this.node.getChildByName("antesGroup").children[aCount].getChildByName("group").getChildByName("antesNumber").getComponent(cc.Label).string     = cc.module.tools.formatFloat(_DataLevels[(aCount+1)]["ante"],2);
                            this.node.getChildByName("antesGroup").children[aCount].getChildByName("group").getChildByName("minAntesNumber").getComponent(cc.Label).string  = cc.module.tools.formatFloat(_DataLevels[(aCount+1)]["minichips"],2);
                            break;
                    }
                    this.node.getChildByName("antesGroup").children[aCount].active = true;
                }
            }
        }
        this.node.getChildByName("iconTips").active     = _State;   //開啟/關閉 動畫節點
        this.node.getChildByName("antesGroup").active   = _State;   //開啟/關閉 動畫節點
        this.node.active  = _State;                                 //開啟/關閉 此節點
    },

    /**
     * [轉跳至遊戲專案]
     * @param {obj} event       點擊對象
     * @param {int} _Index      盤口目前索引值
     */
    BtnHref: function(event,_Index){
        if(this.DebugMode) {console.log("%c[apAntesPanel] => [BtnHref] in action.",'color:'+this.DebugModeColor_FA);}
        
        let _Antes          = cc.module.userParams.GameSetting["Levels"][parseInt(_Index)+1]["ante"];
        let _MinAntes       = cc.module.userParams.GameSetting["Levels"][parseInt(_Index)+1]["minichips"];
        let _RuleBetting    = cc.module.userParams.GameSetting["Levels"][parseInt(_Index)+1]["rule_betting"];
        let _RulePlaying    = cc.module.userParams.GameSetting["Levels"][parseInt(_Index)+1]["rule_playing"];
        let _RuleSetting    = cc.module.userParams.GameSetting["Levels"][parseInt(_Index)+1]["rule_settling"];
        //如果Credit 小於 Antes 表示錢低於牌桌底價，若Credit 小於 MinAntes表示使用者的錢 不符合最低攜帶金額 都進不去房間
        if(parseFloat(cc.module.userParams.Credit) < parseFloat(_Antes) || parseFloat(cc.module.userParams.Credit) < parseFloat(_MinAntes)){
            if(typeof(this.NoCreditAler_cb) == "function"){    
                this.NoCreditAler_cb(); 
            }
        } else {
            cc.module.audio.playEffect(this.BtnClickOnAudio);                                                   //撥放音效
            cc.module.userParams.NowGameAntes       = _Antes;                                                   //寫入目前antes
            cc.module.userParams.NowGameMinAntes    = _MinAntes;                                                //寫入目前minAntes
            cc.module.userParams.NowRuleID          = _RuleBetting + "," + _RulePlaying + "," + _RuleSetting;   //規則
            cc.director.loadScene(cc.module.jsonFile["PRELOAD_SCENE_LIST"][cc.director.getScene().name]);       //場景轉換
        }
    },

});
