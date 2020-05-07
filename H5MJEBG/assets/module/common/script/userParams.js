/** @file       userParams.js
  * @brief      玩家參數模組.
  * @author     OreoLi
  * @date       2019/02/24 20:02 */

cc.Class({
    extends: cc.Component,
    properties: {

    },
    ctor: function() {
      //使用者參數
      this.UserIP         = "";       //使用者IP
      this.UserID         = "";       //使用者UUID
      this.Nickname       = "";       //暱稱
      this.HeadUrl        = "";       //使用者頭像ID => 初始化為0，僅替代本地頭像不串接，音效目前綁定頭像性別，取得頭像圖片名稱後userIcon_n，取得_n的數值，若為0則撥放女生音效，反之則男生
      this.AudioSex       = "";       //音效性別 =>透過頭像判斷
      this.Sex            = "";       //性別  {0:女生,1:男生}，但目前音效綁定是看頭像男女生
      this.Credit         = "";       //登入後目前持有籌碼
      this.Language       = "";       //目前選用語系
          
      //動態加載資源
      this.HelpSpriteFrame= [];       //所有遊戲規則的說明圖片儲存矩陣
      this.ADSpriteFrame  = [];       //所有廣告圖片儲存矩陣

      //登入相關參數參數
      this.URLToken       = "";       //玩家驗證token
      this.GameName       = "";       //目前玩家選擇的遊戲名稱  
      this.GameSetting    = {};       //目前玩家所取得的各遊戲設定值
      this.ReJoinData     = {};       //斷線重連資料

      //遊戲內參數
      this.TableAuto        = false;  //自動配桌是否開啟 (預設為關閉)
      this.RoomID           = "";     //目前玩家進入的牌桌UUID  
      this.IsEnterRoom      = false;  //玩家是否已進入牌桌
      this.GameEndCheck     = true;   //玩家參與的牌局是否結束可返回大廳
      this.JoinRoomState    = false;  //目前是否正在joinroom的過程中，若是則無法強制離開牌桌
      this.NowGameAntes     = "";     //目前玩家進入的牌桌底注
      this.NowGameMinAntes  = "";     //目前玩家進入的最小攜帶金額
      this.NowGameMaxAntes  = "";     //目前玩家進入的最大壓注金額
      this.NowRuleID        = "";     //目前玩家進入的遊戲規則
      this.NowUserIndex     = -2;     //目前遊戲使用者索引 
      this.GamePeriod       = -1;     //目前遊戲進程 {-1:尚未配桌,0:結算,1:成功坐下牌桌,2:遊戲中}
    },
})