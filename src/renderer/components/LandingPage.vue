<template>
  <Card>
    <div slot="title">Swagger Simple Client</div>
    <Input
      search
      enter-button="Fetch"
      placeholder="Swagger Json URL..."
      v-model="serverUrl"
      @on-search="jumpPage"
    />
  </Card>
</template>

<script>
const KEY_SERVER_URL = "API_DOCS_URL";
const KEY_SWAGGER_JSON = "KEY_SWAGGER_JSON";
const DEFAULT_SERVER_URL = "http://localhost:8080/v2/api-docs";
export default {
  name: "landing-page",
  data: function () {
    return {
      serverUrl: "",
      jsonData: {},
      viewTags: []
    };
  },
  methods: {
    async jumpPage(input) {
      localStorage.setItem(KEY_SERVER_URL, input);
      const res = await this.fetchSwaggerJson(input);

      if (res) {
        localStorage.setItem(KEY_SWAGGER_JSON, JSON.stringify(res.data));
      } else {
        return;
      }

      this.$router.push("/swagger");
    },
    loadServerUrl() {
      this.serverUrl = localStorage.getItem(KEY_SERVER_URL) || DEFAULT_SERVER_URL;
    },
    async fetchSwaggerJson(input) {
      this.$Spin.show();
      let res = null;
      try {
        res = await this.$http.get(input);
      } catch (error) {
        this.$Message.error(error.message);
      }
      this.$Spin.hide();
      return res;
    }

    // end method
  },
  created() {
    this.loadServerUrl();
  }
};
</script>

