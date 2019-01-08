<template>
  <div>
    <div style="margin: 10px 0;">
      <Tag :color="methodColors[apiInfo.method.toLowerCase()]">{{apiInfo.method.toUpperCase()}}</Tag>
      <span
        style="font-weight: bolder; font-size:18px; vertical-align: middle; margin-left:10px;"
      >{{apiInfo.path}}</span>
    </div>
    <Table :columns="tableColumn" :data="apiInfo.parameters"></Table>
    <br>
    <div>
      <b>After Request</b>
      <Button type="primary" ghost size="small" @click="modalStatus = true">Edit</Button>
      <div
        style="overflow: overlay; max-height:200px; font-size: 14px; border: 1px solid #CCC; border-radius:8px; padding:0 10px; margin-top:5px;"
      >
        <pre><code class="json">{{scriptCode}}</code></pre>
      </div>
      <Modal v-model="modalStatus" width="80" title="Code Editor" footer-hide :mask-closable="false">
        <div v-if="modalStatus">
          <MonacoEditor
            class="editor"
            style="height:300px; border: 1px solid #CCC; margin-bottom: 5px;"
            :value="scriptCode"
            @change="onEditorChange"
            language="javascript"
            theme="vs"
          ></MonacoEditor>
        </div>
      </Modal>
    </div>

    <div style="margin: 15px 0;">
      <Button type="success" ghost long @click="runFlow(flowContext)">Run it</Button>
    </div>

    <b>Script Result</b>
    <Button type="error" size="small" ghost @click="resetResult" style="margin-bottom:5px;">clear</Button>
    <Input :value="formatResult()" type="textarea" :autosize="{minRows: 2,maxRows: 7}" readonly/>
  </div>
</template>
<script>
import Qs from "qs";
import MonacoEditor from "./MonacoEditor";
import FlowService from '../service/FlowService'

export default {
  components: { MonacoEditor },
  props: {
    flowContext: Object,
    apiInfo: Object,
    cardInfo: Object,
    definitions: Object,
    serverUrl: String,
  },
  watch: {
    cardInfo(val, oldVal) {
      // console.log('watch cardInfo', val)
      this.paramValues = this.cardInfo.paramValues || {};
      this.scriptCode = this.cardInfo.scriptCode || "";
      this.resetResult()
    }
  },
  data() {
    return {
      methodColors: {
        get: "primary",
        post: "success",
        put: "warning",
        patch: "cyan",
        delete: "error"
      },
      tableColumn: [
        {
          title: "Parameter",
          key: "name",
          render: (h, params) => {
            return (
              <span>
                {params.row.required ? (
                  <b>{params.row.name}</b>
                ) : (
                    params.row.name
                  )}
              </span>
            );
          }
        },
        {
          title: "Value",
          key: "value",
          render: (h, params) => {
            return (
              <div>
                <i-input
                  v-model={this.paramValues[params.row.name]}
                  type="textarea"
                  autosize={{ minRows: 1, maxRows: 20 }}
                  placeholder="Enter Value"
                />
              </div>
            );
          }
        },
        {
          title: "Description",
          key: "description"
        },
        {
          title: "DataType",
          key: "type",
          render: (h, params) => {
            const name =
              params.row.type || params.row.schema.$ref.split("/")[2];
            return (
              <div>
                {params.row.type || (
                  <DefinitionView
                    definitions={this.definitions}
                    names={[name]}
                  />
                )}
              </div>
            );
          }
        },
        {
          title: "ParamType",
          key: "in",
          width: 100
        }
      ],
      paramValues: this.cardInfo.paramValues || {},
      responseCode: 0,
      responseData: {},
      inRequest: false,
      scriptCode: this.cardInfo.scriptCode || "",
      scriptResult: {
        status: 0, // 0-ready, 1-success, 2-failed
        message: "",
        logContents: []
      },
      modalStatus: false,

      // end data
    };
  },
  methods: {
    async runFlow(context) {
      this.resetResult();
      await FlowService.runCardAsync(this.getCardInfo(),this.flowContext);
      this.scriptResult = this.flowContext.card.scriptResult
    },
    formatResult() {
      return this.scriptResult.status > 0
        ? ["", "Pass", this.scriptResult.message][this.scriptResult.status] +
        "\n\n=====LOG MESSAGE=====\n" +
        this.scriptResult.logContents.join("\n")
        : "";
    },
    resetResult() {
      this.scriptResult = {
        status: 0, // 0-ready, 1-success, 2-failed
        message: "",
        logContents: []
      };
    },
    getScriptResult() {
      return this.scriptResult;
    },
    /**
     * 获取当前卡片的数据
     */
    getCardInfo() {
      const parts = this.apiInfo.methodPath.split('#')
      return {
        methodPath: this.apiInfo.methodPath,
        method: parts[0],
        path: parts[1],
        paramValues: this.paramValues,
        scriptCode: this.scriptCode
      };
    },
    onEditorChange(value) {
      this.scriptCode = value;
    }
    // end method
  }
};
</script>
