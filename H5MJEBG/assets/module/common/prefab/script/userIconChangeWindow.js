/** @file       userIconChangeWindown.js
  * @brief      玩家頭像置換視窗.
  * @author     OreoLi
  * @date       2019/03/23 22:35 */

cc.Class({
    extends: cc.Component,

    properties: {
        Layout_node:cc.Node,                    //背景防點擊的layout節點
        Content_node:cc.Node,                   //背景節點
        BtnClose_node:cc.Node,                  //關閉視窗按鈕節點

        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用     
        BtnClickOnAudio:    {default: null, type: cc.AudioClip},        //按鈕點擊音效載入
    },

    ctor: function() { 
        this.DebugMode              = false;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this.selectUserIcon = -1;               //目前所選到的頭像index
    },

    /** 選擇頭像畫面初始化 */
    Init(){
        if(this.DebugMode) {console.log("%c[userIconChangeWindown] => [Init] in action.",'color:'+this.DebugModeColor_FA);}
        
        this.node.active                = false;    //關閉 主節點，等動畫觸發才開啟
        this.Layout_node.active         = true;     //開啟 背景防點擊的layout節點
        this.BtnClose_node.active       = false;    //關閉 關閉按鈕節點
        this.Content_node.active        = false;    //關閉 主要內容節點

        //取得對應頭像的節點位置，並移動頭像選擇框
        this.selectUserIcon = cc.module.userParams.HeadUrl;
        let userIcon_X = this.Content_node.getChildByName("userIcon_"+cc.module.userParams.HeadUrl).x;
        let userIcon_Y = this.Content_node.getChildByName("userIcon_"+cc.module.userParams.HeadUrl).y;
        let headSelect = this.Content_node.getChildByName("headSelect");
        headSelect.x = userIcon_X;
        headSelect.y = userIcon_Y;
        headSelect.active = true;
    },


    /** 
     * [開啟視窗動畫]
     * */
    OpenAnim: function(){
        if(this.DebugMode) {console.log("%c[userIconChangeWindown] => [OpenAnim] in action.",'color:'+this.DebugModeColor_FA);}
        
        let self = this;    
        this.Content_node.scale    = cc.module.jsonFile['SystemPanel']['WindowAnim']['OriginalScale'];
        this.Content_node.active   = true;
        this.node.active = true;
         
        var finishedFunc = cc.callFunc(function() {    
            self.BtnClose_node.active = true;
            if(typeof(_cb) == "function"){   //若cb是function才做
                _cb();
            }
        });

        let _Action = cc.sequence(
                        cc.scaleTo(cc.module.jsonFile['SystemPanel']['WindowAnim']['Scale01']['sAnimTime'],cc.module.jsonFile['SystemPanel']['WindowAnim']['Scale01']['sTo']),
                        cc.scaleTo(cc.module.jsonFile['SystemPanel']['WindowAnim']['Scale02']['sAnimTime'],cc.module.jsonFile['SystemPanel']['WindowAnim']['Scale02']['sTo']),
                        finishedFunc);//動畫動作
        _Action.easing(cc.easeSineOut(cc.module.jsonFile['SystemPanel']['WindowAnim']['EaseSineOut'])); //啟用 緩速時間曲線
        this.Content_node.runAction(_Action);                                                               //啟用 動畫
    },

    /** 
     * [關閉視窗]
     */
    BtnClose: function(){
        if(this.DebugMode) {console.log("%c[userIconChangeWindown] => [BtnClose] in action.",'color:'+this.DebugModeColor_FA);}
        cc.module.audio.playEffect(this.BtnClickOnAudio);    //撥放音效
        this.node.active = false;
    },

    /**
     * [點擊頭像事件]
     * @param {obj} event   點擊對象
     * @param {int} _Index  頭像索引值
     */
    BtnClickUserIcon: function(event,_Index){
        if(this.DebugMode) {console.log("%c[userIconChangeWindown] => [BtnClickUserIcon] in action.",'color:'+this.DebugModeColor_FA);}

        cc.module.audio.playEffect(this.BtnClickOnAudio);  //撥放音效
        this.selectUserIcon = _Index;

        //透過點擊的索引值，取得對應頭像的節點位置，並移動頭像選擇框
        let userIcon_X = this.Content_node.getChildByName("userIcon_"+_Index).x;
        let userIcon_Y = this.Content_node.getChildByName("userIcon_"+_Index).y;
        let headSelect = this.Content_node.getChildByName("headSelect");
        headSelect.x = userIcon_X;
        headSelect.y = userIcon_Y;
    },

    /** 
     * [點擊確認事件] 
     */
    BtnEnter: function(){
        if(this.DebugMode) {console.log("%c[userIconChangeWindown] => [BtnEnter] in action.",'color:'+this.DebugModeColor_FA);}

        this.BtnClose();
        var _SetFunc = function(_JsonData){
            var _Result = JSON.parse(_JsonData['Result']);
            switch(parseFloat(_Result['Code'])){
                case 1:     if(this.DebugMode) {console.log("%c[userIconChangeWindown] => [BtnEnter] 點擊[頭像送出]-請求成功.",'color:'+this.DebugModeColor_GET);}                
                            cc.module.userParams.HeadUrl    = this.selectUserIcon;
                            cc.module.userParams.AudioSex   = cc.module.userParams.HeadUrl % 2;
                            break;
                case -1:    if(this.DebugMode) {console.log("%c[userIconChangeWindown] => [BtnEnter] 點擊[頭像送出]-請求失敗.",'color:'+this.DebugModeColor_GET);}      break;
                case -2:    if(this.DebugMode) {console.log("%c[userIconChangeWindown] => [BtnEnter] 點擊[頭像送出]-參數錯誤.",'color:'+this.DebugModeColor_GET);}      break;
                default:    if(this.DebugMode) {console.log("%c[userIconChangeWindown] => [BtnEnter] 點擊[頭像送出]-進入例外狀況.",'color:'+this.DebugModeColor_GET);}  break;
            }
        }.bind(this);
        this.SendMsg(cc.module.jsonFile['SERVER_HALL_TOPIC'] + "/HD_SetHeadUrl", {"HeadUrl":this.selectUserIcon.toString()},_SetFunc);
    },

    /**
     * [發送封包至遊戲伺服器]
     * @param {string}      topic       mqtt topic
     * @param {string}      data        mqtt payload 
     * @param {function}    _cb         callbackfunction，只有當回傳的code = 1的時候才執行
     */
    SendMsg: function(topic, data, _cb) {
        cc.module.mqant.request(topic, data, function(destinationName, data) {
            var _JsonData   = JSON.parse(cc.module.mqant.parseUTF8(data));
            _cb(_JsonData);
        });
    },
});
