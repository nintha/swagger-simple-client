<template>
  <div>
    <Sider
      width="300"
      :style="{position: 'fixed', height: '99vh',left: 0, overflow: 'auto', backgroundColor: 'white', borderRight: '1px #CCC solid'}"
    >
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
    </Sider>
    <Layout :style="{marginLeft: '300px'}">
      <Header :style="{background: '#fff', boxShadow: '0 2px 3px 2px rgba(0,0,0,.1)'}">
        <router-link :to="'/'" style="margin-left:-25px">
          <Button size="small">
            <Icon type="md-home" size="20"/>
          </Button>
        </router-link>
        <span
          style="font-weight: bolder; font-size:18px; vertical-align: middle; margin-left:10px;"
        >{{serverUrl}}</span>
      </Header>
      <Content>
        <div style="margin-top:10px; padding:0 10px; background-color: white;">
          <Tabs v-model="tabName" style="margin:0 10px;">
            <TabPane label="FlowBox" name="FlowBox">
              <ApiFlowBox :server-url="serverUrl" :path-detail-map="pathDetailMap" @to-flow-detail="toFlowDetail"></ApiFlowBox>
            </TabPane>
            <TabPane label="Flow" name="Flow">
              <ApiFlow
                :selected-path="selectedPath"
                :path-detail-map="pathDetailMap"
                :server-url="serverUrl"
                :definitions="jsonData.definitions"
                :flow-file-path="flowFilePath"
              ></ApiFlow>
            </TabPane>
            <TabPane label="Main" name="Main">
              <div v-if="selectedPathDetail">
                <ApiRequestView
                  :api-info="selectedPathDetail"
                  :json-url="serverUrl"
                  :definitions="jsonData.definitions"
                  :view-tags="viewTags"
                ></ApiRequestView>
              </div>
              <h1 v-else>Please select one API</h1>
            </TabPane>
          </Tabs>
        </div>
      </Content>
    </Layout>
  </div>
</template>

<script>
import ApiRequestView from './ApiRequestView.vue';
import ApiFlow from './ApiFlow'
import ApiFlowBox from './ApiFlowBox'

const KEY_SERVER_URL = 'API_DOCS_URL'
const KEY_SWAGGER_JSON = "KEY_SWAGGER_JSON";
export default {
  components: { ApiRequestView, ApiFlow, ApiFlowBox },
  data() {
    return {
      serverUrl: "",
      jsonData: {},
      viewTags: [],
      pathDetailMap: {},
      selectedPathDetail: null,
      selectedPath: null,
      tabName: 'FlowBox',
      flowFilePath: null,
    };
  },
  methods: {
    parseSwaggerJson() {
      const json = localStorage.getItem(KEY_SWAGGER_JSON)
      if (!json) return;

      this.jsonData = JSON.parse(json);
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
              name: `${method}#${pathName}`,
              method,
              path: pathName,
              detail: { method, path: pathName, ...detail }
            };
            tagPathMap[el].push(wrap);
            pathDetailMap[wrap.name] = wrap.detail;
            pathDetailMap[wrap.name].methodPath = wrap.name
          });
        }
      }
      this.pathDetailMap = pathDetailMap;

      this.viewTags.forEach(tag => {
        tag.paths = tagPathMap[tag.name] || [];
      });
    },
    selectPath(methodPath) {
      this.selectedPath = methodPath;
      this.selectedPathDetail = this.pathDetailMap[methodPath];
      console.log('SELECT', methodPath, this.selectedPathDetail);
    },
    toFlowDetail(filePath){
      console.log('toFlowDetail', filePath);
      this.tabName = 'Flow';
      this.flowFilePath = filePath;
    }
  },
  created: function () {
    this.serverUrl = localStorage.getItem(KEY_SERVER_URL)
    this.parseSwaggerJson()
  }
};
</script>