
cc.Class({
    extends: cc.Component,

    properties: {
        progress:{
            default:null,
            type:cc.Sprite
        },

        _width:0,
    },

    onLoad () {
        let slider = this.getComponent(cc.Slider);
        if(slider == null || this.progress == null){
            return;
        }

        slider.progress = 0;
        this._width = this.progress.node.width;
        this.progress.node.width = this._width * slider.progress;
    },

    /** 
     * [設定進度條的%]
     * @param {float} _Progress     進度條百分比
     */
    SetProgress: function(_Progress){
        let slider = this.getComponent(cc.Slider);
        this.getComponent(cc.Slider).progress = _Progress;
        this.progress.node.width = this._width * slider.progress;
    }
});
