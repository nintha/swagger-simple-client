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
    <div v-show="responseCode > 0">
      Response code: {{responseCode}}
      <pre><code class="json">{{responseData}}</code></pre>
    </div>
  </div>
</template>
<script>
export default {
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
                {" "}
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
                {params.row.type ? (
                  <i-input
                    placeholder="Enter value"
                    v-model={this.paramValues[params.row.name]}
                  />
                ) : (
                  <i-input
                    v-model={this.paramValues[params.row.name]}
                    type="textarea"
                    autosize={{ minRows: 3, maxRows: 20 }}
                    placeholder="Enter something..."
                  />
                )}
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
            const name = params.row.type || params.row.schema.$ref.split("/")[2]
            const definition = params.row.type || this.parseDefinition(this.definitions[name])

            return (
              <div>
                {params.row.type || (<div><b># {name}</b>{definition}</div>)  }
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
      inRequest: false
    };
  },
  props: {
    apiInfo: Object,
    jsonUrl: String,
    definitions: Object
  },
  watch:{
    apiInfo: function(val, oldVal){
      this.responseCode = 0
      this.responseData = {}
      this.paramValues = {}
    }
  },
  methods: {
    async submit() {
      this.inRequest = true
      this.$Loading.start();
      // 校验必传参数
      const requiredParams = (this.apiInfo.parameters || [] ).filter(v=>v.required).map(v=>v.name)
      const lackedParams = requiredParams.filter(v => !this.paramValues[v])
      if(lackedParams.length > 0){
        this.$Message.warning(`Parameter(${lackedParams.join(', ')}) is required`);
        this.inRequest = false
        this.$Loading.error();
        return;
      }

      const url = this.getDomain(this.jsonUrl) + this.apiInfo.path;
      const pathMethod = this.apiInfo.method + url;

      const queryType = this.apiInfo.parameters
        ? this.apiInfo.parameters[0].in
        : "query";
      let body = ["formData", "query"].includes(queryType)
        ? this.$qs.stringify(this.paramValues)
        : this.paramValues;
      let res = {};
      try {
        res = await this.$http({
          method: this.apiInfo.method,
          url,
          data: body
        });
        this.$Loading.finish();
      } catch (e) {
        res = e.response;
        this.$Loading.error();
      }
      this.responseData = res.data;
      this.responseCode = res.status;
      this.inRequest = false
    },
    getDomain(url) {
      const array = url.split("://");
      const subpart = array[1].split("/");
      return `${array[0]}://${subpart[0]}`;
    },
    parseDefinition(definition){
      if(definition.type==='object'){
        const props = definition.properties
        return Object.keys(props).map(field => 
          <div><b>{props[field].type}</b> {field}: <i>{props[field].description}</i></div>
        )
      }else{
        console.error('cant parse definition', definition)
        return []
      }
    }
  },
  created(){
    console.log(this.definitions)
  }
};
</script>

