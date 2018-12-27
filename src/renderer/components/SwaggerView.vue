<template>
  <div>
    <Sider width="300" :style="{position: 'fixed', height: '99vh',left: 0, overflow: 'auto'}">
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
      <Content :style="{padding: '16px'}">
        <div v-if="selectedPathDetail">
          <ApiRequestView :api-info="selectedPathDetail" :json-url="jsonUrl" :definitions="this.jsonData.definitions"></ApiRequestView> 
        </div>
      </Content>
    </Layout>
  </div>
</template>

<script>
import ApiRequestView from './ApiRequestView.vue';
export default {
  components: {ApiRequestView},
  data() {
    return {
      jsonUrl: "",
      jsonData: {},
      viewTags: [],
      pathDetailMap: {},
      selectedPathDetail: null,
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
          });
        }
      }
      this.pathDetailMap = pathDetailMap;

      this.viewTags.forEach(tag => {
        tag.paths = tagPathMap[tag.name] || [];
      });
    },
    selectPath(methodPath) {
      this.selectedPathDetail = this.pathDetailMap[methodPath];
      this.selectedPathDetail.methodPath = methodPath
      console.log('SELECT', methodPath, this.selectedPathDetail);
    }
  },
  created: function() {
    this.jsonUrl = localStorage.getItem("API_DOCS_URL")
    this.fetchSwaggerJson(this.jsonUrl)
  }
};
</script>