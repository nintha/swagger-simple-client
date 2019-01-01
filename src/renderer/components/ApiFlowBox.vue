<template>
  <div>
    <div>
      <Button type="success" @click="runAll">Run all</Button>
      <Button type="info" @click="importDir">Open directory</Button>
    </div>
    <div
      v-for="flow in flowList"
      style="margin: 15px 0px; padding: 10px 20px; border: 1px solid #CCC; border-radius: 8px;"
    >
      <div style="float:right;">
        <Button type="primary" ghost size="small" @click="showDetail(flow)">Detail</Button>
      </div>
      <div style="font-size: 16px;">
        <span style="display:inline-block; width:50px;">{{flow.result.progress}} / {{flow.result.total}}</span>
        <span style="display:inline-block; padding: 0 10px">{{flow.filename}}</span>
      </div>
      <Progress :status="flow.progressStatus" :percent="flow.progressPercent" :hide-info="true"/>
    </div>
  </div>
</template>
<script>
import { ipcRenderer } from "electron";
import FlowUtil from '../utils/FlowUtil'

export default {
  data: function () {
    return {
      flowList: []
    }
  },
  methods: {
    async runAll() {
      this.resetFlowList()
      await FlowUtil.delay(300)

      for (const it of this.flowList) {
        it.result = await FlowUtil.runFlowAsync(it);
        it.progressStatus = 'active'
        it.progressPercent = it.result.total > 0 ? Math.ceil(1 * 100 / it.result.total) : 0;
        // hack progress components, Percent从非0开始，可以保证status显示正常
        process.nextTick(()=>{
          it.progressStatus = ['active', 'success', 'wrong'][it.result.code]
          it.progressPercent = it.result.total > 0 ? Math.ceil(it.result.progress * 100 / it.result.total) : 0;
        })
        await FlowUtil.delay(100)
      }

    },
    importDir() {
      // get file contents in selected directory
      let list = ipcRenderer.sendSync('open-directory')
      if (!list) return;

      list.forEach(it => {
        it.progressPercent = 0;
        it.progressStatus = 'wrong'
        it.result = {
          total: it.data.length,
          progress: 0,
          code: 0,
        };
      })

      this.flowList = list;
    },
    resetFlowList() {
      this.flowList.forEach(it => {
        it.progressPercent = 0;
        it.progressStatus = 'wrong'
        it.result = {
          total: it.data.length,
          progress: 0,
          code: 0,
        };
      })
    },
    showDetail(flow) {
    },

    // end methods
  },
  created() {
  }
}
</script>
