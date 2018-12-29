<template>
  <div>
    <div slot="title">
      <Button type="success" @click="runFlow">Run all</Button>
      <Button type="info" @click="exportFlow">Export</Button>
      <Button type="warning" @click="importFlow">Import</Button>
      <Button type="error" @click="resetFlow">Reset</Button>
    </div>
    <div style="background-color: #CCC; height: 1px; margin: 15px 0;"></div>
    <div v-for="card in cards">
      <div v-if="getApiInfo(card.methodPath)">
        <SingleApiView
          :flow-context="context"
          :api-info="getApiInfo(card.methodPath)"
          :card-info="card"
          :definitions="definitions"
          :server-url="jsonUrl"
          v-bind:ref="card.methodPath"
        />
      </div>
      <div style="background-color: #CCC; height: 1px; margin: 15px 0;"></div>
    </div>
    <Button type="primary" long>New card</Button>
    <div style="margin-bottom:50px"></div>
  </div>
</template>
<script>
import SingleApiView from "./SingleApiView";
import { ipcRenderer } from "electron";

export default {
  components: { SingleApiView },
  props: {
    pathDetailMap: Object,
    jsonUrl: String,
    definitions: Object,
    viewTags: Array,
  },
  data() {
    return {
      context: {
        prev: null,
        global: {},
        card: {}
      },
      cards: []

      //end data
    };
  },
  methods: {
    getApiInfo(methodPath) {
      return this.pathDetailMap[methodPath];
    },
    // 更新API卡片列表
    setCards(cards) {
      this.cards = [];
      // 强制重载组件
      process.nextTick(() => {
        this.cards = cards;
      });
    },
    getCardRefs(){
      return this.cards.map(it => this.$refs[it.methodPath][0])
    },
    async runFlow() {
      try {
        for (let card of this.cards) {
          // this.solvePlaceholder(card, this.context);
          await this.$refs[card.methodPath][0].runFlow(this.context);
          if (this.context.card.scriptResult.status === 2) {
            break;
          }
        }
      } catch (error) {
        console.warn('runFlow', error.message);
      }
    },
    resetFlow() {
      this.cards = [];
    },
    exportFlow() {
      const cards = this.getCardRefs().map(it => it.getCardInfo())
      if(cards || cards.length == 0){
        this.$Message.warning("Can't export empty Flow");
        return
      }
      ipcRenderer.sendSync("save-file", JSON.stringify(cards));
    },
    importFlow() {
      const cards = this.getCardRefs().map(it => it.getCardInfo())
      if(cards && cards.length > 0){
        this.$Message.warning("Only import data when the Flow is empty");
        return
      }
      const json = ipcRenderer.sendSync("read-file");
      if (json) {
        this.setCards(JSON.parse(json))
      }
    }
  }
};
</script>
