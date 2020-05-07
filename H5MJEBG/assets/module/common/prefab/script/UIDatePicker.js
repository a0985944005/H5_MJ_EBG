/** 
 * 日期组件
 */

cc.Class({
    extends: cc.Component,

    properties: {
        spBg: cc.Node,      
        lbYearMonth: cc.Label,
        ndWeek: cc.Node,
        ndDays: cc.Node,
        pfbDay: cc.Prefab,
    },

    onLoad () {
        this.initData();
        this.updateDate();
    },

    initData() {
        this.ndWeek.getChildByName('lbDay0').getComponent(cc.Label).string = cc.module.i18n.t('date.Sunday');
        this.ndWeek.getChildByName('lbDay1').getComponent(cc.Label).string = cc.module.i18n.t('date.Monday');
        this.ndWeek.getChildByName('lbDay2').getComponent(cc.Label).string = cc.module.i18n.t('date.Tuesday');
        this.ndWeek.getChildByName('lbDay3').getComponent(cc.Label).string = cc.module.i18n.t('date.Wednesday');
        this.ndWeek.getChildByName('lbDay4').getComponent(cc.Label).string = cc.module.i18n.t('date.Thursday');
        this.ndWeek.getChildByName('lbDay5').getComponent(cc.Label).string = cc.module.i18n.t('date.Friday');
        this.ndWeek.getChildByName('lbDay6').getComponent(cc.Label).string = cc.module.i18n.t('date.Saturday');

        this.date = this.date ? this.date : new Date();
        this.year = this.date.getFullYear();
        this.month = this.date.getMonth();
        this.day = this.date.getDate();

        this.pfgListDay = [];
        for (let i = 0; i < 31; ++i) {
            let node = cc.instantiate(this.pfbDay);
            node.parent = this.ndDays;
            this.pfgListDay.push(node);
        }
    },

    // 設置目前位置
    setPosi(_ToWorldSpaceAR){
        this.spBg.position = _ToWorldSpaceAR;
    },

    // 设置显示的日志，默认为当前日期
    setDate(year, month, day) {
        // year = parseInt(year);
        // month = parseInt(month);
        // day = parseInt(day);
        // this.date = new Date(year, parseInt(month), parseInt(day));
        this.date = new Date(year+"-"+month+"-"+day);
        this.year = this.date.getFullYear();
        this.month = this.date.getMonth();
        this.day = this.date.getDate();

        // console.log("----設置的原始資料----"); 
        // console.log(year);
        // console.log(month);
        // console.log(day);
        // console.log("----設置顯示日期----"); 
        // console.log(this.date);
        // console.log(this.year);
        // console.log(this.month);
        // console.log(this.day);

        this.updateDate();
    },

    updateDate () {
        this.lbYearMonth.string = cc.js.formatStr("%s"+cc.module.i18n.t('year')+"%s"+cc.module.i18n.t('month'), this.year, this.month+1);
        
        let date = new Date(this.year, this.month+1, 0);
        let totalDays = date.getDate();
        date=new Date(date.setDate(1));
        let fromWeek = date.getDay();
        
        for (let i = 0; i < this.pfgListDay.length; ++i) {
            let node = this.pfgListDay[i];
            if (i < totalDays) {
                node.active = true;
                let index = fromWeek + i;
                let row = Math.floor(index / 7);
                let col = index % 7;
                let x = -(this.ndDays.width - node.width) * 0.5 + col * node.width;
                let y = (this.ndDays.height - node.height) * 0.5 - row * node.height;
                node.setPosition(x, y);
                let script = node.getComponent("UIItemDay");
                script.setDay(i, i + 1, this.day === i + 1, (selIndex, selDay)=>{
                    this.day = selDay;                    
                    this.updateDate();
                    this.onClickClose();
                });
            } else {
                node.active = false;
            }
        }
    },

    onClickLeft () {
        
        // console.log("onClickLeft 目前年月");
        // console.log(this.month);
        // console.log(this.year);
        if (this.month > 0) {
            this.month -= 1;
        } else {
            this.month = 11;
            this.year -= 1;
        }
        this.date.setFullYear(this.year);
        this.date.setMonth(this.month);
        this.updateDate();
    },

    onClickRight () {
        if (this.month < 11) {
            this.month += 1;
        } else {
            this.month = 0;
            this.year += 1;
        }
        this.date.setFullYear(this.year);
        this.date.setMonth(this.month);
        this.updateDate();
    },

    // 设置选中日期之后的回调
    setPickDateCallback(cb) {
        this.cb = cb;
    },

    onClickClose () {
        if (this.cb) {
            this.cb(this.year, this.month+1, this.day);
        }
        this.node.parent = null;
    },
});
