<template>
  <div>
    <div slot="title">
      <Button type="success" @click="runFlow">Run all</Button>
      <Button type="info" @click="exportFlow">Export</Button>
      <Button type="warning" @click="importFlow">Import</Button>
      <Button type="error" @click="resetFlow">Remove all</Button>
    </div>
    <div style="background-color: #CCC; height: 1px; margin: 10px 0;"></div>
    <div>
      <b>Process {{flowProcess}}/{{cards.length}}</b>
      <Progress :percent="processValue" :status="flowStatus"/>
      <b>Output Message</b>
      <Button
        type="error"
        size="small"
        ghost
        @click="clearOutputMessage"
        style="margin-bottom:5px;"
      >clear</Button>
      <Input :value="outputMessage" type="textarea" :autosize="{minRows: 2,maxRows: 10}" readonly/>
    </div>
    <div style="background-color: #CCC; height: 1px; margin: 10px 0;"></div>
    <!-- empty flow message -->
    <div v-if="cards.length === 0" style="margin: 15px 0; color: #AAA;">
      <b>Flow is empty</b>
      <div style="background-color: #CCC; height: 1px; margin: 15px 0;"></div>
    </div>
    <!-- card view -->
    <div v-for="(card, index) in cards">
      <div v-if="getApiInfo(card.methodPath)" :id="'card-id-' + index">
        <div>
          <Button size="small"># {{index+1}}</Button>
          <Button size="small" icon="md-arrow-round-up" @click="moveUp(index)"></Button>
          <Button size="small" icon="md-arrow-round-down" @click="moveDown(index)"></Button>
          <Button size="small" icon="md-close" @click="removeCardByIndex(index)"></Button>
        </div>
        <SingleApiView
          :flow-context="context"
          :api-info="getApiInfo(card.methodPath)"
          :card-info="card"
          :definitions="definitions"
          :server-url="serverUrl"
          v-bind:ref="card.methodPath"
        />
      </div>
      <div style="background-color: #CCC; height: 1px; margin: 15px 0;"></div>
    </div>
    <div style="margin-bottom:50px">
      <Button type="primary" long @click="addCard">New card [ {{selectedPath}} ]</Button>
    </div>
  </div>
</template>
<script>
import SingleApiView from "./SingleApiView";
import { ipcRenderer } from "electron";
import { setTimeout } from 'timers';

export default {
  components: { SingleApiView },
  props: {
    pathDetailMap: Object,
    serverUrl: String,
    definitions: Object,
    viewTags: Array,
    selectedPath: String
  },
  data() {
    return {
      context: {
        prev: null,
        global: {},
        card: {}
      },
      cards: [],
      outputMessage: "",
      flowProcess: 0,
      flowStatus: 'active',
      //end data
    };
  },
  computed: {
    processValue: function () {
      return this.cards.length == 0 ? 0 : Math.ceil(this.flowProcess / this.cards.length * 100);
    }
  },
  methods: {
    getApiInfo(methodPath) {
      return this.pathDetailMap[methodPath];
    },
    // 强制重载组件
    refreshCardsAsync() {
      const data = this.cards;
      this.cards = [];
      return new Promise(suc => {
        process.nextTick(() => {
          this.cards = data;
          suc();
        });
      });
    },
    getCardRefs() {
      return this.cards.map(it => this.$refs[it.methodPath][0]);
    },
    async runFlow() {
      // 清理之前的日志
      this.getCardRefs().forEach(it => it.resetResult());
      this.flowProcess = 0;
      this.flowStatus = 'active'

      let errorMessage = null;
      try {
        for (const [index, value] of this.cards.entries()) {
          await this.$refs[value.methodPath][0].runFlow(this.context);
          this.flowProcess = index + 1;

          if (this.context.card.scriptResult.status === 2) {
            this.flowStatus = 'wrong'
            errorMessage = this.context.card.scriptResult.message;
            break;
          }
        }
        this.outputMessage = this.getCardRefs().flatMap(it => it.getScriptResult().logContents).join("\n")
        if (errorMessage) {
          this.outputMessage += '\n\nERROR:\n' + errorMessage
        }
      } catch (error) {
        console.warn("runFlow", error.message);
      }
    },
    resetFlow() {
      this.cards = [];
      this.clearOutputMessage()
    },
    exportFlow() {
      const cards = this.getCardRefs().map(it => it.getCardInfo());
      if (!cards || cards.length == 0) {
        this.$Message.warning("Can't export empty Flow");
        return;
      }
      ipcRenderer.sendSync("save-file", JSON.stringify(cards));
    },
    importFlow() {
      const cards = this.getCardRefs().map(it => it.getCardInfo());
      if (cards && cards.length > 0) {
        this.$Message.warning("Only import data when the Flow is empty");
        return;
      }
      const json = ipcRenderer.sendSync("read-file");
      if (json) {
        this.cards = JSON.parse(json);
        this.refreshCardsAsync()
      }
    },
    cleanAllScriptResult() {
      this.getCardRefs().forEach(it => it.resetResult())
    },
    addCard() {
      if (this.selectedPath) {
        this.cards.push({
          methodPath: this.selectedPath
        });
      }
    },
    insertCardByIndex(index, card) {
      this.cards.splice(index, 0, card);
    },
    removeCardByIndex(index) {
      this.cards.splice(index, 1);
    },
    moveUp(index) {
      if (index > 0) this.swapCard(index, index - 1);
    },
    moveDown(index) {
      if (index < this.cards.length - 1) this.swapCard(index, index + 1);
    },
    async swapCard(index1, index2) {
      const card1 = this.cards[index1];
      const card2 = this.cards[index2];
      this.removeCardByIndex(index1);
      this.insertCardByIndex(index1, card2);
      this.removeCardByIndex(index2);
      this.insertCardByIndex(index2, card1);

      // console.log(this.cards) 
    },
    clearOutputMessage() {
      this.outputMessage = '';
      this.flowProcess = 0;
      this.flowStatus = 'active'
    }

    // end method
  }
};
</script>
