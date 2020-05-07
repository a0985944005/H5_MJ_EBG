/** @file       gameEnemies.js
  * @brief      敵人玩家主腳本.
  * @author     OreoLi
  * @date       2019/03/06 16:32 */

  cc.Class({
    extends: cc.Component,

    properties: {
        UserBox_prefab:cc.Prefab,          //其他玩家預制體資源
        UserBox_pool:cc.NodePool,          //其他玩家的預制體緩存池 (pool)
    },

    ctor(){
        this.DebugMode              = true;            //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息
    },

    
    Init: function(){
        if(this.DebugMode) {console.log("%c[gameEnemies] => [Init] In action.",'color:'+this.DebugModeColor_FA);}

        this.node.active    = true;
        this.CreateUser();
    },
 
    /** 
     * [建構牌桌的敵人玩家預製體]
     * */
    CreateUser: function(){
        if(this.DebugMode) {console.log("%c[gameEnemies] => [CreateUser] In action.",'color:'+this.DebugModeColor_FA);}
        
        this.UserBox_pool   = new cc.NodePool();        //敵人玩家預製體的緩存池

        //先確保敵人玩家節點以及緩存池是清空狀態
        var _putPool_UserBox   = Array(); 
        for(var userCount = 0; userCount < this.node.children.length; userCount++) {
            _putPool_UserBox.push(this.node.children[userCount]);
        } 
        for(var userCount = 0; userCount < _putPool_UserBox.length; userCount++) {
            this.UserBox_pool.put(_putPool_UserBox[userCount]);
        } 
        this.node.removeAllChildren(false);     

        //建立玩家緩存池並寫入對應節點
        var _PlayerOtherCount = cc.module.jsonFile["GameMain"]["UserBox"]["PlayerOtherCount"];   //除了玩家本人不需要產生預製體外，其他玩家皆需要
        for (var userCount = 0; userCount < _PlayerOtherCount; userCount++) {     
            let _user = cc.instantiate(this.UserBox_prefab);  
            this.UserBox_pool.put(_user);      
        }

        for (var userCount = 0; userCount < _PlayerOtherCount; userCount++) {        
            let _userBox = this.UserBox_pool.get();            //取得預制體
            
            _userBox.getComponent("userBox").Init(cc.module.jsonFile['GameMain']['UserBox']['PlayOtherPosi'][userCount]);
            this.node.addChild(_userBox);                          //加入至子節點   o
        }
    },


});
