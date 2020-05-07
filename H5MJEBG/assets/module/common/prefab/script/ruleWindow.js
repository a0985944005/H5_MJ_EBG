/** @file       ruleWindown.js
  * @brief      訊息(廣告)視窗.
  * @author     OreoLi
  * @date       2019/02/26 23:30 */


  cc.Class({
    extends: cc.Component,

    properties: {
        Layout_node:cc.Node,                    //背景防點擊的layout節點
        Content_node:cc.Node,                   //背景節點
        BtnClose_node:cc.Node,                  //關閉視窗按鈕節點
        
        ScrollView_node: cc.Node,               //滾動主節點
        ScrollViewContent_node: cc.Node,        //滾動節點內的顯示內容
        
        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用     
        BtnClickOnAudio:    {default: null, type: cc.AudioClip},        //按鈕點擊音效載入
    },
    
    ctor: function() { 
        this.DebugMode              = false;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this.State                  = "";               //目前切換到的視窗
    },

    /** 
     * [訊息(廣告)畫面初始化] 
     * */
    Init(){
        if(this.DebugMode) {console.log("%c[ruleWindown] => [Init] in action.",'color:'+this.DebugModeColor_FA);}
        
        this.node.active                = false;    //關閉 主節點，等動畫觸發才開啟
        this.Layout_node.active         = true;     //開啟 背景防點擊的layout節點
        this.BtnClose_node.active       = false;    //關閉 關閉按鈕節點
        this.Content_node.active        = false;    //關閉 主要內容節點

        //預設顯示遊戲介紹介面
        this.SetScrollView("rule");
    },

    /** 
     * [開啟視窗動畫]
     * */
    OpenAnim: function(){
        if(this.DebugMode) {console.log("%c[ruleWindown] => [OpenAnim] in action.",'color:'+this.DebugModeColor_FA);}
        
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
        if(this.DebugMode) {console.log("%c[ruleWindown] => [BtnClose] in action.",'color:'+this.DebugModeColor_FA);}
        cc.module.audio.playEffect(this.BtnClickOnAudio);    //撥放音效
        this.node.active = false;
    },

    /**
     * [設定顯示資料]
     * @param {string} _State   目前要顯示的ScrollView資料 {"rule","cardType","settlement"}
     */
    SetScrollView: function(_State){
        if(this.DebugMode) {console.log("%c[ruleWindown] => [SetScrollView] in action.",'color:'+this.DebugModeColor_FA);}

        //銷毀原有節點
        this.ScrollViewContent_node.removeAllChildren();
        this.State = _State;
        
        //初始化按鈕
        this.Content_node.getChildByName("btn_help_rule_on").active         = false;
        this.Content_node.getChildByName("btn_help_rule_off").active        = true;
        this.Content_node.getChildByName("btn_help_cardType_on").active     = false;
        this.Content_node.getChildByName("btn_help_cardType_off").active    = true;
        this.Content_node.getChildByName("btn_help_settlement_on").active   = false;
        this.Content_node.getChildByName("btn_help_settlement_off").active  = true;
        this.Content_node.getChildByName("btn_help_"+_State+"_on").active   = true;
        this.Content_node.getChildByName("btn_help_"+_State+"_off").active  = false;

        let self = this;

        if(cc.module.userParams.GameName == "" || !cc.module.userParams.GameName) {
            for(var gKey in cc.module.jsonFile["GAME_LIST"]) {
                if(gKey.toLowerCase() == cc.module.jsonFile["SERVER_GAME_TYPE"].toLowerCase()){
                    cc.module.userParams.GameName = gKey;
                }
            }
        }
        
        let _Language = cc.sys.localStorage.getItem("Language");
        if(!_Language || _Language == "") {
            _Language = "cn"
        } 


        cc.loader.loadResDir("images/gameHelp_assets_"+_Language+"/"+cc.module.userParams.GameName+"/"+_State,cc.SpriteFrame, function (err, assets) {
            if(self.State != _State) return;    //避免異步處理時，不同視窗的資源也同時加載進來
            cc.module.userParams.HelpSpriteFrame = assets;      //轉存至全域變數
            
            //取得對應名稱的遊戲玩法圖
            let _HelpArr = [];
            for(var hCount = 0; hCount < cc.module.userParams.HelpSpriteFrame.length ; hCount++){
                if( cc.module.userParams.HelpSpriteFrame[hCount].name.match(cc.module.userParams.GameName) && 
                    cc.module.userParams.HelpSpriteFrame[hCount].name.match(_State)){
                    _HelpArr.push(cc.module.userParams.HelpSpriteFrame[hCount]);
                }
            }

            //拼接至ScrollView，來避免圖片過大產生黑屏問題
            for(var hCount = 0 ; hCount < _HelpArr.length ; hCount++){
                for(var subCount = 0; subCount < _HelpArr.length ; subCount ++) {
                    if(cc.module.userParams.GameName+"_help_"+_State+"_"+hCount == _HelpArr[subCount].name){
                        let _Node = new cc.Node('Sprite');
                        var sp = _Node.addComponent(cc.Sprite);
                        sp.spriteFrame = _HelpArr[subCount];
                        _Node.parent = self.ScrollViewContent_node;
                        break;
                    }
                }
            }
            self.ScrollView_node.getComponent(cc.ScrollView).scrollToTop(0);
        });

    },

    /**
    * [玩法分類按鈕點擊事件] 
    * @param {obj}      event   點擊對象
    * @param {string}   _State  目前要顯示的ScrollView資料 {"rule","cardType","settlement"}
    */
    BtnChangeType: function(event,_State){
        cc.module.audio.playEffect(this.BtnClickOnAudio);   //撥放音效
        this.SetScrollView(_State);                         //更新ScrollView
    },
    // update (dt) {},
});
