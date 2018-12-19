<template>
  <Card style="margin:10px">
    <router-link :to="'/'">
      <Button>
        <Icon type="ios-arrow-back"></Icon>
      </Button>
    </router-link>

    <Card :bordered="false" :dis-hover="true">
      <Input
        slot="title"
        search
        enter-button="Fetch"
        placeholder="Swagger Json URL..."
        v-model="jsonUrl"
        @on-search="fetchSwaggerJson"
      />
      <Row>
        <Col span="8">
          <Menu width="auto" @on-select="selectPath">
            <Submenu v-for="tag in viewTags" :name="tag.name" v-bind:key="tag.name">
              <template slot="title">
                <Icon type="ios-paper"/>
                <strong>{{tag.name.toUpperCase()}}</strong>
                <br>
                <span>{{tag.description}}</span>
              </template>
              <MenuItem v-for="path in tag.paths" :name="path.name" v-bind:key="path.name">
                <span style="display:inline-block; width: 58px">{{path.method.toUpperCase()}}</span>
                <span>{{path.path}}</span>
                <br>
                <span>{{path.detail.summary}}</span>
              </MenuItem>
            </Submenu>
          </Menu>
        </Col>

        <Col span="16">
          <div style="margin-left:5px" v-if="selectedPathDetail">
            <Tag :color="methodColors[selectedPathDetail.method.toLowerCase()]" >
              {{selectedPathDetail.method.toUpperCase()}}
            </Tag>
            {{selectedPathDetail.path}}
            <br>
            <br>
            <Table :columns="tableColumn" :data="selectedPathDetail.parameters"></Table>
            <br>
            <Button type="success" @click="submit" long>Try it out</Button>
            <br>
            <br>
            <div v-show="responseCode > 0">
              Response code: {{responseCode}}
              <json-viewer
                :value="responseData"
                :expand-depth="10"
                copyable
                boxed
                sort
                theme="my-awesome-json-theme"
              ></json-viewer>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  </Card>
</template>

<script>
export default {
  data() {
    return {
      methodColors: {
        get: "primary",
        post: "success",
        put: "warning",
        patch: "cyan",
        delete: "error"
      },
      jsonUrl: "https://192.168.6.75:8080/v2/api-docs",
      jsonData: {},
      viewTags: [],
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
                <i-input
                  placeholder="Enter value"
                  v-model={this.paramValues[params.row.name]}
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
          width: 90
        },
        {
          title: "ParamType",
          key: "in",
          width: 100
        }
      ],
      paramValues: {},
      pathDetailMap: {},
      selectedPathDetail: null,
      responseCode: 0,
      responseData: {}
    };
  },
  methods: {
    async fetchSwaggerJson(input) {
      let res;
      try {
        res = await this.$http.get(input);
      } catch (error) {
        this.$Message.error(error.message);
        return;
      }
      this.jsonData = res.data;
      this.viewTags = this.jsonData.tags;

      const tagPathMap = {};
      const pathDetailMap = {};
      for (const pathName in this.jsonData.paths) {
        const path = this.jsonData.paths[pathName];
        for (const method in path) {
          const detail = path[method];
          detail.tags.forEach(el => {
            if (!tagPathMap[el]) tagPathMap[el] = [];

            const wrap = {
              name: `${method} ${pathName}`,
              method,
              path: pathName,
              detail: { method, path: pathName, ...detail }
            };
            tagPathMap[el].push(wrap);
            pathDetailMap[wrap.name] = wrap.detail;
          });
        }
      }
      this.pathDetailMap = pathDetailMap;

      this.viewTags.forEach(tag => {
        tag.paths = tagPathMap[tag.name] || [];
      });
      console.log(this.viewTags);
    },
    async submit() {
      const url = `${this.getDomain(this.jsonUrl)}${this.selectedPathDetail.path}`;
      const pathMethod = this.selectedPathDetail.method + url

      const queryType = this.selectedPathDetail.parameters
        ? this.selectedPathDetail.parameters[0].in
        : "query";
      let body = queryType === "formData" ? this.$qs.stringify(this.paramValues):  this.paramValues;
      let res = {};
      try {
        res = await this.$http({
          method: this.selectedPathDetail.method,
          url,
          data: body
        });
      } catch (e) {
        res = e.response;
      }
      // 防止点击前面请求影响到后门的结果
      if(pathMethod == `${this.selectedPathDetail.method}${this.getDomain(this.jsonUrl)}${this.selectedPathDetail.path}`){
        this.responseData = res.data;
        this.responseCode = res.status;
      }
    },
    getDomain(url) {
      const array = url.split("://");
      const subpart = array[1].split("/");
      return `${array[0]}://${subpart[0]}`;
    },
    selectPath(methodPath) {
      this.selectedPathDetail = this.pathDetailMap[methodPath];
      console.log(this.selectedPathDetail);
    }
  }
};
</script>

<style lang="scss">
@import "my-awesome-json-theme.scss";
</style>