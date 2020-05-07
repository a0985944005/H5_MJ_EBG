/** @file       emoji.js
  * @brief      表情包預製體控制腳本.
  * @author     OreoLi
  * @date       2019/03/06 10:32 */

  cc.Class({
    extends: cc.Component,

    properties: {
        Emoji_Atlas: cc.SpriteAtlas,     //主要圖片資源
        Icon_node:cc.Node,              //表情符號節點
        StringBG_node:cc.Node,          //文字背景節點
        StringPic_node:cc.Node,         //文字敘述節點   

        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用   
        EmojiIconAudio:         {  default: null,  type: cc.AudioClip  },       //表情符號音效載入     
        EmojiStringAudio:       {  default: null,  type: cc.AudioClip  },       //文字特效音效載入 
    },

    
    ctor(){
        this.DebugMode              = true;             //是否開啟console.log 
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this.JsonFileObj;                           //傳入資料轉存
    }, 

    /** 
     * [初始化預製體] 
     * @param  {map}   _JsonFile            
     * - {string}  State               {"string","icon"}
     * - {int}     Number              第幾款圖
     * - {obj}     ThisPosi            {"PosiX":_GetNodeSpaceAR.x,"PosiY":_GetNodeSpaceAR.y}
     * - {float}   AnimTotalTime       總動畫時間
     * - {float}   ScheduleTime        計時器執行時間
     * - {int}     MiniPicCount        最小張數
     * - {int}     MaxiPicCount        最大張數
     * - {string}  StringPic           預設背景圖為左圖/右圖
     * - {obj}     StringPosi          位置 {"PosiX":0, 	"PosiY": 167}
    */
    Init: function(_JsonFile){
        if(this.DebugMode) {console.log("%c[emoji] => [Init] in action.",'color:'+this.DebugModeColor_FA);}

        this.JsonFileObj                    = _JsonFile;                    //傳入資料轉存
        this.Icon_node.active               = false;                        //關閉 表情符號節點
        this.StringBG_node.active           = false;                        //關閉 文字背景節點
        this.StringPic_node.active          = false;                        //關閉 文字敘述節點
        this.node.active                    = true;                         //開啟 本節點

        switch(this.JsonFileObj.State){
            case "string":  
                this.StringBG_node.getComponent(cc.Sprite).spriteFrame  = this.Emoji_Atlas.getSpriteFrame("emoji_string_"+this.JsonFileObj.StringPic);          //置換圖示
                this.StringPic_node.getComponent(cc.Sprite).spriteFrame = this.Emoji_Atlas.getSpriteFrame("anim_emoji_string_"+this.JsonFileObj.Number);        //置換圖示
                this.StringBG_node.setPosition(cc.v2(this.JsonFileObj.StringPosi.PosiX,this.JsonFileObj.StringPosi.PosiY));                                           //設定背景位置
                this.StringBG_node.active           = true;     //開啟 文字背景節點
                this.StringPic_node.active          = true;     //開啟 文字敘述節點
                break;
            case "icon":
                this.Icon_node.getComponent(cc.Sprite).spriteFrame  = this.Emoji_Atlas.getSpriteFrame("anim_emoji_icon_"+this.JsonFileObj.Number+" (1)");       //置換圖示
                this.Icon_node.setPosition(cc.v2(this.JsonFileObj.IconPosi.PosiX,this.JsonFileObj.IconPosi.PosiY));                                             //設定背景位置
                this.Icon_node.active               = true;     //開啟 表情符號節點
                break;
            default:
                break;
        }
        this.node.setPosition(cc.v2(this.JsonFileObj.ThisPosi.PosiX,this.JsonFileObj.ThisPosi.PosiY));
    },

    /** 
     * [執行動畫]
     * @param  {function}  _cb     回調方法
     */
    StartAnim: function(_cb){
        if(this.DebugMode) {console.log("%c[emoji] => [StartAnim] in action.",'color:'+this.DebugModeColor_FA);}
        
        switch(this.JsonFileObj.State){
            case "string":  
                cc.module.audio.playEffect(this.EmojiStringAudio); 
                this.StringBG_node.active           = true;         //開啟 文字背景節點
                this.StringPic_node.active          = true;         //開啟 文字敘述節點

                this.scheduleOnce(function() {
                    this.StringBG_node.active       = false;        //關閉 文字背景節點
                    this.StringPic_node.active      = false;        //關閉 文字敘述節點
                    _cb();
                }, this.JsonFileObj.AnimTotalTime);
                break;
            case "icon":
                cc.module.audio.playEffect(this.EmojiIconAudio); 
                this.Icon_node.getComponent(cc.Sprite).spriteFrame  = this.Emoji_Atlas.getSpriteFrame("anim_emoji_icon_"+this.JsonFileObj.Number+" (1)");       //置換圖示
                this.Icon_node.active               = true;     //開啟 表情符號節點
          
                //播放icon動畫
                let _changePicCount = this.JsonFileObj.MiniPicCount;
                let _totalTime      = 0;
                let _cardsCallback = function () {
                    if(_totalTime >= this.JsonFileObj.AnimTotalTime) {
                        this.Icon_node.active               = false;     //關閉 表情符號節點
                        this.Icon_node.getComponent(cc.Sprite).unscheduleAllCallbacks();
                        _cb();  //執行回調方法
                    }

                    if(_changePicCount >= this.JsonFileObj.MaxiPicCount) {
                        _changePicCount = 1;
                    } else {
                        _changePicCount++;
                    }
                    _totalTime += this.JsonFileObj.ScheduleTime;
                    
                    this.Icon_node.getComponent(cc.Sprite).getComponent(cc.Sprite).spriteFrame = this.Emoji_Atlas.getSpriteFrame("anim_emoji_icon_"+this.JsonFileObj.Number+" ("+_changePicCount+")"); //置換圖示
                }.bind(this);
                this.Icon_node.getComponent(cc.Sprite).schedule(_cardsCallback, this.JsonFileObj.ScheduleTime);
                break;
            default:
                console.log("[emoji] => [StartAnim] 出現例外狀況");
                break;
        }
    },

});
