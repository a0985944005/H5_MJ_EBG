/**
 * Created by litengfei on 2018/1/15.
 */
cc.Class({
    extends: cc.Component,
    properties: {
    },

    ctor: function() {
        this.OnQueueArr     = [];               //儲存所接到的Queue陣列 (應用於狀態機)
        this.RealTimeArr    = [];               //即時處理的陣列
        
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息
    },

    /** server監聽事件 */
    hookMQTTEvent: function() {

        /** 通知點數變更
         * [Subscriber] Gate/ChangeCredit
         * Payload:
         *  Code	            string	        1: 請求成功 -1: 請求失敗 -2: 餘額不足
         *  Data	            array	        回傳資料 Content-Type: application/json => map
         *  Time	            int	            回傳時間
         * 
         * Data:
         *  credit	            float	        金額
         */
        cc.module.mqant.on("Gate/ChangeCredit", function(destinationName, data)
        {
            var jsonData = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(this.DebugMode) {console.log("%c[hookMQTT] => [Gate/ChangeCredit] "+destinationName+".",'color:'+this.DebugModeColor_GET);}
            if(this.DebugMode) {console.log(jsonData);}
            this.RealTimeArr.push(['ChangeCredit',jsonData]);

        }.bind(this));

        /** 通知強制踢你下線哈哈
         * [Subscriber] Gate/PowerKick
         */
        cc.module.mqant.on("Gate/PowerKick", function(destinationName, data)
        {
            var jsonData = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(this.DebugMode) {console.log("%c[hookMQTT] => [Gate/PowerKick] "+destinationName+".",'color:'+this.DebugModeColor_GET);}
            if(this.DebugMode) {console.log(jsonData);}
            this.RealTimeArr.push(['PowerKick',jsonData]);
        }.bind(this));
        
        /** GS通知玩家有其他玩家發動表情符號
         * [Subscriber] PokerDDZ/Emoji
         * 
         * Payload:
         *  Code	            string	        1: 請求成功 -1: 請求失敗 -2: 餘額不足
         *  Data	            array	        回傳資料 Content-Type: application/json => map
         *  Time	            int	            回傳時間
         * 
         * Data:
         *  Type                string          {"string":文字對話,"icon":表情符號}
         *  Emoji	            string	        第幾款
         *  SeatIndex	        string	        玩家座位  (先傳UUID判斷)
         * */
        cc.module.mqant.on(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/Emoji", function(destinationName, data)
        {
            var jsonData = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(this.DebugMode) {console.log("%c[hookMQTT] => [Emoji] "+destinationName+".",'color:'+this.DebugModeColor_GET);}
            if(this.DebugMode) {console.log(jsonData);}
            this.RealTimeArr.push(['Emoji',jsonData]);

        }.bind(this));


        // 代碼定義列表
        // 代碼	說明
        // 1	請求成功
        // -4	不允許的請求時間
        // -5	不允許的請求玩家
        // -11	超過可重骰的時間

        /** GS通知玩家取得牌桌資訊
         * [Subscriber] MJEBG/TableInfo
         * 
         * Payload:
         *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
         *  Data	            array	        回傳資料 Content-Type: application/json => map
         *  Time	            int	            回傳時間
         * 
         * Data:
         *  PlayerList	        map array	    玩家列表
         *  OwnSeatIdx	        int	            玩家座位編號
         *  BigRoomID	        string	        牌局編號
         * 
         * PlayerList:
         *  SeatIndex	        int	            玩家座位編號
         *  HeadUrl	            string	        玩家頭像 初始化為1
         *  Gender	            string	        玩家性別 1: 男 0: 女
         *  Nickname	        string	        玩家暱稱
         *  Credit	            float64	        玩家身上的籌碼金額
         * */
        cc.module.mqant.on(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/TableInfo", function(destinationName, data)
        {
            var jsonData = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(this.DebugMode) {console.log("%c[hookMQTT] => [TableInfo] "+destinationName+".",'color:'+this.DebugModeColor_GET);}
            if(this.DebugMode) {console.log(jsonData);}
            this.OnQueueArr.push(['TableInfo',jsonData]);

            console.log(this.OnQueueArr);
        }.bind(this));

        /** GS通知玩家開始搶莊
         * [Subscriber] MJEBG/StartBidding
         * 
         * Payload:
         *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
         *  Data	            array	        封包資料 Content-Type: application/json => map
         *  Time	            int	            傳送時間
         * 
         * Data:
         *  Round	            int	            當前回合
         *  BiddingTimer        float64         搶莊時間
         *  MaxiMagnification   float64         玩家所能搶莊最大倍率
         *  MiniMagnification   float64         玩家所能搶莊最小倍率列表
         * 
         * */
        cc.module.mqant.on(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/StartBidding", function(destinationName, data)
        {
            var jsonData = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(this.DebugMode) {console.log("%c[hookMQTT] => [StartBidding] "+destinationName+".",'color:'+this.DebugModeColor_GET);}
            if(this.DebugMode) {console.log(jsonData);}
            this.OnQueueArr.push(['StartBidding',jsonData]);

            console.log(this.OnQueueArr);
        }.bind(this));



        /** GS通知有玩家發動搶莊動作
         * [Subscriber] MJEBG/SomeoneBidding
         * 
         * Payload:
         *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
         *  Data	            array	        封包資料 Content-Type: application/json => map
         *  Time	            int	            傳送時間
         * 
         * Data:
         *  BidderIdx	        int	            搶莊者SeatIndex
         *  Magnification       float64         搶莊倍率
         * 
         * */
        cc.module.mqant.on(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/SomeoneBidding", function(destinationName, data)
        {
            var jsonData = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(this.DebugMode) {console.log("%c[hookMQTT] => [SomeoneBidding] "+destinationName+".",'color:'+this.DebugModeColor_GET);}
            if(this.DebugMode) {console.log(jsonData);}
            this.OnQueueArr.push(['SomeoneBidding',jsonData]);

            console.log(this.OnQueueArr);
        }.bind(this));

        /** GS通知玩家搶莊結果
         * [Subscriber] MJEBG/BiddingResult
         * 
         * Payload:
         *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
         *  Data	            array	        封包資料 Content-Type: application/json => map
         *  Time	            int	            傳送時間
         * 
         * Data:
         *  BidderIdx	        int	            莊家SeatIndex
         *  Magnification       float64         莊家倍率
         * 
         * */
        cc.module.mqant.on(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/BiddingResult", function(destinationName, data)
        {
            var jsonData = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(this.DebugMode) {console.log("%c[hookMQTT] => [BiddingResult] "+destinationName+".",'color:'+this.DebugModeColor_GET);}
            if(this.DebugMode) {console.log(jsonData);}
            this.OnQueueArr.push(['BiddingResult',jsonData]);

            console.log(this.OnQueueArr);
        }.bind(this));

        /** GS通知玩家開始進行下注動作
         * [Subscriber] MJEBG/StartBetting
         * 
         * Payload:
         *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
         *  Data	            array	        封包資料 Content-Type: application/json => map
         *  Time	            int	            傳送時間
         * 
         * Data:
         *  BettingTimer	    int	            下注時間
         *  MaxiOdds            float64         最大下注倍率(如等於-1則為莊家,不須下注)
         *  MiniOdds            float64         最小下注倍率(如等於-1則為莊家,不須下注)
         * 
         * */
        cc.module.mqant.on(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/StartBetting", function(destinationName, data)
        {
            var jsonData = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(this.DebugMode) {console.log("%c[hookMQTT] => [StartBetting] "+destinationName+".",'color:'+this.DebugModeColor_GET);}
            if(this.DebugMode) {console.log(jsonData);}
            this.OnQueueArr.push(['StartBetting',jsonData]);

            console.log(this.OnQueueArr);
        }.bind(this));

        /** GS通知玩家有玩家下注
         * [Subscriber] MJEBG/SomeoneBetting
         * 
         * Payload:
         *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
         *  Data	            array	        封包資料 Content-Type: application/json => map
         *  Time	            int	            傳送時間
         * 
         * Data:
         *  BettorIdx	        int	            下注者SeatIndex
         *  Odds	            float64	        下注倍率
         * 
         * */
        cc.module.mqant.on(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/SomeoneBetting", function(destinationName, data)
        {
            var jsonData = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(this.DebugMode) {console.log("%c[hookMQTT] => [SomeoneBetting] "+destinationName+".",'color:'+this.DebugModeColor_GET);}
            if(this.DebugMode) {console.log(jsonData);}
            this.OnQueueArr.push(['SomeoneBetting',jsonData]);

            console.log(this.OnQueueArr);
        }.bind(this));

        /** GS通知玩家骰盅決定的結果
         * [Subscriber] MJEBG/RollingToDealResult
         * 
         * Payload:
         *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
         *  Data	            array	        封包資料 Content-Type: application/json => map
         *  Time	            int	            傳送時間
         * 
         * Data:
         *  DiceList	        int array	    每顆骰子骰出的點數 陣列
         *  StartPlayerIdx      int             開始發牌的玩家SeatIndex
         * 
         * */
        cc.module.mqant.on(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/RollingToDealResult", function(destinationName, data)
        {
            var jsonData = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(this.DebugMode) {console.log("%c[hookMQTT] => [RollingToDealResult] "+destinationName+".",'color:'+this.DebugModeColor_GET);}
            if(this.DebugMode) {console.log(jsonData);}
            this.OnQueueArr.push(['RollingToDealResult',jsonData]);

            console.log(this.OnQueueArr);
        }.bind(this));


        /** GS通知玩家回合動作結果
         * [Subscriber] MJEBG/TurnInfo
         * 
         * Payload:
         *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
         *  Data	            array	        封包資料 Content-Type: application/json => map
         *  Time	            int	            傳送時間
         * 
         * Data:
         *  Round	            int	            回合
         *  IsEnding            int             是否結束牌局 0:牌局尚未結束 1:回合上限已到結束牌局 2:有玩家因身上籌碼不足結束遊戲
         *  PlayerList          map array	    玩家資料
         *  RecordCardHistory   map             已發過牌的紀錄
         * 
         * PlayerList:
         *  Nickname            string          玩家暱稱
         *  SeatIndex           int             玩家座位編號
         *  Credit              float           玩家當前身上的籌碼金額
         *  Dealer              int             是否為莊家
         *  IsWin               int             是否贏 0:輸,1:贏,2:和局
         *  Hands               string array    玩家手牌 0:白皮 1:一筒 2:二筒 3:三筒 4:四筒 5:五筒 6:六筒 7:七筒 8:八筒 9:九筒
         *  CardType            int             玩家牌型編號 0: 散牌 1: 二八 2: 豹子
         *  CardTypePoint       float64         玩家牌型點數
         *  RoundProfit         float64         此回合獲利
         *  RoundLoss           float64         此回合虧損
         * 
         * RecordCardHistory:
         *  0	                int	            白皮所出現次數
         *  1	                int	            一筒所出現次數
         *  2	                int	            二筒所出現次數
         *  3	                int	            三筒所出現次數
         *  4	                int	            四筒所出現次數
         *  5	                int	            五筒所出現次數
         *  6	                int	            六筒所出現次數
         *  7	                int	            七筒所出現次數
         *  8	                int	            八筒所出現次數
         *  9	                int	            九筒所出現次數
         * 
         * */
        cc.module.mqant.on(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/TurnInfo", function(destinationName, data)
        {
            var jsonData = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(this.DebugMode) {console.log("%c[hookMQTT] => [TurnInfo] "+destinationName+".",'color:'+this.DebugModeColor_GET);}
            if(this.DebugMode) {console.log(jsonData);}
            this.OnQueueArr.push(['TurnInfo',jsonData]);

            console.log(this.OnQueueArr);
        }.bind(this));


         /** GS通知玩家牌局結算
         * [Subscriber] MJEBG/OnSettlement
         * 
         * Payload:
         *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
         *  Data	            array	        封包資料 Content-Type: application/json => map
         *  Time	            int	            傳送時間
         * 
         * Data:
         *  PlayerList          map array	    玩家資料
         *  RecordCardHistory   map             已發過牌的紀錄
         * 
         * PlayerList:
         *  Nickname            string          玩家暱稱
         *  SeatIndex           int             玩家座位編號
         *  Credit              float           玩家當前身上的籌碼金額
         *  Profit              float64         總獲利
         *  Loss                float64         總虧損
         * 
         * RecordCardHistory:
         *  0	                int	            白皮所出現次數
         *  1	                int	            一筒所出現次數
         *  2	                int	            二筒所出現次數
         *  3	                int	            三筒所出現次數
         *  4	                int	            四筒所出現次數
         *  5	                int	            五筒所出現次數
         *  6	                int	            六筒所出現次數
         *  7	                int	            七筒所出現次數
         *  8	                int	            八筒所出現次數
         *  9	                int	            九筒所出現次數
         * 
         * */
        cc.module.mqant.on(cc.module.jsonFile['SERVER_GAME_TYPE'] + "/OnSettlement", function(destinationName, data)
        {
            var jsonData = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(this.DebugMode) {console.log("%c[hookMQTT] => [OnSettlement] "+destinationName+".",'color:'+this.DebugModeColor_GET);}
            if(this.DebugMode) {console.log(jsonData);}
            this.OnQueueArr.push(['OnSettlement',jsonData]);

            console.log(this.OnQueueArr);
        }.bind(this));

        if(this.DebugMode) { console.log("%c [hookMQTT] => [hookMQTTEvent] hookMQTTEvent is loaded.",'color:'+this.DebugModeColor_FA); }

        
        /** GS通知玩家思考時間
         * [Subscriber] TT
         * 
         * Payload:
         *  Code	            int	            1: 請求成功 (其他請參閱代碼定義表)
         *  Data	            array	        回傳資料 Content-Type: application/json => map
         *  Time	            int	            回傳時間
         * 
         * Data:
         *  Hands	            string array	玩家手牌內容
         * */
        cc.module.mqant.on("TT", function(destinationName, data){
            var jsonData = JSON.parse(cc.module.mqant.parseUTF8(data));
            if(this.DebugMode) {console.log("%c[hookMQTT] => [ReceiveHands] "+destinationName+".",'color:'+this.DebugModeColor_GET);}
            if(this.DebugMode) {console.log(jsonData);}
            this.OnQueueArr.push(["TT",jsonData]);
        }.bind(this));
    },

    /** 
     * [回傳QueueArr] 
     * */
    ReturnQueueArr: function(){
        // if(this.DebugMode) {console.log("%c[hookMQTT] => [ReturnQueueArr] in action.",'color:'+this.DebugModeColor_FA);}
        return this.OnQueueArr;
    },

    /** 
     * [刪除對應的QueueArr]
     *  */
    DeleteQueueArr: function(qCount){
        if(this.DebugMode) {console.log("%c[hookMQTT] => [DeleteQueueArr] in action.",'color:'+this.DebugModeColor_FA);}
        this.OnQueueArr.splice(qCount,1);       
    },

    /** 
     * [刪除QueueArr全部資料]
     *  */
    DeleteQueueArrAll: function(){
        if(this.DebugMode) {console.log("%c[hookMQTT] => [DeleteQueueArrAll] in action.",'color:'+this.DebugModeColor_FA);}
        this.OnQueueArr = [];
    }, 

    /** 
     * [回傳RealTimeArr]
     *  */
    ReturnRealTimeArr: function(){
        // if(this.DebugMode) {console.log("%c[hookMQTT] => [ReturnRealTimeArr] in action.",'color:'+this.DebugModeColor_FA);}
        return this.RealTimeArr;
    },

    /** 
     * [刪除對應的RealTimeArr]
     *  */
    DeleteRealTimeArr: function(qCount){
        if(this.DebugMode) {console.log("%c[hookMQTT] => [DeleteRealTimeArr] in action.",'color:'+this.DebugModeColor_FA);}
        this.RealTimeArr.splice(qCount,1);       
    },

    /** 
     * [初始化]
     *  */
    Init: function(){
        if(this.DebugMode) {console.log("%c[hookMQTT] => [Init] in action.",'color:'+this.DebugModeColor_FA);}
        this.OnQueueArr     = [];               //儲存所接到的Queue陣列
        this.RealTimeArr    = [];               //即時處理的陣列
        this.Destroy();
        this.hookMQTTEvent();
    },

    /** 
     * [清空所有監聽]
     *  */
    Destroy: function(){
        if(this.DebugMode) {console.log("%c[hookMQTT] => [Destroy] in action.",'color:'+this.DebugModeColor_FA);}
        cc.module.mqant.clearCallback();        //清空所有監聽
    }
})
