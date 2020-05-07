/** @file       iconAnim.js
  * @brief      遊戲icon管理.
  * @author     OreoLi
  * @date       2019/06/27 17:04 */

cc.Class({
    extends: cc.Component,

    properties: {
        Main_Atlas: cc.SpriteAtlas,             //主要圖片資源

        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用     
        BtnClickOnAudio:    {default: null, type: cc.AudioClip},        //按鈕點擊音效載入
    },
      
    ctor: function() { 
        this.DebugMode              = true;            //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this._Cb_Enter              = function(){};     //點擊遊戲icon按鈕的callback
        this.State                  = "";               //目前遊戲狀態
        this.GameName               = "";               //目前遊戲名稱，是指小寫開頭駝峰的專案名 EX:diceHHDS
        this.RuleID                 = "";               //目前取得的遊戲規則 EX:"1,1,1"
        this.AntesList              = [];               //盤口列表 EX:[10, 50, 100, 200, 500]
        this.MinAntes               = {};               //最小注額列表 EX:{10: 20, 50: 100, 100: 200, 200: 400, 500: 1000}
    },

    onLoad () {
    },

    /**
     * [初始化節點]
     * @param {string}      _GameName       要載入的龍骨遊戲icon
     * @param {bool}        _EnableBtn      是否啟用按鈕 (service/notOpen狀態則會強制為false)
     * @param {bool}        _EnableFrontBG  是否顯示人數前景框
     * @param {string}      _MsgState       目前遊戲icon狀態 {'service':維護中,'notOpen':尚未開放,'hotGame':熱門遊戲,'normal':正常遊戲}
     * @param {function}    _Cb_Enter       點擊遊戲icon的callback
     * @param {string}      _RuleID         規則資訊
     * @param {array}       _AntesList      盤口列表
     * @param {obj}         _MinAntes       最小注額列表
     */
    Init: function(_GameName,_EnableBtn,_EnableFrontBG,_MsgState,_Cb_Enter,_RuleID,_AntesList,_MinAntes){
        if(this.DebugMode) {console.log("%c[iconAnim] => [Init] in action.",'color:'+this.DebugModeColor_FA);}

        this.node.getComponent(cc.Button).interactable   = false;    //禁用 按鈕
        this.node.getChildByName("msg_service").active  = false;    //關閉 維修中訊息
        this.node.getChildByName("msg_notOpen").active  = false;    //關閉 尚未開放訊息
        this.node.getChildByName("msg_hotGame").active  = false;    //關閉 熱門遊戲訊息
        this.node.getChildByName("frontBG").getChildByName("label").getComponent(cc.Label).string = 0;
        this.node.getChildByName("frontBG").active      = false;    //關閉 人數顯示
        
        this.GameName       = _GameName;
        this.RuleID         = _RuleID;
        this.AntesList      = _AntesList;
        this.MinAntes       = _MinAntes;
        this.State          = _MsgState;

        let _PlayTimes = -1;
        switch(_MsgState){
            case -1:
            case "service": //維護中
                _PlayTimes  = -2;
                _EnableBtn  = false;
                this.node.getChildByName("msg_service").active  = true;    //開啟 維修中訊息
                break;
            case 0:
            case "notOpen": //尚未開放
                _PlayTimes  = -2;
                _EnableBtn  = false;
                this.node.getChildByName("msg_notOpen").active  = true;    //開啟 尚未開放訊息
                break;
            case 2:
            case "hotGame": //熱門遊戲
                this.node.getChildByName("msg_hotGame").active  = true;    //開啟 熱門遊戲訊息
                break;
            case 1:
            case "normal":  //正常遊戲
                break;
            default:        //例外狀況
                if(this.DebugMode) {console.log("%c[iconAnim] => [Init] 產生例外狀況.",'color:'+this.DebugModeColor_FA);}
                return;
                break;
        }

        this.node.getComponent(cc.Button).interactable   = _EnableBtn;  //禁用/啟用 按鈕
        this._Cb_Enter = _Cb_Enter;                                 //設置委派

        this.node.getChildByName("frontBG").getComponent(cc.Sprite).spriteFrame = this.Main_Atlas.getSpriteFrame("iconFront_"+this.GameName); //設置前景框
        this.node.getChildByName("frontBG").active      = _EnableFrontBG;       //開啟 人數顯示
        let _Path   = "dragonbones/icon/"+this.GameName;                        //設置龍骨動態加載路徑
        this._LoadDragonBones(_Path,_PlayTimes)                                 //動態加載龍骨動畫
    },

    /**
     * [動態加載龍骨]
     * @param _Path             龍骨地址
     * @param _PlayTimes        播放次數 -1是根據龍骨文件 0五險循環 >0是播放次數
     * 
     ** @param armatureName      Armature名稱
     ** @param animationDisplay  龍骨組件
     ** @param newAnimation      Animation名稱
     ** @param completeCallback  動畫播放完畢的回調
     */
    _LoadDragonBones(_Path, _PlayTimes = -1) {  //動態加載龍骨
        if(this.DebugMode) {console.log("%c[iconAnim] => [_LoadDragonBones] in action.",'color:'+this.DebugModeColor_FA);}

        let animationDisplay = this.node.getChildByName("anim").getComponent(dragonBones.ArmatureDisplay);
        cc.loader.loadResDir(_Path, function(err, assets){
            if(err || assets.length <= 0)  return;

            assets.forEach(asset => {
                if(asset instanceof dragonBones.DragonBonesAsset){
                    animationDisplay.dragonAsset = asset;
                }
                if(asset instanceof dragonBones.DragonBonesAtlasAsset){
                    animationDisplay.dragonAtlasAsset  = asset;
                }
            });

            animationDisplay.armatureName = "Armature";
            if(_PlayTimes != -2) {
                animationDisplay.playAnimation("newAnimation", _PlayTimes);
            }
            animationDisplay.addEventListener(dragonBones.EventObject.COMPLETE, function(){});
        })
    },

    /**
     * [遊戲icon] 點擊事件
     */
    BtnEnter: function(){
        if(this.DebugMode) {console.log("%c[iconAnim] => [BtnEnter] in action.",'color:'+this.DebugModeColor_FA);}

        cc.module.audio.playEffect(this.BtnClickOnAudio);   //撥放音效
        if(typeof(this._Cb_Enter) == "function"){     
            this._Cb_Enter(this.GameName);
        } else {
            if(this.DebugMode) {console.log("%ctypeof(_cb) == 'undefined'.",'color:'+this.DebugModeColor_FA);}
        }
    },

    /**
     * [取得遊戲名稱]
     */
    GetGameName: function(){
        if(this.DebugMode) {console.log("%c[iconAnim] => [GetGameName] in action.",'color:'+this.DebugModeColor_FA);}

        return this.GameName;
    },

    /**
     * [取得遊戲狀態]
     */
    GetState: function(){
        if(this.DebugMode) {console.log("%c[iconAnim] => [GetState] in action.",'color:'+this.DebugModeColor_FA);}

        return this.State;
    },

    /**
     * [設置使用者人數]
     * @param {int} _UserCount 該遊戲的使用者人數
     */
    SetUserCount: function(_UserCount){
        if(this.DebugMode) {console.log("%c[iconAnim] => [SetUserCount] in action.",'color:'+this.DebugModeColor_FA);}
        this.node.getChildByName("frontBG").getChildByName("label").getComponent(cc.Label).string = _UserCount;
    },
});
