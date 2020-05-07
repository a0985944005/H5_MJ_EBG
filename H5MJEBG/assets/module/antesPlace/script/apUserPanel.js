/** @file       apUserPanel.js
  * @brief      遊戲專案-使用者資訊管理.
  * @author     OreoLi
  * @date       2019/04/19 14:30 */

  cc.Class({
    extends: cc.Component,

    properties: {
        SystemPanel_Atlas: cc.SpriteAtlas,      //系統圖片資源 (內含頭像圖片)
        
        //節點下，有用到的子節點
        UserIcon_node:  cc.Node,                //使用者頭像節點
        Name_label:cc.Label,                    //名稱文字敘述
        Credit_label:cc.Label,                //持有籌碼文字敘述
    },

    ctor(){
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this._HeadIndex             = -1;               //目前頭像索引
    }, 

    /** 
     * [腳本初始化]
    */
    Init: function(){
        if(this.DebugMode) {console.log("%c[apUserPanel] => [Init] In action.",'color:'+this.DebugModeColor_FA);}

        this.node.getChildByName("head_FG").position    = cc.v2(-70,0);
        this.node.getChildByName("userIcon").position   = cc.v2(-70,0);
        this.node.getChildByName("credit").position     = cc.v2(135,-33);
        this.node.getChildByName("name").position       = cc.v2(22,19);

        this.Name_label.string                  = cc.module.userParams.Nickname;                                    //參數 姓名
        this.Credit_label.string                = cc.module.tools.formatFloatToFixed(cc.module.userParams.Credit,2);        //參數 籌碼
        this._SetUserIcon(cc.module.userParams.HeadUrl);
        this._SITE_Init();   //針對商戶初始化介面
    },
    
    /**
     * [針對不同商戶的初始化設定]
     */
    _SITE_Init: function(){
        if(this.DebugMode) {console.log("%c[apUserPanel] => [_SITE_Init] In action.",'color:'+this.DebugModeColor_FA);}

        let _SiteData = {};
        let _NowSite  = cc.module.jsonFile["SITE_SETTING"]["NowSite"];
        if(cc.module.jsonFile["SITE_SETTING"][_NowSite]) {
            _SiteData = cc.module.jsonFile["SITE_SETTING"][_NowSite];
        } else {
            _SiteData = cc.module.jsonFile["SITE_SETTING"]["Default"];
        }

        if(_SiteData["AntesPlace_BtnBackHall_Enable"] == true) {
            this.node.getChildByName("head_FG").position    = cc.v2(-70,0);
            this.node.getChildByName("userIcon").position   = cc.v2(-70,0);
            this.node.getChildByName("credit").position     = cc.v2(135,-33);
            this.node.getChildByName("name").position       = cc.v2(22,19);
        } else {
            this.node.getChildByName("head_FG").position    = cc.v2(-230,0);
            this.node.getChildByName("userIcon").position   = cc.v2(-230,0);
            this.node.getChildByName("credit").position     = cc.v2(-25,-33);
            this.node.getChildByName("name").position       = cc.v2(-137.5,19);
        }
    },

    /**
     * [設置頭像]
     * @param {int} _HeadIndex 頭像資源索引
     */
    _SetUserIcon: function(_HeadIndex){
        if(this.DebugMode) {console.log("%c[hallUserPanel] => [_SetUserIcon] In action.",'color:'+this.DebugModeColor_FA);}
        this._HeadIndex = _HeadIndex;
        this.UserIcon_node.getComponent(cc.Sprite).spriteFrame = this.SystemPanel_Atlas.getSpriteFrame("userIcon_"+this._HeadIndex);
    },

    update (dt) {
        //因點數轉入故要做此動作
        if( cc.module.userParams.Credit && 
            cc.module.tools.formatFloat(cc.module.userParams.Credit,2) != cc.module.tools.formatFloat(this.Credit_label.string,2)) {

            this.Credit_label.string    = cc.module.tools.formatFloatToFixed(cc.module.userParams.Credit,2);    //參數 籌碼
        }
        
        //因頭像會轉換故要做此動作
        if(this._HeadIndex != cc.module.userParams.HeadUrl) {
            this._SetUserIcon(cc.module.userParams.HeadUrl);
        }
    },
});
