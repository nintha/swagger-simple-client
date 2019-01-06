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
      <Modal v-model="modalStatus" width="80" title="Code Editor" footer-hide>
        <div v-if="modalStatus">
          <MonacoEditor
            class="editor"
            style="height:300px;  border: 1px solid #CCC; margin-bottom: 5px;"
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
    async submit() {
      this.inRequest = true;
      this.$Loading.start();
      // 校验必传参数
      const lacks = this.checkLackedParams();
      if (lacks.length > 0) {
        const message = `Parameters(${lacks.join(", ")}) is required`;
        this.$Message.warning(message);
        this.inRequest = false;
        this.$Loading.error();
        return;
      }

      const url = this.getDomain(this.serverUrl) + this.apiInfo.path;
      const params = Object.assign({}, this.paramValues);
      for (const key in params) {
        if (params[key] === undefined || params[key] === null || params[key] === '') {
          delete params[key];
        }
      }
      try {
        this.solvePlaceholder(params, this.flowContext);
        (this.apiInfo.parameters || [])
          .filter(it => it.type === "array")
          .forEach(it => {
            const value = params[it.name];
            if (value) params[it.name] = value.split("\n");
          });
      } catch (error) {
        const message = `Failed to inject parameters, ${error.message} `;
        this.$Message.warning(message);
        this.$Loading.error();
        this.inRequest = false;
        return;
      }

      let res = {};
      try {
        res = await this.$http({
          method: this.apiInfo.method,
          url,
          params: params, // query
          data: params, // formdata
          paramsSerializer: function (params) {
            // 处理array类型参数格式化
            return Qs.stringify(params, { arrayFormat: "repeat" });
          }
        });
        this.$Loading.finish();
      } catch (e) {
        res = e.response;
        this.$Loading.error();
        if (!res) console.error(e);
      }
      // console.log("res", res);
      this.responseData = res.data;
      this.responseCode = res.status;
      this.inRequest = false;
      return res;
    },
    checkLackedParams() {
      const requiredParams = (this.apiInfo.parameters || [])
        .filter(v => v.required)
        .map(v => v.name);
      return requiredParams.filter(v => !this.paramValues[v]);
    },
    getDomain(url) {
      const array = url.split("://");
      const subpart = array[1].split("/");
      return `${array[0]}://${subpart[0]}`;
    },
    // 替换占位符
    solvePlaceholder(params, context) {
      const placeholderRegex = /\$\{(.+?)\}/gi;
      const prev = context.card.response ? context.card.response.data : {};

      for (let param in params) {
        let value = params[param];
        if (value && placeholderRegex.test(value)) {
          const matchs = value.match(placeholderRegex);
          matchs.forEach(it => {
            const fieldName = placeholderRegex.exec(it)[1];
            value = value.replace(it, eval(fieldName));
          });
          params[param] = value;
        }
      }
    },
    assert(condition) {
      if (!condition) {
        throw new Error("API_FLOW_ASSERT_ERROR::" + JSON.stringify(condition));
      }
    },
    async runFlow(context) {
      this.resetResult();
      const rawRes = await this.submit();
      if (!rawRes) return null; // check failed

      // 脚本日志记录
      const logContents = [];
      const echo = (...args) => {
        const str = args.map(it => new String(it)).join(" ");
        logContents.push(str);
      };
      const assert = this.assert;

      const response = {
        status: rawRes.status,
        data: rawRes.data
      };
      try {
        eval(this.scriptCode);
        this.scriptResult.status = 1;
      } catch (error) {
        this.scriptResult.status = 2;
        this.scriptResult.message = error.message;
      }
      this.scriptResult.logContents = logContents;
      // 把结果存入上下文
      context.card = {
        scriptResult: this.scriptResult,
        response
      };
      return context;
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
      return {
        methodPath: this.apiInfo.methodPath,
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
