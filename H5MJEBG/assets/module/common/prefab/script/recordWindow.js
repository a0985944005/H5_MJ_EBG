/** @file       recordWindown.js
  * @brief      遊戲專案-紀錄視窗.
  * @author     OreoLi
  * @date       2019/06/03 22:00 */

  cc.Class({
    extends: cc.Component,

    properties: {
        Layout_node:cc.Node,                    //背景防點擊的layout節點
        Content_node:cc.Node,                   //背景節點
        BtnClose_node:cc.Node,                  //關閉視窗按鈕節點

        pfbDatePicker: cc.Prefab,               //日期選擇器預製體 
        GameScreeningItem_Prefab: cc.Prefab,    //遊戲篩選預製體
        RecordOrderItem_Prefab:cc.Prefab,       //訂單預製體
        RecordDetailItem_Prefab:cc.Prefab,      //訂單明細預製體
        
        Order_node:cc.Node,                     //玩家注單節點
        Detail_node:cc.Node,                    //玩家加扣點明細     
        GameScreening_node:cc.Node,             //遊戲篩選按鈕節點
        GameScreeningItem_node:cc.Node,         //遊戲篩選選單
        
        //音校區，目前2.0以上版本，需使用AudioClip來存放音效，後續不再使用url的方式調用                                 
        BtnClickOnAudio:        {  default: null,  type: cc.AudioClip  },       //按鈕點擊音效載入
    },

    ctor: function() {
        this.DebugMode              = true;             //是否開啟console.log
        this.DebugModeColor_FA      = "#000000";        //console.log 顏色 => Function Action
        this.DebugModeColor_POST    = "#8C0044";        //console.log 顏色 => 傳送server資料
        this.DebugModeColor_GET     = "#CC0000";        //console.log 顏色 => 接收server資料
        this.DebugModeColor_Msg     = "#FF0000";        //console.log 顏色 => 重要訊息

        this.ClickSeachTime     = "ToDay";          //目前所點擊的搜尋時間範圍預設為今日
        this.CountBegin         = 1;                //查詢時間範圍內的起始筆數
        this.CountEnd           = 20;               //查詢時間範圍內的結束筆數
        this.PageCount          = 20;               //每一頁顯示的筆數
        this.StartAt            = "";               //目前欲查詢的起始時間
        this.EndAt              = "";               //目前欲查詢的結束時間
        this.Topic              = "";               //遊戲Topic篩選
        this.CheckNextState     = true;             //是否還能查詢下一筆
    },

    Init: function(){
        if(this.DebugMode) {console.log("%c[recordWindown] => [Init] in action.",'color:'+this.DebugModeColor_FA);}

        this.node.active                = false;    //關閉 主節點，等動畫觸發才開啟
        this.Layout_node.active         = true;     //開啟 背景防點擊的layout節點
        this.BtnClose_node.active       = false;    //關閉 關閉按鈕節點
        this.Content_node.active        = false;    //關閉 主要內容節點
 
        this.Order_node.active      = false;    //關閉 玩家注單節點
        this.Detail_node.active     = false;    //關閉 玩家加扣點明細節點
        this.ClickSeachTime         = "ToDay";  //目前所點擊的搜尋時間範圍預設為今日
        this.CountBegin             = 1;        //查詢時間範圍內的起始筆數
        this.CountEnd               = this.PageCount;       //查詢時間範圍內的結束筆數
        this.StartAt                = "";       //目前欲查詢的起始時間
        this.EndAt                  = "";       //目前欲查詢的結束時間
        this.Topic                  = "";       //遊戲Topic篩選
        this.CheckNextState         = true;     //是否還能查詢下一筆

        //創建預製體至緩存池
        this.OrderItem_pool      = new cc.NodePool();                //發送籌碼的緩存池
        for (var cCount = 0; cCount < 1; cCount++) {            //建立發送籌碼的緩存池的物件寫入對應節點
            let _OI = cc.instantiate(this.RecordOrderItem_Prefab);    
            this.OrderItem_pool.put(_OI);   
        }
        this.DetailItem_pool      = new cc.NodePool();                //發送籌碼的緩存池
        for (var cCount = 0; cCount < 1; cCount++) {            //建立發送籌碼的緩存池的物件寫入對應節點
            let _DI = cc.instantiate(this.RecordDetailItem_Prefab);    
            this.DetailItem_pool.put(_DI);   
        }

        //回收預製體至緩存池
        this._PutPrefab();

        //Order 子節點初始化
        this.Order_node.getChildByName("label_betResult_total").getChildByName("label").color = new cc.Color(55, 150, 0);
        this.Order_node.getChildByName("label_betResult_total").getChildByName("label").getComponent(cc.Label).string = "0";
        this.Order_node.getChildByName("label_validAmount_total").getChildByName("label").color = new cc.Color(56, 31, 0);
        this.Order_node.getChildByName("label_validAmount_total").getChildByName("label").getComponent(cc.Label).string = "0";
        this.Order_node.getChildByName("label_datetime_bg").getChildByName("label_startDate").getComponent(cc.Label).string = this.GetDayAgo(0);
        this.Order_node.getChildByName("label_datetime_bg").getChildByName("label_endDate").getComponent(cc.Label).string   = this.GetDayAgo(0);
        this.Order_node.getChildByName("btn_ToDay_on").active               = true;         //開啟 今日按鈕 (可按)
        this.Order_node.getChildByName("btn_ToDay_off").active              = false;        //關閉 今日按鈕 (不可按)
        this.Order_node.getChildByName("btn_Yesterday_on").active           = true;         //開啟 昨日按鈕 (可按)
        this.Order_node.getChildByName("btn_Yesterday_off").active          = false;        //關閉 昨日按鈕 (不可按)
        this.Order_node.getChildByName("btn_ThisWeek_on").active            = true;         //開啟 本週按鈕 (可按)
        this.Order_node.getChildByName("btn_ThisWeek_off").active           = false;        //關閉 本週按鈕 (不可按)
        this.Order_node.getChildByName("btn_LastWeek_on").active            = true;         //開啟 上週按鈕 (可按)
        this.Order_node.getChildByName("btn_LastWeek_off").active           = false;        //關閉 上週按鈕 (不可按)
        this.Order_node.getChildByName("btn_SetDate_on").active             = true;         //開啟 自訂按鈕 (可按)
        this.Order_node.getChildByName("btn_SetDate_off").active            = false;        //關閉 自訂按鈕 (不可按)

        //Detail 子節點初始化
        this.Detail_node.getChildByName("label_game").getComponent(cc.Label).string             = "";   //設置 遊戲名稱
        this.Detail_node.getChildByName("label_sn").getComponent(cc.Label).string               = "";   //設置 房間編號
        this.Detail_node.getChildByName("label_betAmount").getComponent(cc.Label).string        = "";   //設置 盤口

        //設置顯示注單資料
        this.BtnChangeSearchTime({},"ToDay");   //預設目前顯示當天資料
        
        this.GameScreening_node.getChildByName("label").getComponent(cc.Label).string = cc.module.i18n.t("list_gameType.All");
        this.GameScreening_node.active      = true;
        this.GameScreeningItem_node.active  = false;
    },

    /**
     * [回收預製體]
     * @param {string}  _State  清除那些預製體 {"order","detail","不帶則全清空"}
     */
    _PutPrefab: function(_State){
        if(this.DebugMode) {console.log("%c[recordWindown] => [_PutPrefab] in action.",'color:'+this.DebugModeColor_FA);}

        if(!_State || _State == "") {
            var _OrderContentList           = this.Order_node.getChildByName("listGroup").getChildByName("view").getChildByName("content");      //轉存節點
            var _OrderContentListCount      = _OrderContentList.children.length;
            for(var aCount = 0 ; aCount < _OrderContentListCount ; aCount++){
                this.OrderItem_pool.put(_OrderContentList.children[0]);
            }
            var _DetailContentList          = this.Detail_node.getChildByName("listGroup").getChildByName('view').getChildByName('content');     //轉存節點
            var _DetailContentListCount     = _DetailContentList.children.length;
            for(var aCount = 0 ; aCount < _DetailContentListCount ; aCount++){
                this.DetailItem_pool.put(_DetailContentList.children[0]);
            }
        } else if(_State == "order") {
            var _OrderContentList           = this.Order_node.getChildByName("listGroup").getChildByName("view").getChildByName("content");      //轉存節點
            var _OrderContentListCount      = _OrderContentList.children.length;
            for(var aCount = 0 ; aCount < _OrderContentListCount ; aCount++){
                this.OrderItem_pool.put(_OrderContentList.children[0]);
            }
        } else if(_State == "detail"){
            var _DetailContentList          = this.Detail_node.getChildByName("listGroup").getChildByName('view').getChildByName('content');     //轉存節點
            var _DetailContentListCount     = _DetailContentList.children.length;
            for(var aCount = 0 ; aCount < _DetailContentListCount ; aCount++){
                this.DetailItem_pool.put(_DetailContentList.children[0]);
            }
        }
    },

    /** 
     * [開啟視窗動畫]
     * */
    OpenAnim: function(){
        if(this.DebugMode) {console.log("%c[recordWindown] => [OpenAnim] in action.",'color:'+this.DebugModeColor_FA);}
        
        let self = this;    
        this.Content_node.scale     = cc.module.jsonFile['SystemPanel']['WindowAnim']['OriginalScale'];
        this.Content_node.active    = true;
        this.node.active            = true;
        this.Order_node.active      = true;   
         
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
        if(this.DebugMode) {console.log("%c[recordWindown] => [BtnClose] in action.",'color:'+this.DebugModeColor_FA);}
        cc.module.audio.playEffect(this.BtnClickOnAudio);    //撥放音效
        this.node.active = false;
    },

    /**
     * [設定遊戲紀錄內容]
     */
    SetOrderData: function(){
        if(this.DebugMode) {console.log("%c[recordWindown] => [SetOrderData] in action.",'color:'+this.DebugModeColor_FA);}
         
        this.Order_node.getChildByName("btn_orderLeft").getComponent(cc.Button).interactable    = false;
        this.Order_node.getChildByName("btn_orderRight").getComponent(cc.Button).interactable   = false;
        let _OrderContentList         = this.Order_node.getChildByName("listGroup").getChildByName("view").getChildByName("content");      //轉存節點
        let _REQUEST = {"startAt"   :this.StartAt,
                        "endAt"     :this.EndAt,
                        "countBegin":this.CountBegin+"",
                        "countEnd"  :this.CountEnd+"",
                        "Topic"     :this.Topic};                                 //預先取得玩家今日前9筆注單
                        
        if(this.DebugMode) {
            console.log("_REQUEST");
            console.log(_REQUEST);
        }
        cc.module.mqant.request(cc.module.jsonFile['SERVER_HALL_TOPIC']+"/HD_GameOrder",_REQUEST, function(destinationName, data){
            if(this.DebugMode) {
                console.log(destinationName);
                console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
            }
            
            let _jsonDataResult = JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))['Result']);
            switch(parseFloat(_jsonDataResult["Code"])){
                case 1:
                    this.Order_node.getChildByName("listGroup").getComponent(cc.ScrollView).scrollToTop(0);
                    if(Object.keys(_jsonDataResult["Data"]["orders"]).length == 0) {
                        if(this.CountBegin <= 1) { 
                            this.Order_node.getChildByName("nolist").active     = true;
                            this.Order_node.getChildByName("listGroup").active  = false;
                        } else {
                            this.CheckNextState     = false;
                            this.CountBegin         -= this.PageCount;
                            this.CountEnd           -= this.PageCount;
                        }
                    } else {
                        this.Order_node.getChildByName("nolist").active     = false;
                        this.Order_node.getChildByName("listGroup").active  = true;
                        this.Order_node.getChildByName("btn_orderLeft").getComponent(cc.Button).interactable    = true;
                        this.Order_node.getChildByName("btn_orderRight").getComponent(cc.Button).interactable   = true;
                        
                        this._PutPrefab();  //回收預製體至緩存池

                        for(var oCount in _jsonDataResult["Data"]["orders"]){
                            let _Data = _jsonDataResult["Data"]["orders"][oCount];      //接收到的list資料

                            //取得遊戲名稱
                            let _GameName;
                            for(var gKey in cc.module.jsonFile['GAME_LIST']) {
                                if(cc.module.jsonFile['GAME_LIST'][gKey]['SERVER_GAME_TYPE'] == _Data['game']){
                                    _GameName = cc.module.i18n.t("list_gameType."+_Data['game']);
                                    break; 
                                }
                            } 
                            
                            //點擊明細的cb
                            let _Detail_cb = function(_SN,_GameName,_BetAmount){
                                this.SetOrderDetailData(_SN,_GameName,_BetAmount);
                            }.bind(this);
                                                    
                            //創建預製體            
                            let _OrderItemPrefab;
                            if(this.OrderItem_pool.size() > 0) {
                                _OrderItemPrefab = this.OrderItem_pool.get();                           //取得預制體
                            } else {
                                _OrderItemPrefab = cc.instantiate(this.RecordOrderItem_Prefab);         //若緩存池沒有預制體就創建
                            }
                            _OrderItemPrefab.getComponent("recordOrderItem").Init(  parseInt(this.CountBegin) + parseInt(oCount),
                                                                                    _Data['sn'],
                                                                                    _GameName,
                                                                                    _Data['order_at'],
                                                                                    cc.module.tools.formatFloatToFixed(_Data['bet_amount'],1),
                                                                                    cc.module.tools.formatFloatToFixed(_Data['bet_result'],2),
                                                                                    oCount % 2 == 0 ? true : false,
                                                                                    _Detail_cb);        //初始化預製體
                            _OrderContentList.addChild(_OrderItemPrefab);                               //加入預製體

                            
                           
                            
                        }
                        if(Object.keys(_jsonDataResult["Data"]["orders"]).length < this.PageCount) {
                            this.CheckNextState         = false;
                        } else {
                            this.CheckNextState         = true;
                        }
                    }
                    break;
                default:
                    if(this.DebugMode) {console.log("%c[recordWindown] => [SetOrderData] 進入例外狀況 Code:"+_jsonDataResult["Code"]+".",'color:'+this.DebugModeColor_GET);}
                    break;
            }

            if(_jsonDataResult["Data"]["total_bet_result"] >= 0) {
                this.Order_node.getChildByName("label_betResult_total").getChildByName("label").color = new cc.Color(55, 150, 0);
                this.Order_node.getChildByName("label_betResult_total").getChildByName("label").getComponent(cc.Label).string = "+"+ cc.module.tools.formatFloatToFixed(_jsonDataResult["Data"]["total_bet_result"],2);
            } else {
                this.Order_node.getChildByName("label_betResult_total").getChildByName("label").color = new cc.Color(255, 20, 21);
                this.Order_node.getChildByName("label_betResult_total").getChildByName("label").getComponent(cc.Label).string = cc.module.tools.formatFloatToFixed(_jsonDataResult["Data"]["total_bet_result"],2);
            }
            
            this.Order_node.getChildByName("label_validAmount_total").getChildByName("label").color = new cc.Color(56, 31, 0);
            this.Order_node.getChildByName("label_validAmount_total").getChildByName("label").getComponent(cc.Label).string = cc.module.tools.formatFloatToFixedToPoint(_jsonDataResult["Data"]["total_valid_amount"],1);
        }.bind(this));
        
        this.Order_node.active      = true;     //開啟 玩家注單節點
        this.Detail_node.active     = false;    //關閉 玩家加扣點明細節點
    },

    /**
     * [設定遊戲紀錄明細內容]
     * @param {int}         _SN             牌局編號
     * @param {string}      _GameName       遊戲類型
     * @param {float}       _BetAmount      投注金額
     */
    SetOrderDetailData(_SN,_GameName,_BetAmount){
        if(this.DebugMode) {console.log("%c[recordWindown] => [SetOrderDetailData] in action.",'color:'+this.DebugModeColor_FA);}

        let _DetailContentList  = this.Detail_node.getChildByName("listGroup").getChildByName('view').getChildByName('content');     //轉存節點
        this.Detail_node.getChildByName("label_sn").getComponent(cc.Label).string               = _SN;          //設置 房間編號
        this.Detail_node.getChildByName("label_game").getComponent(cc.Label).string             = _GameName;    //設置 遊戲名稱
        this.Detail_node.getChildByName("label_betAmount").getComponent(cc.Label).string        = _BetAmount;   //設置 盤口

        cc.module.mqant.request(cc.module.jsonFile['SERVER_HALL_TOPIC']+"/HD_GameDetail",{"SN" :_SN}, function(destinationName, data){
            if(this.DebugMode) {
                console.log(destinationName);
                console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
            }
            
            let _jsonDataResult = JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))['Result']);
            switch(parseFloat(_jsonDataResult["Code"])){
                case 1:
                    if(this.DebugMode) { console.log(_jsonDataResult["Data"]);  }

                    this._PutPrefab("detail");  //回收預製體至緩存池

                    for(var dCount in _jsonDataResult["Data"]){
                        let _Data = _jsonDataResult["Data"][dCount];      //接收到的list資料
                        //創建預製體            
                        let _DetailItemPrefab;
                        if(this.DetailItem_pool .size() > 0) {
                            _DetailItemPrefab = this.DetailItem_pool.get();                           //取得預制體
                        } else {
                            _DetailItemPrefab = cc.instantiate(this.RecordDetailItem_Prefab);         //若緩存池沒有預制體就創建
                        }
                        
                        let _TypeStr;
                        switch(parseFloat(_Data['type'])){
                            case 2:
                                _TypeStr = "重骰";
                                break;
                            default:
                            case 1:
                                _TypeStr = "";
                                break;
                        }
                        _DetailItemPrefab.getComponent("recordDetailItem").Init( parseInt(dCount) +1,
                                                                                _Data['bet_at'],
                                                                                cc.module.tools.formatFloatToFixed(_Data['valid_amount'],1),
                                                                                cc.module.tools.formatFloatToFixed(_Data['valid_amount'],1),
                                                                                cc.module.tools.formatFloatToFixed(_Data['bet_result'],2),
                                                                                _TypeStr,
                                                                                dCount % 2 == 0 ? true : false);        //初始化預製體
                        
                        _DetailContentList.addChild(_DetailItemPrefab);                               //加入預製體
                    }
                    break;
                default:
                        if(this.DebugMode) {console.log("%c[recordWindown] => [SetOrderDetailData] 進入例外狀況 Code:"+_jsonDataResult["Code"]+".",'color:'+this.DebugModeColor_GET);}
                    break;
            }
        }.bind(this));

        this.Order_node.active      = false;    //關閉 玩家注單節點
        this.Detail_node.active     = true;     //開啟 玩家加扣點明細節點
    },

    /** 
     * [返回玩家注單]
     * */
    BtnBackOrder: function(){
        if(this.DebugMode) {console.log("%c[recordWindown] => [BtnBackOrder] in action.",'color:'+this.DebugModeColor_FA);}
        cc.module.audio.playEffect(this.BtnClickOnAudio); //撥放音效
        
        //detail節點初始化
        let _Detail_listGroup       = this.Detail_node.getChildByName("listGroup").getChildByName('view').getChildByName('content');     //轉存節點
        this._PutPrefab("detail");              //回收預製體
        _Detail_listGroup.height    = 100;      //設定 高度(若不設定會出現bar的殘影)
        this.Order_node.active      = true;     //開啟 玩家注單節點
        this.Detail_node.active     = false;    //關閉 玩家加扣點明細節點
    },

    /** 
     * [切換搜尋時間範圍] 
     * @param {obj}     event   點擊事件
     * @param {string}  _State  要搜尋的時間範圍
     */
    BtnChangeSearchTime: function(event,_State){
        if(this.DebugMode) {console.log("%c[recordWindown] => [BtnChangeSearchTime] in action.",'color:'+this.DebugModeColor_FA);}

        this.Order_node.getChildByName("btn_ToDay_on").active               = true;         //開啟 今日按鈕 (可按)
        this.Order_node.getChildByName("btn_ToDay_off").active              = false;        //關閉 今日按鈕 (不可按)
        this.Order_node.getChildByName("btn_Yesterday_on").active           = true;         //開啟 昨日按鈕 (可按)
        this.Order_node.getChildByName("btn_Yesterday_off").active          = false;        //關閉 昨日按鈕 (不可按)
        this.Order_node.getChildByName("btn_ThisWeek_on").active            = true;         //開啟 本週按鈕 (可按)
        this.Order_node.getChildByName("btn_ThisWeek_off").active           = false;        //關閉 本週按鈕 (不可按)
        this.Order_node.getChildByName("btn_LastWeek_on").active            = true;         //開啟 上週按鈕 (可按)
        this.Order_node.getChildByName("btn_LastWeek_off").active           = false;        //關閉 上週按鈕 (不可按)
        this.Order_node.getChildByName("btn_SetDate_on").active             = true;         //開啟 自訂按鈕 (可按)
        this.Order_node.getChildByName("btn_SetDate_off").active            = false;        //關閉 自訂按鈕 (不可按)
        
        this.Order_node.getChildByName("btn_enterSerach").active            = false;        //關閉 確定搜尋按鈕
        this.Order_node.getChildByName("label_datetime").active             = false;        //關閉 起止日期文字
        this.Order_node.getChildByName("label_datetime_bg").active          = false;        //關閉 日期區間
        
        switch(_State){
            case "OpenSetDate":     //自定義時間
                cc.module.audio.playEffect(this.BtnClickOnAudio);                           //撥放音效
                this.Order_node.getChildByName("btn_SetDate_on").active     = false;        //關閉 自訂按鈕 (可按)
                this.Order_node.getChildByName("btn_SetDate_off").active    = true;         //開啟 自訂按鈕 (不可按)
                this.Order_node.getChildByName("btn_enterSerach").active    = true;         //開啟 確定搜尋按鈕
                this.Order_node.getChildByName("label_datetime").active     = true;         //開啟 起止日期文字
                this.Order_node.getChildByName("label_datetime_bg").active  = true;         //開啟 日期區間
                return;
                break;
            case "SetDate":     //自定義時間
                this.Order_node.getChildByName("btn_SetDate_on").active     = false;        //關閉 自訂按鈕 (可按)
                this.Order_node.getChildByName("btn_SetDate_off").active    = true;         //開啟 自訂按鈕 (不可按)
                this.Order_node.getChildByName("btn_enterSerach").active    = true;         //開啟 確定搜尋按鈕
                this.Order_node.getChildByName("label_datetime").active     = true;         //開啟 起止日期文字
                this.Order_node.getChildByName("label_datetime_bg").active  = true;         //開啟 日期區間
                this.StartAt                                              = this.Order_node.getChildByName("label_datetime_bg").getChildByName("label_startDate").getComponent(cc.Label).string + " 00:00:00";  
                if(this.Order_node.getChildByName("label_datetime_bg").getChildByName("label_endDate").getComponent(cc.Label).string == this.GetDayAgo(0)) {
                    this.EndAt                                          = cc.module.tools.GetNowDateTime();             //取得今天日期及目前時間
                } else {
                    this.EndAt                                          = this.Order_node.getChildByName("label_datetime_bg").getChildByName("label_endDate").getComponent(cc.Label).string + " 23:59:59";
                }
                break;
            case "Yesterday":   //昨日時間
                this.Order_node.getChildByName("btn_Yesterday_on").active   = false;                                    //關閉 昨日按鈕 (可按)
                this.Order_node.getChildByName("btn_Yesterday_off").active  = true;                                     //開啟 昨日按鈕 (不可按)
                this.StartAt                                            = this.GetDayAgo(1) + " 00:00:00";              //目前欲查詢的起始時間
                this.EndAt                                              = this.GetDayAgo(1) + " 23:59:59";              //取得今天日期時間00:00:00
                break;
            case "ToDay":       //本日時間 
                this.Order_node.getChildByName("btn_ToDay_on").active   = false;                                        //關閉 今日按鈕 (可按)
                this.Order_node.getChildByName("btn_ToDay_off").active  = true;                                         //開啟 今日按鈕 (不可按)
                this.StartAt                                            = this.GetDayAgo(0) + " 00:00:00";              //目前欲查詢的起始時間
                this.EndAt                                              = cc.module.tools.GetNowDateTime();             //取得今天日期及目前時間
                break;
            // case "3day":        //三天內時間
            //     this.Order_node.getChildByName("btn_3day_on").active    = false;                //關閉 近三天按鈕 (可按) 
            //     this.Order_node.getChildByName("btn_3day_off").active   = true;                 //開啟 近三天按鈕 (不可按)
            //     this.StartAt                                            = this.GetDayAgo(3) + " 00:00:00";      //目前欲查詢的起始時間
            //     this.EndAt                                              = cc.module.tools.GetNowDateTime();     //取得今天日期及目前時間
            //     break;
            case "ThisWeek":    //上週時間
                var d=new Date();
                this.Order_node.getChildByName("btn_ThisWeek_on").active            = false;                            //關閉 本週按鈕 (可按)
                this.Order_node.getChildByName("btn_ThisWeek_off").active           = true;                             //開啟 本週按鈕 (不可按)
                this.StartAt                                            = this.GetDayAgo(d.getDay()) + " 00:00:00";     //目前欲查詢的起始時間
                this.EndAt                                              = cc.module.tools.GetNowDateTime();             //取得今天日期及目前時間
                break;  
            case "LastWeek":    //上週時間
                var d=new Date();
                this.Order_node.getChildByName("btn_LastWeek_on").active            = false;                            //關閉 上週按鈕 (可按)
                this.Order_node.getChildByName("btn_LastWeek_off").active           = true;                             //開啟 上週按鈕 (不可按)
                this.StartAt                                            = this.GetDayAgo(d.getDay()+7) + " 00:00:00";   //目前欲查詢的起始時間
                this.EndAt                                              = this.GetDayAgo(d.getDay()) + " 00:00:00";     //取得今天日期及目前時間
                break;    
            // case "2week":       //兩週內時間
            //     this.Order_node.getChildByName("btn_2week_on").active   = false;                                //關閉 兩週內按鈕 (可按)
            //     this.Order_node.getChildByName("btn_2week_off").active  = true;                                 //開啟 兩週內按鈕 (不可按)
            //     this.StartAt                                            = this.GetDayAgo(14) + " 00:00:00";     //目前欲查詢的起始時間
            //     this.EndAt                                              = cc.module.tools.GetNowDateTime();     //取得今天日期及目前時間
            //     break;
            default: 
                console.log("ChangeSearchTime 進入例外狀況");
                return;
                break;
        }
        
        this.CountBegin = 1;
        this.CountEnd   = this.PageCount;

        if(event && Object.keys(event).length != 0){
            cc.module.audio.playEffect(this.BtnClickOnAudio); //撥放音效
        }
        this.ClickSeachTime     = _State;           //目前所點擊的搜尋時間範圍
        this.SetOrderData();
    },

    /**
     * [取得幾天以前的日期]
     * @param   {int}       _DateAgo    幾天以前
     * 
     * @return  {string}    回傳時間格是"2019-01-01"
     */
    GetDayAgo: function(_DateAgo){
        if(this.DebugMode) {console.log("%c[recordWindown] => [GetDayAgo] in action.",'color:'+this.DebugModeColor_FA);}

        var _DateAgoObj = new Date();
        _DateAgoObj.setDate(_DateAgoObj.getDate() - parseFloat(_DateAgo));

        let _Year       = _DateAgoObj.getFullYear();
        let _Month      = (parseFloat(_DateAgoObj.getMonth())+1) < 10      ? "0"+(parseFloat(_DateAgoObj.getMonth())+1)   : (parseFloat(_DateAgoObj.getMonth())+1);
        let _Date       = _DateAgoObj.getDate() < 10                       ? "0"+_DateAgoObj.getDate()                    : _DateAgoObj.getDate();
        return _Year + "-" + _Month + "-" + _Date;
    },

    /** 
     * [切換搜尋筆數]  
     * @param {obj}         event       點擊事件
     * @param {string}      _State      往前還是往後搜尋{"back","next"}
     */
    BtnChangeSearchCount: function(event,_State){
        if(this.DebugMode) {console.log("%c[recordWindown] => [BtnChangeSearchCount] in action.",'color:'+this.DebugModeColor_FA);}

        cc.module.audio.playEffect(this.BtnClickOnAudio); //撥放音效

        switch(_State){
            case "next":
                if(this.CheckNextState == false || this.CountEnd >= 99999) return;

                this.CountBegin += this.PageCount;
                this.CountEnd   += this.PageCount;

                break;
            case "back":
                if(this.CountBegin <= 1) return; 

                this.CountBegin -= this.PageCount;
                this.CountEnd   -= this.PageCount;
                break;
            default:
                console.log("ChangeSearchCount 進入例外狀況");
                break;
        }
        this.SetOrderData();
    },

    /**
     * [點擊跳出日期選擇器]
     * @param {obj}     even    點擊事件
     * @param {string}  _State  設置的視窗 {"start","end"}
     */
    BtnDate_UID: function(even,_State) {
        if(this.DebugMode) {console.log("%c[recordWindown] => [BtnDate_UID] in action.",'color:'+this.DebugModeColor_FA);}

        let node = cc.instantiate(this.pfbDatePicker);
        node.parent = this.node;
        let datePicker = node.getComponent("UIDatePicker");

        let _LabelNode = this.Order_node.getChildByName("label_datetime_bg").getChildByName("label_"+_State+"Date");
        let _Date = _LabelNode.getComponent(cc.Label).string.split("-");
        let _ToWorldSpaceAR     = _LabelNode.parent.convertToWorldSpaceAR(cc.v2(_LabelNode.x,_LabelNode.y-40));
        let _ToNodeSpaceAR      = node.parent.convertToNodeSpaceAR(_ToWorldSpaceAR);
        datePicker.setPosi(_ToNodeSpaceAR);
        datePicker.setDate(_Date[0], _Date[1], _Date[2]);
        datePicker.setPickDateCallback((year, month, day)=>{
            month   = cc.module.tools._patch0(month);
            day     = cc.module.tools._patch0(day);
            _LabelNode.getComponent(cc.Label).string = year + "-" + month + "-" + day;
        });
    },
    
    /**
     * [點擊跳出遊戲篩選視窗]
     */
    BtnGameScreening: function(){
        if(this.DebugMode) {console.log("%c[recordWindown] => [BtnGameScreening] in action.",'color:'+this.DebugModeColor_FA);}

        cc.module.audio.playEffect(this.BtnClickOnAudio);                           //撥放音效

        //目前要顯示的遊戲清單 
        let _GameList   = { "All": cc.module.i18n.t("list_gameType.All")};
        
        //取得GameSetting所有資料
        cc.module.mqant.request(cc.module.jsonFile['SERVER_HALL_TOPIC'] + "/HD_GameSetting", {} , function (destinationName, data) {
            try{
                if(this.DebugMode) {
                    console.log(destinationName);
                    console.log(JSON.parse(cc.module.mqant.parseUTF8(data)));
                    console.log(JSON.parse(JSON.parse(cc.module.mqant.parseUTF8(data))['Result']));
                }
                var _JsonData           = JSON.parse(cc.module.mqant.parseUTF8(data));
                var _JsonDataResult     = JSON.parse(_JsonData['Result']);
                switch(parseFloat(_JsonDataResult['Code'])){
                    case 1:
                        for(var jKey in _JsonDataResult['Data']){
                            for(var gKey in cc.module.jsonFile['GAME_LIST']) {
                                if( cc.module.jsonFile['GAME_LIST'][gKey]['SERVER_GAME_TYPE'].toLowerCase() == jKey.toLowerCase() &&
                                    _JsonDataResult['Data'][jKey]["status"] != 0){
                                    _GameList[jKey] = cc.module.i18n.t("list_gameType."+jKey);
                                    break; 
                                }
                            } 
                        }
                                        

                        let self    = this;
                        let _Count  = 0;
                        for(var gKey in _GameList){
                            let _Prefab = cc.instantiate(this.GameScreeningItem_Prefab);

                            let _cb = function(_GameName,_Topic){
                                self.Topic = _Topic;
                                self.CountBegin         = 1;                //查詢時間範圍內的起始筆數
                                self.CountEnd           = 20;               //查詢時間範圍內的結束筆數
                                
                                if(!self.Topic || self.Topic == "All") self.Topic = "";
                                self.GameScreening_node.getChildByName("label").getComponent(cc.Label).string = _GameName;
                                self.SetOrderData();
                                self.BtnGameScreeningItem_close();
                                _Prefab.destroy();
                                
                                let _Content = self.GameScreeningItem_node.getChildByName("scrollview").getChildByName("view").getChildByName("content").children;
                                for(var _gKey in _Content){
                                    _Content[_gKey].destroy();
                                }
                                
                            };
                            _Prefab.getComponent("gameScreeningItem").Init(_GameList[gKey],gKey,_Count % 2 == 0 ? true:false,_cb);
                            this.GameScreeningItem_node.getChildByName("scrollview").getChildByName("view").getChildByName("content").addChild(_Prefab);
                            _Count++;
                        }
                        this.GameScreeningItem_node.active = true;

                        break;
                    default:
                        break;
                }
            }catch(e){
                if(this.DebugMode) {console.log("%c[network] => [GetGameSetting] login err :"+e+".",'color:'+this.DebugModeColor_Msg);}
                console.log(e); 
                this.ManualReconnect.apply();
            }
        }.bind(this)); 
    },
    
    /** 
     * [點擊關閉遊戲分類選單]
     *  */
    BtnGameScreeningItem_close: function(){
        if(this.DebugMode) {console.log("%c[recordWindown] => [BtnGameScreeningItem_close] in action.",'color:'+this.DebugModeColor_FA);}
        
        cc.module.audio.playEffect(this.BtnClickOnAudio);    //撥放音效
        this.GameScreeningItem_node.active = false;
        
        let _Content = this.GameScreeningItem_node.getChildByName("scrollview").getChildByName("view").getChildByName("content").children;
        for(var _gKey in _Content){
            _Content[_gKey].destroy();
        }
    },
    
});
