import Vue from 'vue'
// import VueRouter from 'vue-router';
import axios from 'axios'
import qs from 'qs'

import App from './App'
import router from './router';
import store from './store'

import iView from 'iview';
import 'iview/dist/styles/iview.css';

import JsonViewer from 'vue-json-viewer'
import VueHighlightJS from 'vue-highlightjs'

Vue.use(iView);
Vue.use(JsonViewer)
Vue.use(VueHighlightJS)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.prototype.$qs = qs
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  render: h => h(App)
}).$mount('#app')
