(self.webpackChunktradingview=self.webpackChunktradingview||[]).push([[4291],{359614:e=>{e.exports={"toast-wrapper":"toast-wrapper-lkrjxM0A",compact:"compact-lkrjxM0A"}},355485:(e,t,s)=>{"use strict";s.r(t),s.d(t,{globalToasts:()=>c,showToast:()=>u});var a=s(50959),o=s(497754),r=s(358244),i=s(586240),n=s(359614);const h=i["media-mf-phone-landscape"];function d(e){const{suggestedLayout:t,children:s}=e;return a.createElement("div",{className:o(n["toast-wrapper"],"compact"===t&&n.compact)},s)}const c=new class{constructor(){var e;this._mediaQuery=window.matchMedia(h),this._handleMediaQueryChange=()=>{this._toastsLayer.update({suggestedLayout:this._getSuggestedLayout()})},this._handleLoginStateChange=()=>{this._toastsLayer.update({location:this._getLocation()})},this._toastsLayer=new r.ToastsLayer(this._getSuggestedLayout(),void 0,void 0,this._getLocation()),this._mediaQuery.addListener(this._handleMediaQueryChange),null===(e=window.loginStateChange)||void 0===e||e.subscribe(this,this._handleLoginStateChange)}destroy(){var e;this._toastsLayer.destroy(),this._mediaQuery.removeListener(this._handleMediaQueryChange),null===(e=window.loginStateChange)||void 0===e||e.unsubscribe(this,this._handleLoginStateChange)}showCustomToast(e){const{render:t,...s}=e;var o;return this._toastsLayer.showToast({render:(o=t,e=>a.createElement(d,{suggestedLayout:e.suggestedLayout,children:o(e)})),...s}).remove}reset(){this._toastsLayer.reset()}forceRender(){this._toastsLayer.forceRender()}merge(e){this._toastsLayer.merge(e)}split(e){this._toastsLayer.split(e)}_getSuggestedLayout(){return this._mediaQuery.matches?"loose":"compact"}_getLocation(){return"bottom-left"}};function u(e){return c.showCustomToast(e)}},586240:e=>{"use strict";e.exports=JSON.parse('{"size-header-height":"64px","media-phone-vertical":"screen and (max-width: 479px)","media-mf-phone-landscape":"screen and (min-width: 568px)"}')}}]);