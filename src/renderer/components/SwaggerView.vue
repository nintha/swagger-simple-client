<template>
  <div>
    <Sider width="300" :style="{position: 'fixed', height: '99vh',left: 0, overflow: 'auto', backgroundColor: 'white', borderRight: '1px #CCC solid'}">
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
        <router-link :to="'/'" style="margin-left:-25px" >
          <Button>
            <Icon type="ios-arrow-back"></Icon>
          </Button>
        </router-link>
        <span style="font-weight: bolder; font-size:18px; vertical-align: middle; margin-left:10px;">{{jsonUrl}}</span>
      </Header>
      <Content>
        <div style="margin-top:10px; padding:0 10px; background-color: white;">
          <Tabs style="margin:0 10px;">
              <TabPane label="Flow">
                <ApiFlow :selected-path="selectedPath" :path-detail-map="pathDetailMap" :json-url="jsonUrl" :definitions="jsonData.definitions"></ApiFlow>
              </TabPane>
              <TabPane label="Main">
                <div v-if="selectedPathDetail">
                  <ApiRequestView :api-info="selectedPathDetail" :json-url="jsonUrl" :definitions="jsonData.definitions" :view-tags="viewTags"></ApiRequestView> 
                </div>
                <h1 v-else>
                  Please select one API
                </h1>
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

const KEY_SERVER_URL = 'API_DOCS_URL'
export default {
  components: {ApiRequestView, ApiFlow},
  data() {
    return {
      jsonUrl: "",
      jsonData: {},
      viewTags: [],
      pathDetailMap: {},
      selectedPathDetail: null,
      selectedPath: null
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
    }
  },
  created: function() {
    this.jsonUrl = localStorage.getItem(KEY_SERVER_URL)
    this.fetchSwaggerJson(this.jsonUrl)
  }
};
</script>