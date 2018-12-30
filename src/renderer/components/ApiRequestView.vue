<template>
  <div>
    <Tag :color="methodColors[apiInfo.method.toLowerCase()]">{{apiInfo.method.toUpperCase()}}</Tag>
    <span
      style="font-weight: bolder; font-size:18px; vertical-align: middle; margin-left:10px;"
    >{{apiInfo.path}}</span>
    <br>
    <br>
    <Table :columns="tableColumn" :data="apiInfo.parameters"></Table>
    <br>
    <Button :type="inRequest ? 'warning' : 'success'" @click="submit" long>
      <span v-if="!inRequest">Try it out</span>
      <span v-else>Waiting...</span>
    </Button>
    <br>
    <br>
    <Card dis-hover v-show="responseCode > 0">
      <p slot="title">Response code: {{responseCode}}</p>
      <div style="overflow: overlay; max-height:600px">
        <pre><code class="json">{{responseData}}</code></pre>
      </div>
    </Card>
    <br>
    <Card dis-hover v-show="definitionNames.length > 0">
      <p slot="title">Model</p>
      <DefinitionView :definitions="definitions" :names="definitionNames"></DefinitionView>
    </Card>
  </div>
</template>
<script>
import Qs from "qs";
import DefinitionView from "./DefinitionView";
export default {
  components: {
    DefinitionView
  },
  data: function() {
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
      paramValues: {},
      responseCode: 0,
      responseData: {},
      inRequest: false,
      definitionNames: []
    };
  },
  props: {
    apiInfo: Object,
    jsonUrl: String,
    definitions: Object
  },
  watch: {
    apiInfo: function(val, oldVal) {
      this.saveApiContext(oldVal.methodPath);
      this.refresh();
    }
  },
  methods: {
    async submit() {
      this.inRequest = true;
      this.$Loading.start();
      // 校验必传参数
      const lacks = this.checkLackedParams();
      if (lacks.length > 0) {
        const message = `Parameter(${lacks.join(", ")}) is required`;
        this.$Message.warning(message);
        this.inRequest = false;
        this.$Loading.error();
        return;
      }

      const url = this.getDomain(this.jsonUrl) + this.apiInfo.path;
      const params = Object.assign({}, this.paramValues);

      (this.apiInfo.parameters || [])
        .filter(it => it.type === "array")
        .forEach(it => {
          if (params[it.name]) params[it.name] = params[it.name].split("\n");
        });
      let res = {};
      try {
        res = await this.$http({
          method: this.apiInfo.method,
          url,
          params: params, // query
          data: params, // formdata
          paramsSerializer: function(params) {
            // 处理array类型参数格式化
            return Qs.stringify(params, { arrayFormat: "repeat" });
          }
        });
        this.$Loading.finish();
      } catch (e) {
        res = e.response;
        this.$Loading.error();
      }
      this.responseData = res.data;
      this.responseCode = res.status;
      this.inRequest = false;
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
    parseDefinition(definition) {
      if (definition.type === "object") {
        const props = definition.properties;
        return Object.keys(props).map(field => (
          <div>
            <b>{field}</b> ({props[field].format || props[field].type}):{" "}
            <i>{props[field].description}</i>
          </div>
        ));
      } else {
        console.error("cant parse definition", definition);
        return [];
      }
    },
    refresh() {
      const context = this.loadApiContext(this.apiInfo.methodPath);
      this.responseCode = context.responseCode;
      this.responseData = context.responseData;
      this.paramValues = context.paramValues;

      this.definitionNames = this.apiInfo.parameters
        ? this.apiInfo.parameters
            .filter(it => it.schema)
            .map(it => it.schema.$ref.split("/")[2])
        : [];
    },
    getEmptyApiContext() {
      return {
        responseCode: 0,
        responseData: {},
        paramValues: {}
      };
    },
    saveApiContext(apiName) {
      if (
        this.responseCode === 0 &&
        Object.keys(this.paramValues).length === 0
      ) {
        // 不保存空上下文
        return;
      }

      const context = {
        responseCode: this.responseCode,
        responseData: this.responseData,
        paramValues: this.paramValues
      };

      localStorage.setItem(
        "SWAGGER_API_CONTEXT::" + apiName,
        JSON.stringify(context)
      );
    },
    loadApiContext(apiName) {
      const json = localStorage.getItem("SWAGGER_API_CONTEXT::" + apiName);
      return json ? JSON.parse(json) : this.getEmptyApiContext();
    }
  },
  created() {
    this.refresh();
  }
};
</script>

