/** @file       marquee.js
  * @brief      跑馬燈管理.
  * @author     OreoLi
  * @date       2019/05/29 13:34 */

cc.Class({
    extends: cc.Component,

    properties: {
        Mask_node:cc.Node,          //遮罩寬度
        Content_node:cc.Node,       //公告文字資料
    },
      
    ctor: function() { 
        this.DebugMode              = false;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this.RollText_List  = [];               //
    },

    /** 
     * [初始化]
     * @param {string} _UserID  使用者id 
     * */
    Init: function(_UserID){
        if(this.DebugMode) {  console.log("%c[marquee] => [Init] in action.",'color:'+this.DebugModeColor_FA);}

        this.Content_node.stopAllActions();
        this.HD_Bulletins(_UserID);
    },
    
    /** 
     * [滾動文字跑馬燈取得資料並執行]
     * @param {string} _UserID  使用者id 
     * */
    HD_Bulletins: function(_UserID) {
        if(this.DebugMode) {console.log("%c[marquee] => [HD_Bulletins] in action.",'color:'+this.DebugModeColor_FA);}

        let self = this;
        cc.module.mqant.request(cc.module.jsonFile['SERVER_HALL_TOPIC']+"/HD_Bulletins",{"account" :_UserID}, function(destinationName, data){
            if(self.DebugMode) {
                console.log(destinationName);
                console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
            }
            let _jsonDataResult = JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))['Result']);
            switch(parseFloat(_jsonDataResult["Code"])){
                case 1:
                    if(self.DebugMode) {
                        if(self.DebugMode) {  console.log("%c[marquee] => [HD_Bulletins] 正確取得資料 Code:"+_jsonDataResult["Code"],'color:'+self.DebugModeColor_GET); }
                        console.log(_jsonDataResult["Data"]);
                    }

                    //設置跑馬燈文字資料
                    let _ContentArr = [];
                    for(var dKey in _jsonDataResult["Data"]){
                        _ContentArr.push(_jsonDataResult["Data"][dKey]["text"]);
                    }
                    self.RollText(_ContentArr); //丟入跑馬燈資訊
                    
                    //計算資料多久後要再次取得，若沒有資料則20秒後再取得資料
                    let _Timer = _jsonDataResult['Data'].length * cc.module.jsonFile["SystemPanel"]["Marquee"]["MoveTime"];
                    if(_Timer <= 0) _Timer = 20; 
                    
                    //設定計時器，定時調用
                    self.scheduleOnce(function() {
                        if(self.DebugMode) {  console.log("%c[marquee] => [HD_Bulletins] 時間到,重新執行跑馬燈初始化.",'color:'+self.DebugModeColor_GET); }
                        self.HD_Bulletins(_UserID);
                    }, _Timer);
                    break;
                default:
                    if(self.DebugMode) {  console.log("%c[marquee] => [HD_Bulletins] 進入例外狀況 Code:"+_jsonDataResult["Code"],'color:'+self.DebugModeColor_GET); }
                    break;
            }
        });
    },

    /**
     * [滾動文字跑馬燈]
     * @param {string array} _ContentArr 跑馬燈內容陣列
     */
    RollText: function(_ContentArr) {
        if(this.DebugMode) {console.log("%c[marquee] => [RollText] in action.",'color:'+this.DebugModeColor_FA);}

        if(_ContentArr.length <= 0) return; //若沒有資料則中斷

        let textNode        = this.Content_node;
        let maxWidth        = this.Mask_node.width;
        textNode.x          = maxWidth;
        this.Content_node.getComponent(cc.Label).string = _ContentArr[0];
        this.Content_node.getComponent(cc.Label)._updateRenderData(true);
        _ContentArr.shift();

        let _cb = cc.callFunc(function() { 
            this.RollText(_ContentArr);
        }.bind(this));

        let _Action = cc.sequence(  cc.moveTo(cc.module.jsonFile["SystemPanel"]["Marquee"]["MoveTime"], cc.v2(0-textNode.width, textNode.y)),
                                    _cb);
        this.Content_node.runAction(_Action); 
    },
});
